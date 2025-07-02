const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

const UserService = require('../../services/UserService');
const User = require('../../models/User');
const Role = require('../../models/Role');
const Branch = require('../../models/Branch');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany();
  await Role.deleteMany();
  await Branch.deleteMany();
});

describe('UserService.createUser', () => {
  it('should create a new user "Ravi" with mobile 9999999999', async () => {
    const role = await Role.create({
      rolename: 'Admin',
      description: 'Administrator role'
    });

    const branch = await Branch.create({
      name: 'Main Branch',
      location: 'Test Location'
    });

    const userData = {
      fullName: 'Ravi',
      mobile: '9999999999',
      password: 'plainpassword',
      status: 'active',
      role: role._id,
      branchId: branch._id,
      operatorId: new mongoose.Types.ObjectId(),
    };

    const createdBy = new mongoose.Types.ObjectId();
    const createdUser = await UserService.createUser(userData, userData.operatorId, createdBy);

    expect(createdUser).toBeDefined();
    expect(createdUser.fullName).toBe('Ravi');
    expect(createdUser.mobile).toBe('9999999999');
    expect(createdUser.status).toBe('Active');
    expect(createdUser.cargoBalance).toBe(0);
    expect(createdUser.password).not.toBe('plainpassword');

    const isMatch = await bcrypt.compare('plainpassword', createdUser.password);
    expect(isMatch).toBe(true);

    expect(createdUser.role.toString()).toBe(role._id.toString());
    expect(createdUser.branchId.toString()).toBe(branch._id.toString());
    expect(createdUser.operatorId.toString()).toBe(userData.operatorId.toString());
    expect(createdUser.createdBy.toString()).toBe(createdBy.toString());
  });

  it('should throw error if mobile already exists', async () => {
    const role = await Role.create({
      rolename: 'Admin',
      description: 'Administrator role'
    });

    const operatorId = new mongoose.Types.ObjectId();

    await User.create({
      fullName: 'Existing User',
      mobile: '9999999999',
      password: 'hashedpassword',
      role: role._id,
      operatorId,
    });

    const userData = {
      fullName: 'Ravi',
      mobile: '9999999999', // same as above
      password: 'plainpassword',
      role: role._id,
      operatorId,
    };

    await expect(UserService.createUser(userData, operatorId, null))
      .rejects.toThrow('Mobile number already exists');
  });

  it('should throw error if role is invalid', async () => {
    const operatorId = new mongoose.Types.ObjectId();

    const userData = {
      fullName: 'Ravi',
      mobile: '8888888888',
      password: 'plainpassword',
      role: new mongoose.Types.ObjectId(), // invalid role
      operatorId,
    };

    await expect(UserService.createUser(userData, operatorId, null))
      .rejects.toThrow('Invalid role ID');
  });
});
