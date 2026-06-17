const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userRepository = require('../repositories/user.repository');
const { query } = require('../config/database');
const { generateToken } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const { AppError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

class AuthService {
  generateAccessToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  async register({ username, email, password, firstName, lastName, phone }) {
    // Check existing
    const [existingEmail, existingUsername] = await Promise.all([
      userRepository.findByEmail(email),
      userRepository.findByUsername(username),
    ]);

    if (existingEmail) throw new AppError('Email already registered.', 409);
    if (existingUsername) throw new AppError('Username already taken.', 409);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      uuid: uuidv4(),
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
    });

    // Create email verification token
    const verificationToken = generateToken(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      'INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, verificationToken, expiresAt]
    );

    // Send verification email (non-blocking)
    sendEmail(email, 'verifyEmail', [`${firstName} ${lastName}`, verificationToken])
      .catch(err => logger.warn('Verification email failed:', err.message));

    logger.info(`New user registered: ${email}`);
    return { user, verificationToken };
  }

  async login({ email, password, deviceInfo, ipAddress, userAgent }) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Check account lock
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMs = new Date(user.locked_until) - new Date();
      const remainingMins = Math.ceil(remainingMs / 60000);
      throw new AppError(`Account locked. Try again in ${remainingMins} minutes.`, 423);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const updates = { failedLoginAttempts: attempts };

      if (attempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min
        await userRepository.update(user.id, updates);
        throw new AppError('Too many failed attempts. Account locked for 30 minutes.', 423);
      }

      await userRepository.update(user.id, updates);
      throw new AppError(`Invalid email or password. ${5 - attempts} attempts remaining.`, 401);
    }

    // Reset failed attempts
    await userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    });

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO sessions (user_id, refresh_token, device_info, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, refreshToken, deviceInfo || null, ipAddress, userAgent, expiresAt]
    );

    logger.info(`User logged in: ${email}`);
    return { user, accessToken, refreshToken };
  }

  async refreshToken(refreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    const sessions = await query(
      'SELECT * FROM sessions WHERE refresh_token = ? AND is_active = 1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (!sessions.length) {
      throw new AppError('Session not found or expired.', 401);
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.is_active) {
      throw new AppError('User not found or deactivated.', 401);
    }

    const newAccessToken = this.generateAccessToken(user.id);
    return { accessToken: newAccessToken, user };
  }

  async logout(refreshToken, userId) {
    await query(
      'UPDATE sessions SET is_active = 0 WHERE refresh_token = ? AND user_id = ?',
      [refreshToken, userId]
    );
  }

  async logoutAll(userId) {
    await query(
      'UPDATE sessions SET is_active = 0 WHERE user_id = ?',
      [userId]
    );
  }

  async verifyEmail(token) {
    const verifications = await query(
      'SELECT * FROM email_verifications WHERE token = ? AND verified_at IS NULL AND expires_at > NOW()',
      [token]
    );

    if (!verifications.length) {
      throw new AppError('Invalid or expired verification token.', 400);
    }

    const verification = verifications[0];
    await Promise.all([
      query('UPDATE email_verifications SET verified_at = NOW() WHERE id = ?', [verification.id]),
      userRepository.update(verification.user_id, { isVerified: true }),
    ]);

    return userRepository.findById(verification.user_id);
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If that email is registered, you will receive a reset link.' };
    }

    // Invalidate existing tokens
    await query(
      'UPDATE password_resets SET used = 1 WHERE user_id = ?',
      [user.id]
    );

    const resetToken = generateToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    sendEmail(email, 'resetPassword', [`${user.first_name} ${user.last_name}`, resetToken])
      .catch(err => logger.warn('Reset email failed:', err.message));

    return { message: 'If that email is registered, you will receive a reset link.' };
  }

  async resetPassword(token, newPassword) {
    const resets = await query(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()',
      [token]
    );

    if (!resets.length) {
      throw new AppError('Invalid or expired reset token.', 400);
    }

    const reset = resets[0];
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await Promise.all([
      userRepository.update(reset.user_id, { password: hashedPassword }),
      query('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]),
      query('UPDATE sessions SET is_active = 0 WHERE user_id = ?', [reset.user_id]),
    ]);

    return { message: 'Password reset successful.' };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      throw new AppError('Current password is incorrect.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await userRepository.update(userId, { password: hashedPassword });

    // Invalidate all sessions
    await query('UPDATE sessions SET is_active = 0 WHERE user_id = ?', [userId]);

    return { message: 'Password changed successfully.' };
  }
}

module.exports = new AuthService();
