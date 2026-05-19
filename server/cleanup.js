/**
 * Database Cleanup Script
 * Wipes ALL data (products, vendors, orders, etc.) and re-creates only the admin user.
 * 
 * Usage: node cleanup.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

async function cleanup() {
  try {
    console.log('\n🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('📋 Collections found:', collectionNames.join(', '));
    console.log('\n🗑️  Wiping all collections...');

    for (const name of collectionNames) {
      if (name === 'system.profile' || name.startsWith('system.')) continue;
      const count = await db.collection(name).countDocuments();
      await db.collection(name).deleteMany({});
      console.log(`   ✓ ${name}: deleted ${count} documents`);
    }

    console.log('\n👤 Creating admin user...');

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('Admin@123', salt);

    const adminUser = {
      name: 'Admin',
      email: 'admin@shopzone.pk',
      passwordHash,
      phone: '+923001234567',
      role: 'admin',
      isActive: true,
      isVerified: true,
      favoriteStores: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(adminUser);
    console.log(`   ✓ Admin created: admin@shopzone.pk / Admin@123`);
    console.log(`   ✓ Admin ID: ${result.insertedId}`);

    console.log('\n✅ Database cleanup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Login:');
    console.log('  Email:    admin@shopzone.pk');
    console.log('  Password: Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanup();
