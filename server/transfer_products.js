require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Vendor = require('./models/Vendor');
const User = require('./models/User');

async function transfer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const seedVendor = await Vendor.findById('6a098862d248345d006df533');
    const alAbdVendor = await Vendor.findById('6a09adb4af0d50a05f236aa7');

    if (!seedVendor || !alAbdVendor) {
      console.log('Vendors not found!');
      process.exit(1);
    }

    // Delete current AL-Abd products (the ones I just created)
    await Product.deleteMany({ vendorId: alAbdVendor._id });
    console.log('Deleted existing products for Al-Abd Vendors');

    // Transfer Seed Store products to AL-Abd Vendors
    const result = await Product.updateMany(
      { vendorId: seedVendor._id },
      { $set: { vendorId: alAbdVendor._id } }
    );
    console.log(`Transferred ${result.modifiedCount} products to Al-Abd Vendors`);

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

transfer();
