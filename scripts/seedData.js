const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
const config = process.env;

// Models
const Operator = require('../models/Operator');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

// Connect to MongoDB
const connectDB = async () => {
  try {
    let mongoUrl = 'mongodb://' + config.DB_HOST + ':' + config.DB_PORT + '/' + config.DB_NAME;
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Hash password helper
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Clear existing data
const clearData = async () => {
  console.log('Clearing existing data...');
  await Booking.deleteMany({});
  await Vehicle.deleteMany({});
  await User.deleteMany({});
  await Role.deleteMany({});
  await Permission.deleteMany({});
  await Branch.deleteMany({});
  await Operator.deleteMany({});
  console.log('Existing data cleared');
};

// Seed data
const seedData = async () => {
  try {
    await connectDB();
    await clearData();

    console.log('Seeding data...');

    // 1. Create Permissions
    const permissions = [
      { name: 'manage_users', description: 'Can manage users' },
      { name: 'manage_roles', description: 'Can manage roles' },
      { name: 'manage_bookings', description: 'Can manage bookings' },
      { name: 'manage_branches', description: 'Can manage branches' },
      { name: 'view_reports', description: 'Can view reports' },
    ];

    const createdPermissions = await Permission.insertMany(permissions);
    console.log(`Created ${createdPermissions.length} permissions`);

    // 2. Create Operator
    const operator = await Operator.create({
      name: 'Speedy Cargo',
      code: 'SPD',
      address: '123 Main St, Mumbai, India',
      phone: '+911234567890',
      status: 'Active',
      bookingSequence: 1000,
      paymentOptions: ['cash', 'UPI'],
    });
    console.log(`Created operator: ${operator.name}`);

    // 3. Create Roles
    const adminRole = await Role.create({
      rolecode: '0001',
      rolename: 'Admin',
      description: 'Administrator with full access',
      permissions: createdPermissions.map(p => p._id),
      operatorId: operator._id,
    });

    const managerRole = await Role.create({
      rolecode: '0002',
      rolename: 'Branch Manager',
      description: 'Branch manager with limited access',
      permissions: createdPermissions
        .filter(p => !['manage_roles', 'manage_users'].includes(p.name))
        .map(p => p._id),
      operatorId: operator._id,
    });

    const staffRole = await Role.create({
      rolecode: '0003',
      rolename: 'Staff',
      description: 'Staff member with basic access',
      permissions: createdPermissions
        .filter(p => ['view_reports', 'manage_bookings'].includes(p.name))
        .map(p => p._id),
      operatorId: operator._id,
    });

    console.log(`Created ${await Role.countDocuments()} roles`);

    // 4. Create Branches
    const branches = [
      {
        name: 'Mumbai Central',
        address: 'Mumbai Central, Mumbai, Maharashtra',
        phone: '+912234561234',
        manager: 'Rajesh Kumar',
        status: 'Active',
        operatorId: operator._id,
      },
      {
        name: 'Delhi NCR',
        address: 'Connaught Place, New Delhi',
        phone: '+911123456789',
        manager: 'Priya Singh',
        status: 'Active',
        operatorId: operator._id,
      },
      {
        name: 'Bangalore South',
        address: 'Koramangala, Bangalore, Karnataka',
        phone: '+918067543210',
        manager: 'Arun Mehta',
        status: 'Active',
        operatorId: operator._id,
      },
    ];

    const createdBranches = await Branch.insertMany(branches);
    console.log(`Created ${createdBranches.length} branches`);

    // 5. Create Users
    const users = [
      {
        fullName: 'Admin User',
        mobile: '9876543210',
        password: await hashPassword('admin123'),
        branchId: createdBranches[0]._id,
        role: adminRole._id,
        status: 'Active',
        operatorId: operator._id,
        cargoBalance: 10000,
      },
      {
        fullName: 'Mumbai Manager',
        mobile: '9876543211',
        password: await hashPassword('manager123'),
        branchId: createdBranches[0]._id,
        role: managerRole._id,
        status: 'Active',
        operatorId: operator._id,
        cargoBalance: 5000,
      },
      {
        fullName: 'Delhi Manager',
        mobile: '9876543212',
        password: await hashPassword('manager123'),
        branchId: createdBranches[1]._id,
        role: managerRole._id,
        status: 'Active',
        operatorId: operator._id,
        cargoBalance: 5000,
      },
      {
        fullName: 'Mumbai Staff',
        mobile: '9876543213',
        password: await hashPassword('staff123'),
        branchId: createdBranches[0]._id,
        role: staffRole._id,
        status: 'Active',
        operatorId: operator._id,
        cargoBalance: 1000,
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // 6. Create Vehicles
    const vehicles = [
      {
        vehicleNumber: 'MH01AB1234',
        type: 'Truck',
        capacity: '2000 kg',
        driver: 'Ramesh Kumar',
        status: 'Available',
        currentLocation: 'Mumbai',
        operatorId: operator._id,
      },
      {
        vehicleNumber: 'DL01CD5678',
        type: 'Pickup',
        capacity: '500 kg',
        driver: 'Suresh Patel',
        status: 'Available',
        currentLocation: 'Delhi',
        operatorId: operator._id,
      },
      {
        vehicleNumber: 'KA01EF9012',
        type: 'Tempo',
        capacity: '1000 kg',
        driver: 'Mahesh Iyer',
        status: 'In Transit',
        currentLocation: 'Bangalore',
        operatorId: operator._id,
      },
    ];

    const createdVehicles = await Vehicle.insertMany(vehicles);
    console.log(`Created ${createdVehicles.length} vehicles`);

    // 7. Create Bookings
    // Helper function to generate booking dates
    const generateBookingDate = (daysAgo) => {
      return new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    };

    const bookingTemplates = [
      // Initial bookings
      {
        bookingDate: generateBookingDate(2),
        senderName: 'Amit Shah',
        senderPhone: '9876543220',
        senderEmail: 'amit.shah@example.com',
        senderAddress: '101, LBS Road, Mumbai',
        receiverName: 'Neha Gupta',
        receiverPhone: '9876543221',
        receiverEmail: 'neha.gupta@example.com',
        receiverAddress: '45, Connaught Place, New Delhi',
        fromOffice: createdBranches[0]._id,  // Mumbai
        toOffice: createdBranches[1]._id,    // Delhi
        packageDescription: 'Electronics',
        weight: 10,
        quantity: 2,
        valueOfGoods: 25000,
        dimensions: '20x15x10 cm',
        status: 'Booked',
        lrType: 'Paid',
        bookedBy: createdUsers[1]._id,  // Mumbai Manager
      },
      {
        bookingDate: generateBookingDate(2),
        senderName: 'Rahul Verma',
        senderPhone: '9876543222',
        senderEmail: 'rahul.v@example.com',
        senderAddress: '22, Hauz Khas, Delhi',
        receiverName: 'Priya Nair',
        receiverPhone: '9876543223',
        receiverEmail: 'priya.n@example.com',
        receiverAddress: '33, MG Road, Bangalore',
        fromOffice: createdBranches[1]._id,  // Delhi
        toOffice: createdBranches[2]._id,    // Bangalore
        packageDescription: 'Clothing',
        weight: 5,
        quantity: 3,
        valueOfGoods: 8000,
        dimensions: '30x20x15 cm',
        status: 'InTransit',
        lrType: 'ToPay',
        bookedBy: createdUsers[2]._id,  // Delhi Manager
        assignedVehicle: createdVehicles[2]._id,  // KA01EF9012
      },
      // 20 more diverse bookings
      {
        bookingDate: generateBookingDate(1),
        senderName: 'Vikram Mehta',
        senderPhone: '9876543230',
        senderEmail: 'vikram.m@example.com',
        senderAddress: '56, Andheri East, Mumbai',
        receiverName: 'Anjali Kapoor',
        receiverPhone: '9876543231',
        receiverEmail: 'anjali.k@example.com',
        receiverAddress: '78, Rajouri Garden, Delhi',
        fromOffice: createdBranches[0]._id,  // Mumbai
        toOffice: createdBranches[1]._id,    // Delhi
        packageDescription: 'Documents',
        weight: 0.5,
        quantity: 1,
        valueOfGoods: 1000,
        dimensions: '30x20x2 cm',
        status: 'Delivered',
        lrType: 'Paid',
        bookedBy: createdUsers[1]._id,  // Mumbai Manager
        assignedVehicle: createdVehicles[0]._id,  // MH01AB1234
        deliveredBy: createdUsers[1]._id,  // Delhi Manager
        deliveryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        bookingDate: generateBookingDate(1),
        senderName: 'Rajesh Khanna',
        senderPhone: '9876543232',
        senderEmail: 'rajesh.k@example.com',
        senderAddress: '12, Churchgate, Mumbai',
        receiverName: 'Meena Desai',
        receiverPhone: '9876543233',
        receiverEmail: 'meena.d@example.com',
        receiverAddress: '34, Karol Bagh, Delhi',
        fromOffice: createdBranches[0]._id,  // Mumbai
        toOffice: createdBranches[1]._id,    // Delhi
        packageDescription: 'Jewelry',
        weight: 0.2,
        quantity: 1,
        valueOfGoods: 150000,
        dimensions: '10x5x3 cm',
        status: 'Booked',
        lrType: 'Paid',
        bookedBy: createdUsers[1]._id,  // Mumbai Manager
      },
      {
        bookingDate: generateBookingDate(1),
        senderName: 'Priyanka Sharma',
        senderPhone: '9876543234',
        senderEmail: 'priyanka.s@example.com',
        senderAddress: '89, Bandra West, Mumbai',
        receiverName: 'Rahul Malhotra',
        receiverPhone: '9876543235',
        receiverEmail: 'rahul.m@example.com',
        receiverAddress: '67, Saket, Delhi',
        fromOffice: createdBranches[0]._id,  // Mumbai
        toOffice: createdBranches[1]._id,    // Delhi
        packageDescription: 'Gifts',
        weight: 3,
        quantity: 5,
        valueOfGoods: 12000,
        dimensions: '25x20x15 cm',
        status: 'InTransit',
        lrType: 'ToPay',
        bookedBy: createdUsers[1]._id,  // Mumbai Manager
        assignedVehicle: createdVehicles[0]._id,  // MH01AB1234
      },
      {
        bookingDate: generateBookingDate(0),
        senderName: 'Arun Joshi',
        senderPhone: '9876543236',
        senderEmail: 'arun.j@example.com',
        senderAddress: '45, Malad West, Mumbai',
        receiverName: 'Kavita Reddy',
        receiverPhone: '9876543237',
        receiverEmail: 'kavita.r@example.com',
        receiverAddress: '23, Indiranagar, Bangalore',
        fromOffice: createdBranches[0]._id,  // Mumbai
        toOffice: createdBranches[2]._id,    // Bangalore
        packageDescription: 'Electronics',
        weight: 8,
        quantity: 1,
        valueOfGoods: 45000,
        dimensions: '40x30x20 cm',
        status: 'Arrived',
        lrType: 'Paid',
        bookedBy: createdUsers[1]._id,  // Mumbai Manager
        assignedVehicle: createdVehicles[2]._id,  // KA01EF9012
        arrivalDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        bookingDate: generateBookingDate(0),
        senderName: 'Sanjay Patel',
        senderPhone: '9876543238',
        senderEmail: 'sanjay.p@example.com',
        senderAddress: '78, Vashi, Navi Mumbai',
        receiverName: 'Anita Deshmukh',
        receiverPhone: '9876543239',
        receiverEmail: 'anita.d@example.com',
        receiverAddress: '12, Whitefield, Bangalore',
        fromOffice: createdBranches[0]._id,  // Mumbai
        toOffice: createdBranches[2]._id,    // Bangalore
        packageDescription: 'Clothing',
        weight: 6,
        quantity: 4,
        valueOfGoods: 18000,
        dimensions: '35x25x15 cm',
        status: 'Cancelled',
        lrType: 'Paid',
        bookedBy: createdUsers[1]._id,  // Mumbai Manager
        cancellationReason: 'Customer requested cancellation',
      },
      {
        bookingDate: generateBookingDate(0),
        senderName: 'Neha Kapoor',
        senderPhone: '9876543240',
        senderEmail: 'neha.k@example.com',
        senderAddress: '34, Connaught Place, Delhi',
        receiverName: 'Ravi Shastri',
        receiverPhone: '9876543241',
        receiverEmail: 'ravi.s@example.com',
        receiverAddress: '56, Juhu, Mumbai',
        fromOffice: createdBranches[1]._id,  // Delhi
        toOffice: createdBranches[0]._id,    // Mumbai
        packageDescription: 'Documents',
        weight: 0.3,
        quantity: 1,
        valueOfGoods: 500,
        dimensions: '25x15x1 cm',
        status: 'Delivered',
        lrType: 'Paid',
        bookedBy: createdUsers[2]._id,  // Delhi Manager
        assignedVehicle: createdVehicles[0]._id,  // MH01AB1234
        deliveredBy: createdUsers[1]._id,
        deliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        bookingDate: generateBookingDate(2),
        senderName: 'Rakesh Malhotra',
        senderPhone: '9876543242',
        senderEmail: 'rakesh.m@example.com',
        senderAddress: '67, Gurgaon, Haryana',
        receiverName: 'Sunita Iyer',
        receiverPhone: '9876543243',
        receiverEmail: 'sunita.i@example.com',
        receiverAddress: '89, Electronic City, Bangalore',
        fromOffice: createdBranches[1]._id,  // Delhi
        toOffice: createdBranches[2]._id,    // Bangalore
        packageDescription: 'Electronics',
        weight: 12,
        quantity: 1,
        valueOfGoods: 65000,
        dimensions: '50x40x30 cm',
        status: 'InTransit',
        lrType: 'ToPay',
        bookedBy: createdUsers[2]._id,  // Delhi Manager
        assignedVehicle: createdVehicles[2]._id,  // KA01EF9012
      },
      {
        bookingDate: generateBookingDate(1),
        senderName: 'Manoj Kumar',
        senderPhone: '9876543244',
        senderEmail: 'manoj.k@example.com',
        senderAddress: '23, Noida, UP',
        receiverName: 'Pooja Sharma',
        receiverPhone: '9876543245',
        receiverEmail: 'pooja.s@example.com',
        receiverAddress: '45, Andheri East, Mumbai',
        fromOffice: createdBranches[1]._id,  // Delhi
        toOffice: createdBranches[0]._id,    // Mumbai
        packageDescription: 'Gifts',
        weight: 4,
        quantity: 3,
        valueOfGoods: 15000,
        dimensions: '30x20x15 cm',
        status: 'Booked',
        lrType: 'Paid',
        bookedBy: createdUsers[2]._id,  // Delhi Manager
      },
      {
        bookingDate: generateBookingDate(2),
        senderName: 'Anil Kapoor',
        senderPhone: '9876543246',
        senderEmail: 'anil.k@example.com',
        senderAddress: '56, Indiranagar, Bangalore',
        receiverName: 'Rekha Verma',
        receiverPhone: '9876543247',
        receiverEmail: 'rekha.v@example.com',
        receiverAddress: '78, Malad West, Mumbai',
        fromOffice: createdBranches[2]._id,  // Bangalore
        toOffice: createdBranches[0]._id,    // Mumbai
        packageDescription: 'Clothing',
        weight: 7,
        quantity: 5,
        valueOfGoods: 22000,
        dimensions: '35x25x20 cm',
        status: 'InTransit',
        lrType: 'ToPay',
        bookedBy: createdUsers[3]._id,  // Mumbai Staff
        assignedVehicle: createdVehicles[0]._id,  // MH01AB1234
      },
      {
        bookingDate: generateBookingDate(1),
        senderName: 'Suresh Reddy',
        senderPhone: '9876543248',
        senderEmail: 'suresh.r@example.com',
        senderAddress: '34, Koramangala, Bangalore',
        receiverName: 'Anand Desai',
        receiverPhone: '9876543249',
        receiverEmail: 'anand.d@example.com',
        receiverAddress: '12, Connaught Place, Delhi',
        fromOffice: createdBranches[2]._id,  // Bangalore
        toOffice: createdBranches[1]._id,    // Delhi
        packageDescription: 'Electronics',
        weight: 15,
        quantity: 2,
        valueOfGoods: 85000,
        dimensions: '60x40x30 cm',
        status: 'Booked',
        lrType: 'Paid',
        bookedBy: createdUsers[3]._id,  // Mumbai Staff
      },
      {
        bookingDate: generateBookingDate(0),
        senderName: 'Priya Singh',
        senderPhone: '9876543250',
        senderEmail: 'priya.s@example.com',
        senderAddress: '78, Whitefield, Bangalore',
        receiverName: 'Rahul Khanna',
        receiverPhone: '9876543251',
        receiverEmail: 'rahul.k@example.com',
        receiverAddress: '45, Saket, Delhi',
        fromOffice: createdBranches[2]._id,  // Bangalore
        toOffice: createdBranches[1]._id,    // Delhi
        packageDescription: 'Gadgets',
        weight: 3,
        quantity: 2,
        valueOfGoods: 35000,
        dimensions: '25x15x10 cm',
        status: 'Arrived',
        lrType: 'Paid',
        bookedBy: createdUsers[3]._id,  // Mumbai Staff
        assignedVehicle: createdVehicles[1]._id,  // DL01CD5678
        arrivalDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        bookingDate: generateBookingDate(2),
        senderName: 'Vijay Kumar',
        senderPhone: '9876543252',
        senderEmail: 'vijay.k@example.com',
        senderAddress: '56, Marathahalli, Bangalore',
        receiverName: 'Sunita Patel',
        receiverPhone: '9876543253',
        receiverEmail: 'sunita.p@example.com',
        receiverAddress: '67, Andheri East, Mumbai',
        fromOffice: createdBranches[2]._id,  // Bangalore
        toOffice: createdBranches[0]._id,    // Mumbai
        packageDescription: 'Clothing',
        weight: 8,
        quantity: 6,
        valueOfGoods: 28000,
        dimensions: '40x30x20 cm',
        status: 'Delivered',
        lrType: 'ToPay',
        bookedBy: createdUsers[3]._id,  // Mumbai Staff
        assignedVehicle: createdVehicles[0]._id,  // MH01AB1234
        deliveredBy: createdUsers[1]._id,  // Mumbai Staff
        deliveryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Add more bookings as needed...
    ];

    // Process bookings and add calculated fields
    const bookings = bookingTemplates.map((booking, index) => {
      // Find branch indices for distance calculation
      const fromBranchIndex = createdBranches.findIndex(b => b._id.equals(booking.fromOffice));
      const toBranchIndex = createdBranches.findIndex(b => b._id.equals(booking.toOffice));
      
      // Calculate charges based on weight, distance, and package value
      const distance = [
        [0, 1400, 1000],  // Mumbai to [Mumbai, Delhi, Bangalore]
        [1400, 0, 2200],  // Delhi to [Mumbai, Delhi, Bangalore]
        [1000, 2200, 0]   // Bangalore to [Mumbai, Delhi, Bangalore]
      ][fromBranchIndex][toBranchIndex];
      
      const baseRate = 15; // Base rate per kg per 100km
      const freightCharge = Math.round((booking.weight * distance * baseRate) / 100);
      const loadingCharge = 200;
      const unloadingCharge = 200;
      const insuranceCharge = Math.round(booking.valueOfGoods * 0.005); // 0.5% insurance
      const totalAmountCharge = freightCharge + loadingCharge + unloadingCharge + insuranceCharge;
      
      // Adjust for cancelled bookings (50% of freight charge)
      const finalFreightCharge = booking.status === 'Cancelled' ? 
        Math.round(freightCharge * 0.5) : freightCharge;
      const finalTotalCharge = booking.status === 'Cancelled' ?
        finalFreightCharge + loadingCharge + Math.round(unloadingCharge * 0.5) : totalAmountCharge;

      // Generate booking ID with timestamp and index
      const bookingDate = new Date(booking.bookingDate);
      const bookingId = `BK${bookingDate.getFullYear().toString().slice(-2)}${(bookingDate.getMonth() + 1).toString().padStart(2, '0')}${String(index).padStart(4, '0')}`;

      console.log(`Booking ID: ${bookingId}`);
      return {
        ...booking,
        operatorId: operator._id,
        bookingId,
        freightCharge: finalFreightCharge,
        loadingCharge: booking.status === 'Cancelled' ? loadingCharge : loadingCharge,
        unloadingCharge: booking.status === 'Cancelled' ? Math.round(unloadingCharge * 0.5) : unloadingCharge,
        insuranceCharge,
        totalAmountCharge: finalTotalCharge,
        createdAt: booking.bookingDate,
        updatedAt: booking.deliveryDate || booking.arrivalDate || booking.bookingDate
      };
    });

    const createdBookings = await Booking.insertMany(bookings);
    console.log(`Created ${createdBookings.length} bookings`);

    console.log('Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedData();
