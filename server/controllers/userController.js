const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Address = require('../models/Address');
const ApiError = require('../utils/ApiError');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    
    if (avatar && avatar.startsWith('data:image')) {
      const { uploadImage } = require('../utils/cloudinary');
      const url = await uploadImage(avatar, 'shopzone/users');
      user.avatar = url;
    } else if (avatar) {
      user.avatar = avatar;
    }

    await user.save();
    res.status(200).json({ success: true, data: user, message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    const { label, fullName, phone, street, city, province, postalCode, country, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      userId: req.user._id,
      label,
      fullName,
      phone,
      street,
      city,
      province,
      postalCode,
      country: country || 'Pakistan',
      isDefault: isDefault || false,
    });

    res.status(201).json({ success: true, data: address, message: 'Address added' });
  } catch (error) {
    next(error);
  }
};

exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const { label, fullName, phone, street, city, province, postalCode, country, isDefault } = req.body;
    const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });

    if (!address) {
      return next(ApiError.notFound('Address not found'));
    }

    if (isDefault) {
      await Address.updateMany({ userId: req.user._id, _id: { $ne: address._id } }, { isDefault: false });
    }

    if (label) address.label = label;
    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (street) address.street = street;
    if (city) address.city = city;
    if (province) address.province = province;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();
    res.status(200).json({ success: true, data: address, message: 'Address updated' });
  } catch (error) {
    next(error);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!address) {
      return next(ApiError.notFound('Address not found'));
    }
    res.status(200).json({ success: true, message: 'Address deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getFavoriteStores = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteStores');
    res.status(200).json({ success: true, data: user.favoriteStores || [] });
  } catch (error) {
    next(error);
  }
};

exports.addFavoriteStore = async (req, res, next) => {
  try {
    const vendorId = req.params.id;
    const user = await User.findById(req.user._id);
    if (!user.favoriteStores.includes(vendorId)) {
      user.favoriteStores.push(vendorId);
      await user.save();
    }
    res.status(200).json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    next(error);
  }
};

exports.removeFavoriteStore = async (req, res, next) => {
  try {
    const vendorId = req.params.id;
    const user = await User.findById(req.user._id);
    user.favoriteStores = user.favoriteStores.filter(id => id.toString() !== vendorId);
    await user.save();
    res.status(200).json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    next(error);
  }
};