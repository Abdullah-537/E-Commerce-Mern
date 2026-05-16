const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'ecommerce-7e6b0'
});

module.exports = admin;
