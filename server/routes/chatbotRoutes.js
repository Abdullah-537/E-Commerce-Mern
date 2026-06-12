const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Public route for chatbot
router.post('/', chatbotController.handleChat);

module.exports = router;
