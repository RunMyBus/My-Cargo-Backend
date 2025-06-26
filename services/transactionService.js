// services/transactionService.js
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

exports.getTransactionsByOperator = async (operatorId, page, limit) => {
  const skip = (page - 1) * limit;

  const aggregationPipeline = [
    {
      $match: {
        type: { $in: ['Booking', 'Transfer'] }
      }
    },

    // Lookup booking if it's a Booking type
    {
      $lookup: {
        from: 'bookings',
        localField: 'referenceId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },

    // Lookup cash transfer if it's a Transfer type
    {
      $lookup: {
        from: 'cashtransfers',
        localField: 'cashTransferId',
        foreignField: '_id',
        as: 'cashTransfer'
      }
    },
    { $unwind: { path: '$cashTransfer', preserveNullAndEmptyArrays: true } },

    // Filter: Booking must match operator, Transfer must be Approved
    {
      $match: {
        $or: [
          {
            type: 'Booking',
            'booking.operatorId': new mongoose.Types.ObjectId(operatorId)
          },
          {
            type: 'Transfer',
            'cashTransfer.status': 'Approved'
          }
        ]
      }
    },

    // Lookup users
    {
      $lookup: {
        from: 'users',
        localField: 'booking.bookedBy',
        foreignField: '_id',
        as: 'bookedUser'
      }
    },
    { $unwind: { path: '$bookedUser', preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: 'users',
        localField: 'fromUser',
        foreignField: '_id',
        as: 'fromUserObj'
      }
    },
    { $unwind: { path: '$fromUserObj', preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: 'users',
        localField: 'toUser',
        foreignField: '_id',
        as: 'toUserObj'
      }
    },
    { $unwind: { path: '$toUserObj', preserveNullAndEmptyArrays: true } },

    // Add oldBalance field
    {
      $addFields: {
        oldBalance: { $subtract: ['$balanceAfter', '$amount'] }
      }
    },

    // Final projection
    {
      $project: {
        _id: 1,
        amount: 1,
        balanceAfter: 1,
        oldBalance: 1,
        createdAt: 1,
        type: 1,
        bookingId: '$booking.bookingId',
        bookedByName: '$bookedUser.fullName',
        fromUserName: '$fromUserObj.fullName',
        toUserName: '$toUserObj.fullName',
        description: {
          $cond: {
            if: { $eq: ['$type', 'Booking'] },
            then: {
              $concat: [
                'Cargo Booking : ',
                { $toString: '$booking.bookingId' },
                ' by ',
                { $ifNull: ['$bookedUser.fullName', 'Unknown'] },
                ' has been posted for amount of ₹',
                { $toString: '$amount' }
              ]
            },
            else: {
              $concat: [
                'Cash Transfer of ₹',
                { $toString: '$amount' },
                ' from ',
                { $ifNull: ['$fromUserObj.fullName', 'Unknown'] },
                ' to ',
                { $ifNull: ['$toUserObj.fullName', 'Unknown'] }
              ]
            }
          }
        }
      }
    },

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ];

  // Run pipeline
  const results = await Transaction.aggregate(aggregationPipeline);

  // Count pipeline
  const countAggregation = await Transaction.aggregate([
    {
      $match: {
        type: { $in: ['Booking', 'Transfer'] }
      }
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'referenceId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'cashtransfers',
        localField: 'cashTransferId',
        foreignField: '_id',
        as: 'cashTransfer'
      }
    },
    { $unwind: { path: '$cashTransfer', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $or: [
          {
            type: 'Booking',
            'booking.operatorId': new mongoose.Types.ObjectId(operatorId)
          },
          {
            type: 'Transfer',
            'cashTransfer.status': 'Approved'
          }
        ]
      }
    },
    { $count: 'total' }
  ]);

  const totalCount = countAggregation[0]?.total || 0;

  return {
    transactions: results,
    totalCount
  };
};
