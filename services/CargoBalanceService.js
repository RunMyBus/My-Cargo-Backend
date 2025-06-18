const mongoose = require('mongoose');
const Booking = require('../models/Booking');

async function getCargoBalance(operatorId, startDate, endDate) {
  if (!mongoose.Types.ObjectId.isValid(operatorId)) {
    throw new Error('Invalid operatorId');
  }

  const match = { operatorId: new mongoose.Types.ObjectId(operatorId) };
  if (startDate) match.bookingDate = { $gte: startDate };
  if (endDate) {
    match.bookingDate = match.bookingDate || {};
    match.bookingDate.$lte = endDate;
  }

  const dailyBalances = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$bookingDate',
        totalBalance: { $sum: '$totalAmountCharge' },
        paidBalance: {
          $sum: { $cond: [{ $eq: ['$lrType', 'Paid'] }, '$totalAmountCharge', 0] },
        },
        toPayBalance: {
          $sum: { $cond: [{ $eq: ['$lrType', 'ToPay'] }, '$totalAmountCharge', 0] },
        },
        bookingCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return dailyBalances;
}

module.exports = { getCargoBalance };
