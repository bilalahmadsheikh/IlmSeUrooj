/**
 * Email sending utility for Anqa.
 *
 * Configure via environment variables:
 *   SMTP_HOST      — e.g. smtp.gmail.com
 *   SMTP_PORT      — e.g. 587
 *   SMTP_USER      — your email address
 *   SMTP_PASS      — app password (Gmail) or SMTP password
 *   SMTP_FROM      — display name + address, e.g. "Anqa <no-reply@yourdomain.com>"
 *
 * If SMTP_HOST is not set the OTP is logged to the server console so local
 * development works without any mail configuration.
 */

import nodemailer from 'nodemailer';

interface SendOtpOptions {
  to: string;
  otp: string;
  universityName: string;
}

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationOtp({ to, otp, universityName }: SendOtpOptions): Promise<void> {
  const transporter = buildTransporter();
  const from = process.env.SMTP_FROM || '"Anqa" <no-reply@anqa.pk>';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your University Email</title>
  <style>
    body { margin: 0; padding: 0; background: #0A1F1C; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #132E29; border-radius: 16px; overflow: hidden; border: 1px solid rgba(16,185,129,0.2); }
    .header { background: linear-gradient(135deg, #10B981, #059669); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
    .body { padding: 32px 40px; }
    .body p { color: #C8D9D5; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
    .otp-box { background: rgba(16,185,129,0.08); border: 2px dashed rgba(16,185,129,0.4); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp { font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #10B981; font-family: monospace; }
    .otp-label { display: block; margin-top: 8px; font-size: 12px; color: #6B9E8E; text-transform: uppercase; letter-spacing: 1px; }
    .warning { background: rgba(212,165,116,0.1); border-left: 3px solid #D4A574; border-radius: 0 8px 8px 0; padding: 12px 16px; font-size: 12px; color: #D4A574; margin: 16px 0 0; }
    .footer { padding: 20px 40px; border-top: 1px solid rgba(16,185,129,0.1); text-align: center; font-size: 11px; color: #4A7A6A; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Verify Your University Email</h1>
      <p>${universityName} • Anqa</p>
    </div>
    <div class="body">
      <p>You requested to verify your university email address to post a review of <strong style="color:#F5F5F0">${universityName}</strong>.</p>
      <p>Enter this one-time code in the verification dialog:</p>
      <div class="otp-box">
        <div class="otp">${otp}</div>
        <span class="otp-label">Expires in 15 minutes</span>
      </div>
      <p>If you did not request this, simply ignore this email — no action is needed.</p>
      <div class="warning">
        Never share this code with anyone. Anqa will never ask for it via phone or chat.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Anqa — Soar to Your Dream University
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    // Development fallback — OTP printed to server console
    console.log(`\n[Anqa Email — DEV MODE]\nTo: ${to}\nOTP: ${otp}\n`);
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject: `${otp} — Verify your ${universityName} email on Anqa`,
    html,
    text: `Your Anqa verification code for ${universityName} is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, ignore this email.`,
  });
}
