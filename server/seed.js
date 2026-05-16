require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Vendor = require('./models/Vendor');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');

const connectDB = require('./config/db');

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Vendor.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin
    const adminSalt = await bcrypt.genSalt(12);
    const adminPassword = await bcrypt.hash('Admin@123', adminSalt);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@shopzone.pk',
      passwordHash: adminPassword,
      role: 'admin',
      isVerified: true,
    });
    console.log('Admin created: admin@shopzone.pk / Admin@123');

    // Create Customers
    const customerSalt = await bcrypt.genSalt(12);
    const customerPassword = await bcrypt.hash('Test@123', customerSalt);

    const customer1 = await User.create({
      name: 'Ahmed Ali',
      email: 'ahmed@test.com',
      passwordHash: customerPassword,
      phone: '+923001234567',
      role: 'customer',
      isVerified: true,
    });

    const customer2 = await User.create({
      name: 'Sara Khan',
      email: 'sara@test.com',
      passwordHash: customerPassword,
      phone: '+923009876543',
      role: 'customer',
      isVerified: true,
    });
    console.log('Customers created: ahmed@test.com / Test@123, sara@test.com / Test@123');

    // Create Categories
    const categories = await Category.insertMany([
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Books', slug: 'books' },
      { name: 'Sports', slug: 'sports' },
      { name: 'Home & Kitchen', slug: 'home-kitchen' },
    ]);

    // Subcategories
    const electronics = categories[0]._id;
    const clothing = categories[1]._id;
    const books = categories[2]._id;

    const subCategories = await Category.insertMany([
      { name: 'Mobiles', slug: 'mobiles', parentId: electronics },
      { name: 'Laptops', slug: 'laptops', parentId: electronics },
      { name: 'Accessories', slug: 'accessories', parentId: electronics },
      { name: 'Men', slug: 'men', parentId: clothing },
      { name: 'Women', slug: 'women', parentId: clothing },
      { name: 'Kids', slug: 'kids', parentId: clothing },
      { name: 'Fiction', slug: 'fiction', parentId: books },
      { name: 'Non-Fiction', slug: 'non-fiction', parentId: books },
    ]);
    console.log('Categories created');

    // Create Vendors
    const vendorSalt = await bcrypt.genSalt(12);
    const vendorPassword = await bcrypt.hash('Vendor@123', vendorSalt);

    const vendorUser1 = await User.create({
      name: 'TechHub Store',
      email: 'techhub@test.com',
      passwordHash: vendorPassword,
      role: 'vendor',
      isVerified: true,
    });

    const vendorUser2 = await User.create({
      name: 'FashionZone',
      email: 'fashion@test.com',
      passwordHash: vendorPassword,
      role: 'vendor',
      isVerified: true,
    });

    const vendorUser3 = await User.create({
      name: 'BookWorld',
      email: 'bookworld@test.com',
      passwordHash: vendorPassword,
      role: 'vendor',
      isVerified: true,
    });

    const techHub = await Vendor.create({
      userId: vendorUser1._id,
      businessName: 'TechHub Store',
      slug: 'techhub-store',
      status: 'approved',
      commissionRate: 10,
      businessEmail: 'techhub@test.com',
      businessPhone: '+923001111111',
      description: 'Your trusted electronics store',
      bankName: 'HBL',
      accountNumber: '1234567890',
      accountTitle: 'TechHub Store',
    });

    const fashionZone = await Vendor.create({
      userId: vendorUser2._id,
      businessName: 'FashionZone',
      slug: 'fashionzone',
      status: 'approved',
      commissionRate: 12,
      businessEmail: 'fashion@test.com',
      businessPhone: '+923002222222',
      description: 'Trendy fashion for everyone',
      bankName: 'UBL',
      accountNumber: '0987654321',
      accountTitle: 'FashionZone',
    });

    const bookWorld = await Vendor.create({
      userId: vendorUser3._id,
      businessName: 'BookWorld',
      slug: 'bookworld',
      status: 'pending',
      commissionRate: 10,
      businessEmail: 'bookworld@test.com',
      businessPhone: '+923003333333',
      description: 'Books for all ages',
      bankName: 'MCB',
      accountNumber: '5678901234',
      accountTitle: 'BookWorld',
    });
    console.log('Vendors created: techhub@test.com, fashion@test.com, bookworld@test.com (all Vendor@123)');

    // Products: User will add via vendor dashboard
    console.log('Products skipped (add via vendor dashboard)');

    // Create Coupons
    await Coupon.insertMany([
      {
        code: 'SAVE10',
        type: 'platform',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 1000,
        expiresAt: new Date('2026-12-31'),
      },
      {
        code: 'FLAT200',
        type: 'platform',
        discountType: 'fixed',
        discountValue: 200,
        minOrderAmount: 2000,
        expiresAt: new Date('2026-12-31'),
      },
    ]);
    console.log('Coupons created');

    console.log('\n=== Seed Complete ===');
    console.log('\nTest Accounts:');
    console.log('Admin: admin@shopzone.pk / Admin@123');
    console.log('Customer: ahmed@test.com / Test@123');
    console.log('Customer: sara@test.com / Test@123');
    console.log('Vendor: techhub@test.com / Vendor@123 (approved)');
    console.log('Vendor: fashion@test.com / Vendor@123 (approved)');
    console.log('Vendor: bookworld@test.com / Vendor@123 (pending)');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();