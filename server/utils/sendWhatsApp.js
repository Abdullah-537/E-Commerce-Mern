const sendWhatsApp = async (to, body) => {
  if (!process.env.ULTRAMSG_INSTANCE_ID || !process.env.ULTRAMSG_TOKEN) {
    console.log('\n=== WhatsApp Message (Ultramsg not configured) ===');
    console.log(`To: ${to}`);
    console.log(`Message: ${body}`);
    console.log('================================================\n');
    return { idMessage: 'mock-' + Date.now(), status: 'sent' };
  }

  // Remove any '+' or spaces and ensure it's just digits
  let formattedNumber = to.toString().replace(/\D/g, '');
  
  // Convert Pakistani local format (0332...) to international (92332...)
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '92' + formattedNumber.substring(1);
  }
  
  console.log(`[WHATSAPP] Sending to: +${formattedNumber}`);

  const url = `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`;

  // Ultramsg uses x-www-form-urlencoded typically, but also supports JSON
  const params = new URLSearchParams();
  params.append('token', process.env.ULTRAMSG_TOKEN);
  params.append('to', `+${formattedNumber}`);
  params.append('body', body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { message: text };
    }
    
    return data;
  } catch (error) {
    console.error('Error sending Ultramsg WhatsApp:', error);
    // Don't throw, just log so the order still completes even if WhatsApp fails
    return { error: error.message };
  }
};

module.exports = sendWhatsApp;