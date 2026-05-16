module.exports = (price, quantity, rate) => {
  const gross = price * quantity;
  const commissionAmount = parseFloat((gross * rate / 100).toFixed(2));
  const vendorEarning = parseFloat((gross - commissionAmount).toFixed(2));
  return { gross, commissionAmount, vendorEarning };
};