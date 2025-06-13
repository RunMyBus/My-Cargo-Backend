const Vehicle = require('../models/Vehicle');

class VehicleService {
    static async getAllVehicles(operatorId) {
        const vehicles = await Vehicle.find({ operatorId });
        const total = await Vehicle.countDocuments({ operatorId });
        const activeCount = await Vehicle.countDocuments({ 
            operatorId,
            status: "Available" 
        });

        return {
            data: vehicles,
            total,
            activeCount
        };
    }

    static async searchVehicles(operatorId, query = "", page = 1, limit = 10) {
        const regex = new RegExp(query, "i");
        const skip = (page - 1) * limit;

        const queryConditions = { 
            operatorId,
            vehicleNumber: regex 
        };

        const total = await Vehicle.countDocuments(queryConditions);
        const vehicles = await Vehicle.find(queryConditions)
            .skip(skip)
            .limit(Number(limit));

        return {
            data: vehicles,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        };
    }

    static async createVehicle(operatorId, vehicleData) {
        const vehicle = new Vehicle({
            ...vehicleData,
            operatorId
        });
        await vehicle.save();
        return vehicle;
    }

    static async updateVehicle(operatorId, vehicleId, updateData) {
        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: vehicleId, operatorId },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!vehicle) {
            throw new Error('Vehicle not found');
        }

        return vehicle;
    }

    static async deleteVehicle(operatorId, vehicleId) {
        const vehicle = await Vehicle.findOneAndDelete({ 
            _id: vehicleId, 
            operatorId 
        });
        
        if (!vehicle) {
            throw new Error('Vehicle not found');
        }
        
        return { message: 'Vehicle deleted successfully' };
    }
}

module.exports = VehicleService;
