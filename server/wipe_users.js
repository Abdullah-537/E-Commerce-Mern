const mongoose = require('mongoose');
mongoose.connect('mongodb://abdullahhhh166_db_user:Abdullah243537@ac-jdsxkzr-shard-00-00.0ryjwg4.mongodb.net:27017,ac-jdsxkzr-shard-00-01.0ryjwg4.mongodb.net:27017,ac-jdsxkzr-shard-00-02.0ryjwg4.mongodb.net:27017/shopzone?ssl=true&authSource=admin&replicaSet=atlas-ynyqrv-shard-0&retryWrites=true&w=majority').then(async () => {
  const User = require('./models/User');
  const Vendor = require('./models/Vendor');
  const Cart = require('./models/Cart');
  const Order = require('./models/Order');

  // We will NOT wipe products/categories so they don't lose the UI data.
  // We WILL wipe Users, Vendors, Carts to give them a fresh slate.
  await User.deleteMany({});
  await Vendor.deleteMany({});
  await Cart.deleteMany({});
  
  // 1. Admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@shopzone.com',
    passwordHash: 'dummyhash123', // Doesn't matter, they use Google Login or simple password if bypassed. Actually, if they use Google login, Google will match the email!
    role: 'admin',
    isVerified: true
  });

  // 2. Vendor
  const vendorUser = await User.create({
    name: 'Vendor User',
    email: 'vendor@shopzone.com',
    passwordHash: 'dummyhash123',
    role: 'vendor',
    isVerified: true
  });

  await Vendor.create({
    userId: vendorUser._id,
    businessName: 'The Fresh Market',
    businessEmail: 'vendor@shopzone.com',
    phone: '1234567890',
    address: 'Vendor Street 123',
    bankName: 'Vendor Bank',
    accountNumber: '123456789',
    status: 'approved'
  });

  // 3. Customer
  await User.create({
    name: 'Customer User',
    email: 'customer@shopzone.com',
    passwordHash: 'dummyhash123',
    role: 'customer',
    isVerified: true
  });

  console.log('Successfully wiped and seeded 3 exact users: admin, vendor, customer.');
  process.exit(0);
}).catch(console.error);
