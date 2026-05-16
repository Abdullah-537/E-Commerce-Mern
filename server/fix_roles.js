const mongoose = require('mongoose');
mongoose.connect('mongodb://abdullahhhh166_db_user:Abdullah243537@ac-jdsxkzr-shard-00-00.0ryjwg4.mongodb.net:27017,ac-jdsxkzr-shard-00-01.0ryjwg4.mongodb.net:27017,ac-jdsxkzr-shard-00-02.0ryjwg4.mongodb.net:27017/shopzone?ssl=true&authSource=admin&replicaSet=atlas-ynyqrv-shard-0&retryWrites=true&w=majority').then(async () => {
  const User = require('./models/User');
  // Revert all users to customer EXCEPT the actual admin and vendor accounts
  await User.updateMany({ email: { $nin: ['admin@shopzone.com', 'vendor_seed@shopzone.com'] } }, { role: 'customer' });
  console.log('Roles reverted to customer');
  process.exit(0);
}).catch(console.error);
