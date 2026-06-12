const nodemailer = require('nodemailer');

// Strip surrounding quotes that Render may include from .env copy-paste
const stripQuotes = (str) => str ? str.replace(/^["']|["']$/g, '') : str;

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const emailUser = stripQuotes(process.env.EMAIL_USER);
  const emailPass = stripQuotes(process.env.EMAIL_PASS);

  if (!emailUser || !emailPass) return null;

  // Use explicit SMTP config instead of service shorthand — more reliable on cloud
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false, // allow self-signed certs on cloud
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    pool: true,
    maxConnections: 3,
  });

  return transporter;
};

const sendEmail = async (to, subject, html) => {
  const emailUser = stripQuotes(process.env.EMAIL_USER);
  const emailPass = stripQuotes(process.env.EMAIL_PASS);

  // Check if email credentials are configured
  if (!emailUser || !emailPass) {
    console.log('\n=== Email (Nodemailer not configured) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('==========================================\n');
    return { messageId: 'mock-' + Date.now() };
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