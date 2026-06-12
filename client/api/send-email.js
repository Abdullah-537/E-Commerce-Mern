import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, authUser, authPass } = req.body;

    if (!to || !subject || !html || !authUser || !authPass) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: authUser,
        pass: authPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"ShopZone" <${authUser}>`,
      to,
      subject,
      html,
    });

    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: error.message, code: error.code });
  }
}
