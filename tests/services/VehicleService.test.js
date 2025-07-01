const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const VehicleService = require('../../services/VehicleService');
const Vehicle = require('../../models/Vehicle');
const Operator = require('../../models/Operator');

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Vehicle.deleteMany({});
  await Operator.deleteMany({});
});

describe('VehicleService.createVehicle', () => {
  it('should create a new vehicle with valid data', async () => {
    const operator = await Operator.create({
      name: 'Test Operator',
      phone: '9876543210',
      code: 'ABC',
    });

    const vehicleData = {
      vehicleNumber: 'TN01AB1234',
      type: 'Truck',
      capacity: '15 Tons',
      driver: 'John Doe',
      status: 'Available',
      currentLocation: 'Chennai',
    };

    const createdBy = new mongoose.Types.ObjectId();

    const vehicle = await VehicleService.createVehicle(operator._id, vehicleData, createdBy);

    expect(vehicle).toHaveProperty('_id');
    expect(vehicle.vehicleNumber).toBe(vehicleData.vehicleNumber);
    expect(vehicle.operatorId.toString()).toBe(operator._id.toString());
    expect(vehicle.createdBy.toString()).toBe(createdBy.toString());
    expect(vehicle.status).toBe('Available');
  });

  it('should throw an error if operator does not exist', async () => {
    const fakeOperatorId = new mongoose.Types.ObjectId();
    const vehicleData = {
      vehicleNumber: 'TN01AB1234',
      type: 'Truck',
      capacity: '15 Tons',
      driver: 'John Doe',
      currentLocation: 'Chennai',
    };
    const createdBy = new mongoose.Types.ObjectId();

    await expect(
      VehicleService.createVehicle(fakeOperatorId, vehicleData, createdBy)
    ).rejects.toThrow('Operator not found');
  });

  it('should throw an error if vehicle number already exists for the operator', async () => {
    const operator = await Operator.create({
      name: 'Test Operator',
      phone: '9876543210',
      code: 'XYZ',
    });

    const vehicleData = {
      vehicleNumber: 'TN01AB1234',
      type: 'Truck',
      capacity: '15 Tons',
      driver: 'John Doe',
      currentLocation: 'Chennai',
    };
    const createdBy = new mongoose.Types.ObjectId();

    // Create a vehicle first
    await Vehicle.create({ ...vehicleData, operatorId: operator._id, createdBy });

    // Try to create the same vehicle again
    await expect(
      VehicleService.createVehicle(operator._id, vehicleData, createdBy)
    ).rejects.toThrow('Vehicle number already exists');
  });

  it('should throw an error if status is invalid', async () => {
    const operator = await Operator.create({
      name: 'Test Operator',
      phone: '9876543210',
      code: 'DEF',
    });

    const vehicleData = {
      vehicleNumber: 'TN01AB5678',
      type: 'Truck',
      capacity: '15 Tons',
      driver: 'John Doe',
      status: 'Flying', // Invalid status
      currentLocation: 'Chennai',
    };
    const createdBy = new mongoose.Types.ObjectId();

    await expect(
      VehicleService.createVehicle(operator._id, vehicleData, createdBy)
    ).rejects.toThrow('Invalid vehicle status: Flying');
  });
});
