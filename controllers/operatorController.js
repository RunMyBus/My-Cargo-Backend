const Operator = require('../models/Operator');

exports.createOperator = async (req, res) => {
    try {
        const operator = new Operator(req.body);
        await operator.save();
        
        res.status(201).json(operator);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllOperators = async (req, res) => {
    try {
        const operators = await Operator.find();
        res.status(200).json(operators);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.searchOperators = async (req, res) => {
    try {
        const { query = "", page = 1, limit = 10 } = req.body;
        const regex = new RegExp(query, "i"); 
        const skip = (page - 1) * limit;

        const total = await Operator.countDocuments({ name: regex });
        const operators = await Operator.find({ name: regex })
          .skip(skip)
          .limit(Number(limit));

        res.json({
          data: operators,
          total,
          page: Number(page),
          totalPages: Math.ceil(total / limit),
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
};