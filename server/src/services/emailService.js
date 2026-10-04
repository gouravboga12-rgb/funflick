import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER || 'funflick0308@gmail.com',
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send 6-digit OTP Email for Registration or Password Reset
 */
export async function sendOtpEmail({ toEmail, otpCode, username = '', type = 'registration' }) {
  const isReset = type === 'forgot_password';
  const subject = isReset 
    ? `FunFlicks Password Reset Code: ${otpCode}`
    : `Welcome to FunFlicks! Your Verification Code: ${otpCode}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090514; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 30px auto; background-color: #120b24; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px; }
        .logo-fun { color: #ffffff; }
        .logo-flick { background: linear-gradient(135deg, #ff007a 0%, #ff4b2b 50%, #7928ca 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .tagline { color: #f472b6; font-size: 13px; font-weight: 600; margin-top: -15px; margin-bottom: 25px; }
        .title { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #ffffff; }
        .desc { font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 30px; }
        .otp-box { background: linear-gradient(135deg, rgba(255,0,122,0.15), rgba(121,40,202,0.2)); border: 2px dashed #ff007a; border-radius: 18px; padding: 22px; margin: 25px auto; display: inline-block; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 20px rgba(255,0,122,0.5); }
        .expiry { font-size: 12px; color: #fb7185; font-weight: 600; margin-top: 10px; }
        .footer { font-size: 11px; color: #6b7280; margin-top: 35px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <span class="logo-fun">fun</span><span class="logo-flick">flick</span>
        </div>
        <div class="tagline">Comedy. Entertainment. Always On!</div>
        
        <div class="title">${isReset ? 'Password Reset Verification' : 'Verify Your Email Address'}</div>
        <div class="desc">
          ${isReset 
            ? `We received a request to reset your password for <strong>${username ? '@' + username : 'your FunFlicks account'}</strong>. Use the 6-digit verification code below to proceed:` 
            : `Hello ${username ? '@' + username : 'there'}! Use the 6-digit verification code below to complete your FunFlicks account registration:`}
        </div>

        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
          <div class="expiry">⏳ Valid for 10 minutes</div>
        </div>

        <div class="desc" style="font-size: 12px; color: #6b7280; margin-top: 20px;">
          Never share this code with anyone. FunFlicks staff will never ask for your verification code.
        </div>

        <div class="footer">
          FunFlicks Media & Entertainment Technologies Pvt. Ltd.<br>
          If you did not request this verification code, you can safely ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"FunFlicks" <funflick0308@gmail.com>',
    to: toEmail,
    subject,
    html,
  });

  return info;
}
