const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Branch = require('../../models/Branch');
const BranchService = require('../../services/BranchService');
const logger = require('../../utils/logger');

jest.mock('../../utils/logger');

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
  await Branch.deleteMany({});
  jest.clearAllMocks();
});

describe('BranchService.createBranch', () => {
  it('should create a new branch with valid data', async () => {
    const branchData = {
      name: "Mumbai Hub",
      address: "Mumbai, MH",
      phone: "9004994955",
      manager: "ram",
      status: "Active",
      operatorId: new mongoose.Types.ObjectId(),
    };

    const branch = await BranchService.createBranch(branchData);

    expect(branch).toBeDefined();
    expect(branch.name).toBe(branchData.name);
    expect(branch.phone).toBe(branchData.phone);
  });

  it('should throw an error when required fields are missing', async () => {
    const incompleteData = {
      address: "Some Address",
      phone: "1234567890",
    };

    await expect(BranchService.createBranch(incompleteData)).rejects.toThrow();
  });
});
