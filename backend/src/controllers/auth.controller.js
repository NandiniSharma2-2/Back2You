const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');
const { sanitizeUser } = require('../utils/helpers');
const { AppError } = require('../middleware/error.middleware');

class AuthController {
  async register(req, res, next) {
    try {
      const { username, email, password, firstName, lastName, phone } = req.body;
      const { user } = await authService.register({
        username, email, password, firstName, lastName, phone,
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: { user: sanitizeUser(user) },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login({
        email, password,
        deviceInfo: req.headers['user-agent'],
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: sanitizeUser(user),
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
      if (!refreshToken) throw new AppError('Refresh token required.', 401);

      const { accessToken, user } = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: { accessToken, user: sanitizeUser(user) },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken, req.user.id);
      }

      res.clearCookie('refresh_token');
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      const user = await authService.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully.',
        data: { user: sanitizeUser(user) },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      const result = await authService.resetPassword(token, password);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await userRepository.findById(req.user.id);
      res.json({ success: true, data: { user: sanitizeUser(user) } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
