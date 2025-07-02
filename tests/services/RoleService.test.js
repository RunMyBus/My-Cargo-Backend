const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const RoleService = require('../../services/RoleService');
const Role = require('../../models/Role');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await Role.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('RoleService.createRole', () => {
  it('should create a new role with valid data', async () => {
    const roleData = {
      rolename: "Admin",
      description: "Organization Access",
      permissions: [],
    };
    const operatorId = "684ee0972546c2d131b4f005";
    const createdBy = new mongoose.Types.ObjectId();

    const role = await RoleService.createRole(roleData, operatorId, createdBy);

    expect(role).toBeDefined();
    expect(role._id).toBeDefined();
    expect(role.rolename).toBe(roleData.rolename);
    expect(role.description).toBe(roleData.description);
    expect(role.permissions.length).toBe(0);
    expect(role.operatorId.toString()).toBe(operatorId);
    expect(role.createdBy.toString()).toBe(createdBy.toString());
  });

  it('should throw an error if required fields are missing', async () => {
    await expect(RoleService.createRole({}, null, null))
      .rejects.toThrow('Rolename, description, operatorId, and createdBy are required');
  });
});
