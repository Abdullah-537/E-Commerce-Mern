const nodemailer = require('nodemailer');

// Strip surrounding quotes that Render may include from .env copy-paste
const stripQuotes = (str) => str ? str.replace(/^["']|["']$/g, '') : str;

const sendEmail = async (to, subject, html) => {
  const emailUser = stripQuotes(process.env.EMAIL_USER);
  const emailPass = stripQuotes(process.env.EMAIL_PASS);

  // Check if email credentials are configured
  if (!emailUser || !emailPass) {
    console.log('\n=== Email (Nodemailer not configured) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.substring(0, 200)}...`);
    console.log('==========================================\n');
    return { messageId: 'mock-' + Date.now() };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 10000, // 10s connect timeout
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  console.log(`[EMAIL] Sending to: ${to} | Subject: ${subject}`);

  const result = await transporter.sendMail({
    from: emailUser,
    to,
    subject,
    html,
  });

  console.log(`[EMAIL] Sent successfully. MessageId: ${result.messageId}`);
  return result;
};

module.exports = sendEmail;