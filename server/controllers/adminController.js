const mongoose = require('mongoose');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const Commission = require('../models/Commission');

exports.getOverview = async (req, res, next) => {
  try {
    const [
      totalGMV,
      totalCommission,
      activeVendors,
      totalCustomers,
      totalOrders,
      pendingVendors
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $in: ['processing', 'shipped', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Commission.aggregate([
        { $match: { status: 'settled' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]),
      Vendor.countDocuments({ status: 'approved' }),
      User.countDocuments({ role: 'customer', isActive: true }),
      Order.countDocuments(),
      Vendor.countDocuments({ status: 'pending' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        gmv: totalGMV[0]?.total || 0,
        commission: totalCommission[0]?.total || 0,
        activeVendors,
        customers: totalCustomers,
        orders: totalOrders,
        pendingVendors
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRevenue = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ['processing', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ success: true, data: revenue });
  } catch (error) {
    next(error);
  }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const products = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          image: { $first: '$items.productImage' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

exports.getTopVendors = async (req, res, next) => {
  try {
    const vendors = await Commission.aggregate([
      { $match: { status: 'settled' } },
      {
        $group: {
          _id: '$vendorId',
          totalSales: { $sum: '$grossAmount' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          businessName: '$vendor.businessName',
          logo: '$vendor.logo',
          totalSales: 1,
          totalOrders: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

exports.getCommissionSettings = async (req, res, next) => {
  try {
    const Setting = require('../models/Setting');
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ globalCommissionRate: 10 });
    }
    res.status(200).json({ success: true, data: { globalRate: settings.globalCommissionRate } });
  } catch (error) {
    next(error);
  }
};

exports.updateCommissionSettings = async (req, res, next) => {
  try {
    const { globalRate } = req.body;
    const Setting = require('../models/Setting');
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }
    if (globalRate !== undefined) {
      settings.globalCommissionRate = globalRate;
    }
    await settings.save();
    res.status(200).json({ success: true, data: { globalRate: settings.globalCommissionRate }, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
};