const mongoose = require('mongoose');
const BookingService = require('../../services/BookingService');
const Booking = require('../../models/Booking');
const User = require('../../models/User');

// Mock the mongoose models
jest.mock('mongoose');

// Mock the Operator model
const mockOperator = {
  _id: '60d21b4667d0d8992e610c85',
  code: 'OPR',
  bookingSequence: 1,
  save: jest.fn()
};

// Mock the User model
const mockUser = {
  _id: '60d21b4667d0d8992e610c86',
  cargoBalance: 100,
  save: jest.fn()
};

// Mock the Booking model
const mockBooking = {
  _id: '60d21b4667d0d8992e610c87',
  bookingId: 'P-20250609-0001',
  type: 'Paid',
  totalAmount: 50,
  save: jest.fn().mockResolvedValue({
    ...mockBooking,
    populate: jest.fn().mockResolvedValue({
      ...mockBooking,
      fromOffice: { name: 'Origin' },
      toOffice: { name: 'Destination' }
    })
  })
};

describe('BookingService', () => {
  let findByIdAndUpdateSpy;
  let findByIdSpy;
  let saveSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mongoose model mocks
    mongoose.model.mockImplementation((modelName) => {
      if (modelName === 'operator') {
        return {
          findByIdAndUpdate: jest.fn().mockResolvedValue({
            ...mockOperator,
            bookingSequence: mockOperator.bookingSequence + 1
          })
        };
      }
      return {
        findById: jest.fn().mockResolvedValue(mockUser)
      };
    });

    // Setup Booking model mock
    Booking.mockImplementation(() => ({
      ...mockBooking,
      save: mockBooking.save
    }));

    // Setup User model mock
    User.findById = jest.fn().mockResolvedValue(mockUser);
  });

  describe('createBooking', () => {
    const bookingData = {
      type: 'Paid',
      senderName: 'Test User',
      senderPhone: '1234567890',
      receiverName: 'Receiver',
      receiverPhone: '0987654321',
      fromOffice: '60d21b4667d0d8992e610c88',
      toOffice: '60d21b4667d0d8992e610c89',
      weight: 10,
      totalAmount: 50
    };

    const operatorId = '60d21b4667d0d8992e610c85';
    const userId = '60d21b4667d0d8992e610c86';

    it('should create a new booking with correct booking ID format', async () => {
      // Mock the current date
      const mockDate = new Date('2025-06-09T12:00:00Z');
      const originalDate = Date;
      global.Date = jest.fn(() => mockDate);
      global.Date.now = originalDate.now;

      const result = await BookingService.createBooking(bookingData, userId, operatorId);
      
      // Verify the booking ID format: P-YYYYMMDD-0001
      expect(result.bookingId).toMatch(/^[PT]\d{4}-\d{8}-\d{4}$/);
      expect(result.bookingId).toContain('P-20250609-');
      
      // Restore original Date
      global.Date = originalDate;
    });

    it('should increment operator booking sequence', async () => {
      await BookingService.createBooking(bookingData, userId, operatorId);
      
      // Verify operator's booking sequence was incremented
      expect(mongoose.model('operator').findByIdAndUpdate).toHaveBeenCalledWith(
        operatorId,
        { $inc: { bookingSequence: 1 } },
        { new: true, useFindAndModify: false }
      );
    });

    it('should update user cargo balance for Paid bookings', async () => {
      await BookingService.createBooking(bookingData, userId, operatorId);
      
      // Verify user's cargo balance was updated
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.cargoBalance).toBe(150); // 100 + 50
    });

    it('should not update user cargo balance for ToPay bookings', async () => {
      const toPayBooking = { ...bookingData, type: 'ToPay' };
      await BookingService.createBooking(toPayBooking, userId, operatorId);
      
      // Verify user's cargo balance was not updated
      expect(User.findById).not.toHaveBeenCalled();
    });

    it('should throw an error if operator is not found', async () => {
      mongoose.model('operator').findByIdAndUpdate.mockResolvedValueOnce(null);
      
      await expect(BookingService.createBooking(bookingData, userId, operatorId))
        .rejects
        .toThrow('Operator not found');
    });

    it('should throw an error if user is not found for Paid booking', async () => {
      User.findById.mockResolvedValueOnce(null);
      
      await expect(BookingService.createBooking(bookingData, userId, operatorId))
        .rejects
        .toThrow('User not found');
    });
  });
});
