require('dotenv').config();
const nodemailer = require('nodemailer');

function getTransporter() {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '').trim() : null;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });
}

/**
 * Sends a 6-digit email verification OTP to the user.
 * In dev / test mode (or if SMTP isn't configured), logs the OTP prominently to the terminal.
 */
async function sendVerificationOtp(email, username, otp) {
  const expiryMinutes = 10;
  const transporter = getTransporter();
  const senderEmail = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;

  // Always log to console for instant local development and offline inspection
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│  ⚡ [CodeArena Auth] Email Verification OTP                │');
  console.log(`│  To:      ${email.padEnd(50)}│`);
  console.log(`│  User:    ${(username || 'Adventurer').padEnd(50)}│`);
  console.log(`│  OTP:     ${otp.padEnd(50)}│`);
  console.log(`│  Expires: in ${expiryMinutes} minutes                                      │`);
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  if (!transporter || !senderEmail) {
    return {
      success: true,
      delivered: false,
      notice: 'OTP logged to server console (SMTP not configured in .env).'
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CodeArena Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F3F4F6;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F19; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #111827; border-radius: 16px; border: 1px solid rgba(245, 158, 11, 0.25); overflow: hidden; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                    <div style="font-size: 32px; margin-bottom: 6px;">⚔️</div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #F59E0B; letter-spacing: -0.5px;">CodeArena</h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #9CA3AF;">Competitive Programming Arena</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #FFFFFF;">
                      Verify Your Email Address
                    </h2>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9CA3AF;">
                      Hi <strong>${username || 'Coder'}</strong>, thank you for joining CodeArena! Use the 6-digit verification code below to complete your registration and activate your account.
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background: #1F2937; border: 1px solid #F59E0B; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #F59E0B; margin-bottom: 8px;">
                        Your Verification Code
                      </div>
                      <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #FFFFFF; font-family: monospace;">
                        ${otp}
                      </div>
                    </div>

                    <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #6B7280; text-align: center;">
                      ⏱️ This code is valid for <strong>${expiryMinutes} minutes</strong>. Do not share this code with anyone.
                    </p>

                    <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #4B5563; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 20px;">
                      If you did not request this verification code, please ignore this email. Someone may have entered your email address by mistake.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 16px 32px 24px 32px; background-color: #0d121f; text-align: center; font-size: 12px; color: #6B7280;">
                    &copy; ${new Date().getFullYear()} CodeArena. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"CodeArena" <${senderEmail}>`,
      to: email,
      subject: `Your CodeArena Verification Code: ${otp}`,
      text: `Your CodeArena verification code is: ${otp}. It expires in ${expiryMinutes} minutes.`,
      html: htmlContent
    });
    console.log('✅ [CodeArena Mailer] Email dispatched successfully! Message ID:', info.messageId);
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error('⚠️ [CodeArena Mailer] Failed to deliver email:', err.message);
    return {
      success: true,
      delivered: false,
      error: err.message,
      notice: 'Fallback: check server console for OTP.'
    };
  }
}

module.exports = {
  sendVerificationOtp,
  getTransporter
};
