const Booking = require('../models/Booking');
const Branch = require('../models/Branch');
const requestContext = require('../utils/requestContext');

// Get today's bookings segregated by payment type (ToPay/Paid)
exports.getTodayBookingsByPayment = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get operator ID from context
        const operatorId = requestContext.getOperatorId();
        
        // Group by lrType
        const result = await Booking.aggregate([
            {
                $match: {
                    bookingDate: today,
                    operatorId: operatorId
                }
            },
            {
                $group: {
                    _id: '$lrType',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Initialize both payment types with 0 count
        const pieChartData = [
            { label: 'To Pay', value: 0 },
            { label: 'Paid', value: 0 }
        ];

        // Update counts from the result
        result.forEach(item => {
            const label = item._id === 'ToPay' ? 'To Pay' : 'Paid';
            const existingItem = pieChartData.find(p => p.label === label);
            if (existingItem) {
                existingItem.value = item.count;
            }
        });

        res.json({
            success: true,
            data: pieChartData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get ToPay and Paid bookings across all branches
exports.getBookingsByBranchAndPayment = async (req, res) => {
    try {
        // Get operator ID from context
        const operatorId = requestContext.getOperatorId();
        
        // First get all branches for reference
        const branches = await Branch.find({ operatorId });
        const branchMap = new Map(branches.map(branch => [branch._id.toString(), branch.name]));

        // First get all valid branches for this operator
        const validBranches = await Branch.find({ operatorId });
        const validBranchIds = validBranches.map(branch => branch._id);

        const today = new Date().toISOString().split('T')[0];

        // Aggregate bookings by branch and payment type
        const result = await Booking.aggregate([
            {
                $match: {
                    operatorId: operatorId,
                    bookingDate: today,
                    fromOffice: { $in: validBranchIds }
                }
            },
            {
                $group: {
                    _id: {
                        branch: '$fromOffice',
                        paymentType: '$lrType'
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Reformat the data for better visualization
        const formattedData = result.reduce((acc, item) => {
            const branchId = item._id.branch.toString();
            const branchName = branchMap.get(branchId);
            const paymentType = item._id.paymentType;
            
            if (!acc[branchName]) {
                acc[branchName] = {
                    branchName,
                    toPay: 0,
                    paid: 0
                };
            }
            
            if (paymentType === 'ToPay') {
                acc[branchName].toPay = item.count;
            } else {
                acc[branchName].paid = item.count;
            }
            
            return acc;
        }, {});

        // Convert to array for easier handling
        const branchData = Object.values(formattedData);

        res.json({
            success: true,
            data: branchData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get bookings for last 6 months grouped by month and payment type
// exports.getSixMonthBookings = async (req, res) => {
//     try {
//         const operatorId = requestContext.getOperatorId();
        
//         // Get current date and 6 months ago date
//         const now = new Date();
//         const sixMonthsAgo = new Date(now);
//         sixMonthsAgo.setMonth(now.getMonth() - 6);
        
//         // Format dates for comparison
//         const startDate = sixMonthsAgo.toISOString().split('T')[0];
//         const endDate = now.toISOString().split('T')[0];

//         // Aggregate bookings by month and payment type
//         const result = await Booking.aggregate([
//             {
//                 $match: {
//                     operatorId: operatorId,
//                     bookingDate: { $gte: startDate, $lte: endDate }
//                 }
//             },
//             {
//                 $group: {
//                     _id: {
//                         month: { $substr: ['$bookingDate', 0, 7] }, // YYYY-MM
//                         paymentType: '$lrType'
//                     },
//                     count: { $sum: 1 }
//                 }
//             },
//             {
//                 $sort: {
//                     '_id.month': 1
//                 }
//             }
//         ]);

//         // Reformat the data for better visualization
//         const monthlyData = {};
        
//         // Initialize data for all months in the range
//         const months = [];
//         for (let i = 0; i < 6; i++) {
//             const monthDate = new Date(now);
//             monthDate.setMonth(now.getMonth() - (5 - i));
//             const month = monthDate.toLocaleString('default', { month: 'short' });
//             const year = monthDate.getFullYear();
//             months.push({ month, year });
//             monthlyData[`${month} ${year}`] = {
//                 month: `${month} ${year}`,
//                 toPay: 0,
//                 paid: 0
//             };
//         }

//         // Sort months array to ensure chronological order
//         months.sort((a, b) => {
//             const dateA = new Date(`${a.year}-${a.month} 01`);
//             const dateB = new Date(`${b.year}-${b.month} 01`);
//             return dateA - dateB;
//         });

//         // Reorder monthlyData based on sorted months
//         const orderedMonthlyData = {};
//         months.forEach(monthObj => {
//             const key = `${monthObj.month} ${monthObj.year}`;
//             orderedMonthlyData[key] = monthlyData[key];
//         });

//         // Use orderedMonthlyData instead of reassigning monthlyData
//         // Fill in the actual data
//         result.forEach(item => {
//             const [year, month] = item._id.month.split('-');
//             const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
//             const key = `${monthName} ${year}`;
            
//             if (orderedMonthlyData[key]) {
//                 if (item._id.paymentType === 'ToPay') {
//                     orderedMonthlyData[key].toPay = item.count;
//                 } else {
//                     orderedMonthlyData[key].paid = item.count;
//                 }
//             }
//         });

//         // Convert to array for easier handling
//         const formattedData = Object.values(orderedMonthlyData);

//         res.json({
//             success: true,
//             data: formattedData
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// };

exports.getSixMonthBookings = async (req, res) => {
    try {
        const operatorId = requestContext.getOperatorId();
        const requestedMonth = req.query.month; // e.g., 'Jun 2025'

        const now = new Date();
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 5); // covers this month + last 5 months

        const startDate = sixMonthsAgo.toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

        const aggregatedBookings = await Booking.aggregate([
            {
                $match: {
                    operatorId: operatorId,
                    bookingDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $substrBytes: ['$bookingDate', 0, 7] }, // 'YYYY-MM'
                        paymentType: '$lrType'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.month': 1 }
            }
        ]);

        // Initialize 6-month buckets
        const monthlyData = {};
        const months = [];

        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = monthDate.toLocaleString('default', { month: 'short' });
            const year = monthDate.getFullYear();
            const key = `${month} ${year}`;
            months.push(key);
            monthlyData[key] = { month: key, toPay: 0, paid: 0 };
        }

        // Fill actual data
        aggregatedBookings.forEach(item => {
            const [year, month] = item._id.month.split('-');
            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
            const key = `${monthName} ${year}`;
            const type = (item._id.paymentType || '').toLowerCase();

            if (monthlyData[key]) {
                if (type === 'topay') {
                    monthlyData[key].toPay = item.count;
                } else {
                    monthlyData[key].paid = item.count;
                }
            }
        });

        // Final output
        const allData = Object.values(monthlyData);

        // Apply filter if query param is present
        const filteredData = requestedMonth
            ? allData.filter(entry => entry.month.toLowerCase() === requestedMonth.toLowerCase())
            : allData;

        res.json({
            success: true,
            data: filteredData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};