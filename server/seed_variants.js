require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const Product = require('./models/Product');
const ProductVariant = require('./models/ProductVariant');
const Category = require('./models/Category');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Reset user password
    const email = 'abdullahhhh.166@gmail.com';
    const newPass = 'Abdullah@243537';
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPass, salt);
    await user.save();
    console.log(`Password reset for ${email} to ${newPass}`);

    // Find vendor
    const vendor = await Vendor.findOne({ userId: user._id });
    if (!vendor) {
      console.log('Vendor not found for user');
      process.exit(1);
    }
    console.log(`Vendor found: ${vendor.businessName} (${vendor.slug})`);

    // Find category for products
    let category = await Category.findOne({ name: 'Clothing' });
    if (!category) {
      category = await Category.findOne();
    }

    // Delete existing products
    const existingProducts = await Product.find({ vendorId: vendor._id });
    const productIds = existingProducts.map(p => p._id);
    await Product.deleteMany({ vendorId: vendor._id });
    await ProductVariant.deleteMany({ productId: { $in: productIds } });
    console.log('Deleted existing products and variants for vendor');

    // Create a product with variants
    const productData = {
      vendorId: vendor._id,
      categoryId: category._id,
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-t-shirt-' + Date.now(),
      description: 'High quality premium cotton t-shirt for everyday wear.',
      price: 1500,
      stock: 50,
      hasVariants: true,
      images: [
        '/assets/img/products/1.png',
        '/assets/img/products/2.png'
      ],
      variants: [
        { name: 'Size', value: 'Small', image: '' },
        { name: 'Size', value: 'Medium', image: '' },
        { name: 'Size', value: 'Large', image: '' },
        { name: 'Color', value: 'Red', image: '/assets/img/products/1.png' },
        { name: 'Color', value: 'Blue', image: '/assets/img/products/2.png' },
      ],
      isActive: true,
      status: 'published'
    };

    const newProduct = await Product.create(productData);
    console.log('Created product: ' + newProduct.name);

    // Create combinations
    const sizes = ['Small', 'Medium', 'Large'];
    const colors = ['Red', 'Blue'];

    for (const size of sizes) {
      for (const color of colors) {
        await ProductVariant.create({
          productId: newProduct._id,
          attributes: { Size: size, Color: color },
          price: 1500 + (size === 'Large' ? 200 : 0), // Large costs 200 more
          stock: 10,
          sku: `TSHIRT-${size.charAt(0)}-${color.charAt(0)}`
        });
      }
    }
    console.log('Created product variants combinations');

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
