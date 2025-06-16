const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Operator = require('../models/Operator');

class VehicleService {
 static async getAllVehicles(operatorId) {
  const vehicles = await Vehicle.find({ operatorId, status: 'Available' }).lean();
  
  // Count all vehicles regardless of status
  const total = await Vehicle.countDocuments({ operatorId });
  
  // Count vehicles with status 'Available'
  const availableCount = await Vehicle.countDocuments({ operatorId, status: 'Available' });

  return {
    data: vehicles,
    total,
    availableCount,
  };
}


  static async searchVehicles(operatorId, query = "", page = 1, limit = 10) {
    const regex = new RegExp(query, "i");
    const skip = (page - 1) * limit;

    const queryConditions = {
      operatorId,
      vehicleNumber: regex,
    };

    const total = await Vehicle.countDocuments(queryConditions);
    const vehicles = await Vehicle.find(queryConditions).skip(skip).limit(Number(limit)).lean();

    return {
      data: vehicles,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  }

  static async createVehicle(operatorId, vehicleData) {
    const operatorExists = await Operator.exists({ _id: operatorId });
    if (!operatorExists) throw new Error('Operator not found');

    const exists = await Vehicle.findOne({ vehicleNumber: vehicleData.vehicleNumber, operatorId });
    if (exists) throw new Error('Vehicle number already exists');

    const status = vehicleData.status || 'Available';
    if (!["Available", "In Transit", "Maintenance"].includes(status)) {
      throw new Error(`Invalid vehicle status: ${status}`);
    }

    const vehicle = new Vehicle({
      ...vehicleData,
      status,
      operatorId,
    });

    await vehicle.save();
    return vehicle;
  }

  static async updateVehicle(operatorId, vehicleId, updateData) {
    const operatorExists = await Operator.exists({ _id: operatorId });
    if (!operatorExists) throw new Error('Operator not found');

    const vehicle = await Vehicle.findOne({ _id: vehicleId, operatorId });
    if (!vehicle) throw new Error('Vehicle not found or unauthorized');

    if (updateData.status && !["Available", "In Transit", "Maintenance"].includes(updateData.status)) {
      throw new Error(`Invalid vehicle status: ${updateData.status}`);
    }

    Object.assign(vehicle, updateData);
    await vehicle.save();
    return vehicle;
  }

  static async deleteVehicle(operatorId, vehicleId) {
    const vehicle = await Vehicle.findOneAndDelete({ _id: vehicleId, operatorId });
    if (!vehicle) throw new Error('Vehicle not found');

    return { message: 'Vehicle deleted successfully' };
  }
}

module.exports = VehicleService;
