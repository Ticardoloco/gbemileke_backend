import nodemailer from 'nodemailer';

interface SendEmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error("❌ CRITICAL: Missing SMTP environment variables in backend!");
    console.error({ SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass ? "EXISTS" : "MISSING" });
    throw new Error('Missing SMTP configuration. Please check environment variables.');
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    // Fixes self-signed certificate / strict network issues in local dev:
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10s timeout instead of hanging indefinitely
  });

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Gbemileke Hospital'}" <${
      process.env.SMTP_FROM_EMAIL || user
    }>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset email successfully sent to ${options.email}`);
  } catch (error: any) {
    console.error('❌ Nodemailer Send Error:', error);
    throw new Error(`Email dispatch failed: ${error.message}`);
  }
};