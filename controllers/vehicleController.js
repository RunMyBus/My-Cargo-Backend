const Vehicle = require("../models/Vehicle");


// GET /vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();

    const total = await Vehicle.countDocuments();

    // Count of active (available) vehicles
    const activeCount = await Vehicle.countDocuments({ status: "Available" });

    res.json({
      data: vehicles,
      total,
      activeCount, // newly added
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET /vehicles/search
exports.searchVehicles = async (req, res) => {
  try {
    const { query = "", page = 1, limit = 10 } = req.body; // from req.body now
    const regex = new RegExp(query, "i"); // case-insensitive search
    const skip = (page - 1) * limit;

    const total = await Vehicle.countDocuments({ vehicleNumber: regex });
    const vehicles = await Vehicle.find({ vehicleNumber: regex })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      data: vehicles,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /vehicles
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /vehicles/:id
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /vehicles/:id
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
