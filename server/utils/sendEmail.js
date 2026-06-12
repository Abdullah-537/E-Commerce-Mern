const nodemailer = require('nodemailer');

// Strip surrounding quotes that Render may include from .env copy-paste
const stripQuotes = (str) => str ? str.replace(/^["']|["']$/g, '') : str;

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const emailUser = stripQuotes(process.env.EMAIL_USER);
  const emailPass = stripQuotes(process.env.EMAIL_PASS);

  if (!emailUser || !emailPass) return null;

  // Use explicit SMTP config. Force IPv4 (family: 4) because Google often drops IPv6 connections from cloud servers, causing ETIMEDOUT.
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    requireTLS: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4, // Force IPv4
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
};

const sendEmail = async (to, subject, html) => {
  const emailUser = stripQuotes(process.env.EMAIL_USER);
  const emailPass = stripQuotes(process.env.EMAIL_PASS);

  // Check if email credentials are configured
  if (!emailUser || !emailPass) {
    throw new Error(`Email credentials not configured in environment variables. EMAIL_USER=${!!emailUser}, EMAIL_PASS=${!!emailPass}`);
  }

  const transport = getTransporter();
  if (!transport) {
    console.error('[EMAIL] Failed to create transporter');
    return { messageId: 'error-' + Date.now() };
  }

  console.log(`[EMAIL] Sending to: ${to} | Subject: ${subject}`);

  try {
    const result = await transport.sendMail({
      from: `"ShopZone" <${emailUser}>`,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] Sent successfully! MessageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`[EMAIL] FAILED to send to ${to}:`, error.message);
    console.error(`[EMAIL] Error code: ${error.code}, command: ${error.command}`);
    throw error;
  }
};

module.exports = sendEmail;