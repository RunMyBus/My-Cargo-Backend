const mongoose = require('mongoose');
const Booking = require('../models/Booking');

async function getDailyCargoBalance(userId, date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const result = await Booking.aggregate([
    {
      $match: {
        bookedBy: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: start, $lte: end },
        lrType: 'Paid'
      }
    },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: "$totalAmountCharge" }
      }
    }
  ]);

  return result[0]?.totalBalance || 0;
}

module.exports = { getDailyCargoBalance };
