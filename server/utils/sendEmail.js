// Strip surrounding quotes that Render may include from .env copy-paste
const stripQuotes = (str) => str ? str.replace(/^["']|["']$/g, '') : str;

const sendEmail = async (to, subject, html) => {
  const emailUser = stripQuotes(process.env.EMAIL_USER);
  const emailPass = stripQuotes(process.env.EMAIL_PASS);

  if (!emailUser || !emailPass) {
    throw new Error(`Email credentials not configured in environment variables. EMAIL_USER=${!!emailUser}, EMAIL_PASS=${!!emailPass}`);
  }

  console.log(`[EMAIL] Relaying email to Vercel API for: ${to} | Subject: ${subject}`);

  try {
    // Vercel app URL (the frontend)
    const vercelUrl = process.env.CLIENT_URL || 'https://e-commerce-mern-fawn-delta.vercel.app';
    const apiUrl = `${vercelUrl}/api/send-email`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        authUser: emailUser,
        authPass: emailPass
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unknown error from Vercel Email API');
    }

    console.log(`[EMAIL] Sent successfully via Vercel! MessageId: ${data.messageId}`);
    return data;
  } catch (error) {
    console.error(`[EMAIL] FAILED to send to ${to} via Vercel API:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;