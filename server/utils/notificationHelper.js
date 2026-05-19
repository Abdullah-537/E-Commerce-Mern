const Notification = require('../models/Notification');
const User = require('../models/User');

exports.createNotification = async ({ userId, title, message, link, type = 'system' }) => {
  try {
    // If no userId, assume it's an admin notification
    if (!userId) {
      const admins = await User.find({ role: 'admin' });
      const notifications = admins.map(admin => ({
        userId: admin._id,
        title,
        message,
        link,
        type
      }));
      await Notification.insertMany(notifications);
    } else {
      await Notification.create({
        userId,
        title,
        message,
        link,
        type
      });
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};
