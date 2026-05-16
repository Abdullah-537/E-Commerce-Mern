const sendWhatsApp = async (to, body) => {
  if (!process.env.GREEN_API_ID_INSTANCE || !process.env.GREEN_API_TOKEN) {
    console.log('\n=== WhatsApp Message (Green API not configured) ===');
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
  
  console.log(`[WHATSAPP] Sending to: ${formattedNumber}@c.us`);
  const chatId = `${formattedNumber}@c.us`;

  // Ensure URL doesn't have a double slash
  const baseUrl = process.env.GREEN_API_URL.replace(/\/$/, '');
  const url = `${baseUrl}/waInstance${process.env.GREEN_API_ID_INSTANCE}/sendMessage/${process.env.GREEN_API_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: chatId,
        message: body
      })
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
    console.error('Error sending Green API WhatsApp:', error);
    // Don't throw, just log so the order still completes even if WhatsApp fails
    return { error: error.message };
  }
};

module.exports = sendWhatsApp;