const { OpenAI } = require('openai');
const Product = require('../models/Product');

exports.handleChat = async (req, res, next) => {
  try {
    const { message, history } = req.body; 

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const openai = new OpenAI({ 
      apiKey: process.env.OPENCODE_API_KEY,
      baseURL: 'https://opencode.ai/zen/v1'
    });

    // Fetch live products from MongoDB to feed into context
    const liveProducts = await Product.find({ isActive: true, status: 'published' }, 'name price categoryId vendorId stock')
      .populate('categoryId', 'name')
      .populate('vendorId', 'businessName')
      .limit(30);

    const simplifiedCatalog = liveProducts.map(p => 
      `${p.name} (Rs.${p.price}) - Vendor: ${p.vendorId?.businessName || 'ShopZone Direct'} - Stock: ${p.stock}`
    ).join('\n');

    const systemInstruction = `
      You are a brilliant customer support AI for our E-commerce store, ShopZone. 
      Your ONLY purpose is to answer queries related to our store, products, orders, and policies.
      
      LIVE PRODUCT CATALOG:
      ${simplifiedCatalog}
      
      STRICT RULES:
      1. Only discuss products present in the Live Product Catalog above. If asked about items we don't sell, state nicely that we don't carry them.
      2. If a user asks about general topics (e.g., coding, math, recipes, world history, writing essays), you must politely decline.
      3. Example rejection: "I'm sorry, I am only trained to assist with questions regarding our store, products, and your orders."
      4. The store is based in Pakistan. ALL prices are in Pakistani Rupees (PKR or Rs). NEVER use Indian Rupees (INR) or other currencies.
      5. Keep your answers clear, professional, and friendly. Use a Pakistani context where applicable.
    `;

    // History expected to be in OpenAI format: [{role: 'user'|'assistant', content: '...'}]
    const messages = [
      { role: 'system', content: systemInstruction },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const apiCall = openai.chat.completions.create({
      model: 'nemotron-3-super-free', // OpenCode Zen - fast & reliable free model
      messages: messages,
    });

    // Instead of crashing, we gracefully fallback if Opencode takes longer than 15 seconds
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({
        choices: [{ message: { content: "I'm sorry, but my AI servers are currently overloaded and took too long to respond. Please try asking your question again in a moment." } }]
      }), 15000)
    );

    const response = await Promise.race([apiCall, timeoutPromise]);

    res.json({ success: true, reply: response.choices[0].message.content });

  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};
