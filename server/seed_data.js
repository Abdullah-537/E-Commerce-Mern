require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const slugify = require('slugify');
const { uploadImage } = require('./utils/cloudinary');
const fs = require('fs');
const path = require('path');

// Fallback base64 images to seed if needed
// A simple transparent pixel to avoid huge scripts, or I can use existing URLs
const dummyImage = 'https://res.cloudinary.com/dxkufyse2/image/upload/v1715764200/shopzone/products/placeholder.jpg';

const categoriesToSeed = [
  { name: 'Electronics', image: 'https://res.cloudinary.com/dxkufyse2/image/upload/v1715764201/shopzone/categories/electronics.png' },
  { name: 'Fashion', image: 'https://res.cloudinary.com/dxkufyse2/image/upload/v1715764202/shopzone/categories/fashion.png' },
  { name: 'Home & Garden', image: 'https://res.cloudinary.com/dxkufyse2/image/upload/v1715764203/shopzone/categories/home.png' },
  { name: 'Grocery', image: 'https://res.cloudinary.com/dxkufyse2/image/upload/v1715764204/shopzone/categories/grocery.png' },
  { name: 'Sports', image: 'https://res.cloudinary.com/dxkufyse2/image/upload/v1715764205/shopzone/categories/sports.png' },
];

const productsToSeed = [
  { name: 'MacBook Pro M2 14-inch', price: 350000, salePrice: 340000, stock: 15, category: 'Electronics', images: ['https://prium.github.io/phoenix/v1.24.0/assets/img/products/1.png'] },
  { name: 'Sony Alpha a7 III Camera', price: 420000, salePrice: 399000, stock: 8, category: 'Electronics', images: ['https://prium.github.io/phoenix/v1.24.0/assets/img/products/2.png'] },
  { name: 'Apple Watch Series 8', price: 95000, salePrice: null, stock: 25, category: 'Electronics', images: ['https://prium.github.io/phoenix/v1.24.0/assets/img/products/3.png'] },
  { name: 'Mens Casual Denim Jacket', price: 4500, salePrice: 3500, stock: 50, category: 'Fashion', images: ['https://prium.github.io/phoenix/v1.24.0/assets/img/products/4.png'] },
  { name: 'Womens Summer Dress', price: 6500, salePrice: 4500, stock: 30, category: 'Fashion', images: ['https://prium.github.io/phoenix/v1.24.0/assets/img/products/5.png'] },
  { name: 'Smart Home Speaker Hub', price: 15000, salePrice: 12000, stock: 120, category: 'Home & Garden', images: ['https://prium.github.io/phoenix/v1.24.0/assets/img/products/6.png'] },
  { name: 'Organic Green Tea Pack', price: 1200, salePrice: null, stock: 200, category: 'Grocery', images: ['https://prium.github.io/phoenix/v1.24.0/assets/img/products/7.png'] },
  { name: 'Pro Tennis Racket', price: 18000, salePrice: 15500, stock: 45, category: 'Sports', images: ['https://prium.github.io/phoenix/v1.24.0/assets/img/products/8.png'] }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure we have an admin/vendor
    let user = await User.findOne({ role: 'vendor' });
    if (!user) {
      user = await User.create({
        name: 'Seed Vendor',
        email: 'vendor_seed@shopzone.com',
        passwordHash: 'dummyhash123',
        role: 'vendor',
        isVerified: true
      });
    }

    let vendor = await Vendor.findOne({ userId: user._id });
    if (!vendor) {
      vendor = await Vendor.create({
        userId: user._id,
        businessName: 'Seed Store Official',
        businessEmail: 'vendor_seed@shopzone.com',
        phone: '1234567890',
        address: '123 Seed Market',
        bankName: 'Seed Bank',
        accountNumber: '123456789',
        status: 'approved'
      });
    }

    // 2. Create Categories
    const categoryMap = {};
    for (const cat of categoriesToSeed) {
      let category = await Category.findOne({ slug: slugify(cat.name, { lower: true }) });
      if (!category) {
        category = await Category.create({
          name: cat.name,
          slug: slugify(cat.name, { lower: true }),
          imageUrl: cat.image
        });
        console.log(`Created category: ${cat.name}`);
      } else if (!category.imageUrl) {
        category.imageUrl = cat.image;
        await category.save();
        console.log(`Updated category image: ${cat.name}`);
      }
      categoryMap[cat.name] = category._id;
    }

    // 3. Create Products
    for (const prod of productsToSeed) {
      let product = await Product.findOne({ slug: { $regex: new RegExp(`^${slugify(prod.name, { lower: true })}`) } });
      if (!product) {
        await Product.create({
          vendorId: vendor._id,
          name: prod.name,
          slug: `${slugify(prod.name, { lower: true })}-${Date.now()}`,
          description: `High-quality ${prod.name} with premium features.`,
          categoryId: categoryMap[prod.category],
          price: prod.price,
          salePrice: prod.salePrice,
          images: prod.images,
          stock: prod.stock,
          tags: ['seed', 'premium']
        });
        console.log(`Created product: ${prod.name}`);
      } else {
        // Update images if necessary
        product.images = prod.images;
        await product.save();
        console.log(`Updated product: ${prod.name}`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedData();
