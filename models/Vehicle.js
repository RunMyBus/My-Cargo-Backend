const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  capacity: { type: String, required: true },
  driver: { type: String, required: true },
  status: {
    type: String,
    enum: ["Available", "In Transit", "Maintenance"],
    default: "Available"
  },
  currentLocation: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", VehicleSchema);
