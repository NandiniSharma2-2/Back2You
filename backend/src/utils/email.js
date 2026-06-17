const nodemailer = require('nodemailer');
const logger = require('./logger');

// nodemailer.createTransport (not createTransporter)
const nm = nodemailer.default || nodemailer;

let transporter;
try {
  transporter = nm.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  });
} catch (e) {
  logger.warn('Email transporter init failed (emails disabled):', e.message);
  transporter = null;
}

const emailTemplates = {
  verifyEmail: (name, token) => ({
    subject: '🔮 Verify Your Back2You Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { background: #121214; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #0A0F1D; border: 1px solid #00F0FF33; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0A0F1D, #121214); padding: 40px; text-align: center; border-bottom: 1px solid #00F0FF33; }
          .logo { font-size: 32px; font-weight: 900; color: #00F0FF; letter-spacing: 4px; text-shadow: 0 0 20px #00F0FF88; }
          .body { padding: 40px; }
          h2 { color: #00F0FF; margin-bottom: 20px; }
          p { color: #a0aec0; line-height: 1.7; }
          .btn { display: inline-block; background: linear-gradient(135deg, #00F0FF, #FF007F); color: #000; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 24px 0; letter-spacing: 1px; }
          .footer { padding: 24px 40px; border-top: 1px solid #00F0FF22; text-align: center; color: #4a5568; font-size: 12px; }
          .token-box { background: #121214; border: 1px solid #00F0FF33; border-radius: 8px; padding: 16px; font-family: monospace; color: #00F0FF; word-break: break-all; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">BACK2YOU</div>
            <p style="color: #00F0FF88; margin: 8px 0 0; font-size: 14px; letter-spacing: 2px;">LOST & FOUND NETWORK</p>
          </div>
          <div class="body">
            <h2>Welcome, ${name}</h2>
            <p>Your account has been created. Verify your email to activate your access to the Back2You recovery network.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}" class="btn">VERIFY EMAIL →</a>
            </div>
            <p>Or use this verification code:</p>
            <div class="token-box">${token}</div>
            <p style="font-size: 13px; color: #4a5568;">This link expires in 24 hours. If you didn't create this account, ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Back2You. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  resetPassword: (name, token) => ({
    subject: '🔐 Reset Your Back2You Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { background: #121214; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #0A0F1D; border: 1px solid #FF007F33; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0A0F1D, #121214); padding: 40px; text-align: center; border-bottom: 1px solid #FF007F33; }
          .logo { font-size: 32px; font-weight: 900; color: #FF007F; letter-spacing: 4px; text-shadow: 0 0 20px #FF007F88; }
          .body { padding: 40px; }
          h2 { color: #FF007F; margin-bottom: 20px; }
          p { color: #a0aec0; line-height: 1.7; }
          .btn { display: inline-block; background: linear-gradient(135deg, #FF007F, #00F0FF); color: #000; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 24px 0; letter-spacing: 1px; }
          .footer { padding: 24px 40px; border-top: 1px solid #FF007F22; text-align: center; color: #4a5568; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">BACK2YOU</div>
          </div>
          <div class="body">
            <h2>Password Reset Request</h2>
            <p>Hi ${name}, we received a request to reset your password.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}" class="btn">RESET PASSWORD →</a>
            </div>
            <p style="font-size: 13px; color: #4a5568;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Back2You. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  claimUpdate: (name, status, itemName) => ({
    subject: `📦 Claim Update: ${itemName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="background: #121214; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: #0A0F1D; border: 1px solid #00F0FF33; border-radius: 12px; padding: 40px;">
          <div style="font-size: 28px; font-weight: 900; color: #00F0FF; letter-spacing: 4px; margin-bottom: 24px;">BACK2YOU</div>
          <h2 style="color: #00F0FF;">Claim Status Update</h2>
          <p>Hi ${name}, your claim for <strong style="color: #00F0FF;">${itemName}</strong> has been updated.</p>
          <p>Status: <strong style="color: ${status === 'approved' ? '#39FF14' : status === 'rejected' ? '#FF3B3B' : '#00F0FF'};">${status.toUpperCase()}</strong></p>
          <a href="${process.env.FRONTEND_URL}/dashboard/claims" style="display: inline-block; background: linear-gradient(135deg, #00F0FF, #FF007F); color: #000; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin-top: 24px;">VIEW CLAIM →</a>
        </div>
      </body>
      </html>
    `,
  }),
};

async function sendEmail(to, templateName, templateData) {
  if (!transporter || !process.env.EMAIL_USER) {
    logger.info(`Email skipped (not configured): ${templateName} to ${to}`);
    return { success: false, error: 'Email not configured' };
  }
  try {
    const template = emailTemplates[templateName](...templateData);
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Back2You <noreply@back2you.com>',
      to,
      subject: template.subject,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };
