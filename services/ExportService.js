const { Parser } = require('json2csv');
const BookingService = require('./BookingService');

const exportBookings = async (operatorId) => {
  if (!operatorId) {
    throw new Error('Operator ID is required');
  }

  const { bookings } = await BookingService.getAllBookings(operatorId);

  const flattenedBookings = bookings.map((b) => ({
    BookingID: b.bookingId,
    Status: b.status,
    BookingDate: b.bookingDate,
    LRType: b.lrType,
    FromOffice: b.fromOffice?.name || '',
    ToOffice: b.toOffice?.name || '',
    SenderName: b.senderName,
    SenderPhone: b.senderPhone,
    senderAddress: b.senderAddress,
    ReceiverName: b.receiverName,
    ReceiverPhone: b.receiverPhone,
    ReceiverAddress: b.receiverAddress,
    Weight: b.weight,
    Quantity: b.quantity,
    ValueOfGoods: b.valueOfGoods,
    FreightCharge: b.freightCharge,
    TotalAmount: b.totalAmountCharge,
    AssignedVehicle: b.assignedVehicle?.vehicleNumber || '',
    DispatchDate: b.dispatchDate,
    ArrivalDate: b.arrivalDate,
    CreatedAt: b.createdAt,
  }));

  const parser = new Parser();
  const csv = parser.parse(flattenedBookings);
  return csv;
};

/**
 * Export unassigned bookings for an operator
 */
const exportUnassignedBookings = async (operatorId, query = '') => {
  if (!operatorId) {
    throw new Error('Operator ID is required');
  }

  const result = await BookingService.getUnassignedBookings(operatorId, 1, 10000, query);
  const bookings = result.bookings;

  if (!bookings.length) {
    throw new Error('No unassigned bookings found to export');
  }

  const fields = [
    { label: 'Booking ID', value: 'bookingId' },
    { label: 'Sender Name', value: 'senderName' },
    { label: 'Receiver Name', value: 'receiverName' },
    { label: 'Booked By', value: 'bookedBy' },
    { label: 'From Office', value: 'fromOffice.name' },
    { label: 'To Office', value: 'toOffice.name' },
    { label: 'Created At', value: 'createdAt' }
  ];

  const parser = new Parser({ fields });
  return parser.parse(bookings);
};

/**
 * Export arrived bookings for an operator
 */
const exportArrivedBookings = async (operatorId, query = '') => {
  if (!operatorId) {
    throw new Error('Operator ID is required');
  }

  const result = await BookingService.getArrivedBookings(operatorId, 1, 10000, query);
  const bookings = result.bookings;

  if (!bookings.length) {
    throw new Error('No arrived bookings found to export');
  }

  const fields = [
    { label: 'Booking ID', value: 'bookingId' },
    { label: 'Sender Name', value: 'senderName' },
    { label: 'Receiver Name', value: 'receiverName' },
    { label: 'From Office', value: 'fromOffice.name' },
    { label: 'To Office', value: 'toOffice.name' },
    { label: 'Arrival Date', value: 'arrivalDate' },
    { label: 'Created At', value: 'createdAt' }
  ];

  const parser = new Parser({ fields });
  return parser.parse(bookings);
};

const exportInTransitBookings = async (operatorId, query = '') => {
  if (!operatorId) {
    throw new Error('Operator ID is required');
  }

  const result = await BookingService.getInTransitBookings(operatorId, 1, 10000, query);
  const bookings = result.bookings;

  if (!bookings.length) {
    throw new Error('No in-transit bookings found to export');
  }

  const fields = [
    { label: 'Booking ID', value: 'bookingId' },
    { label: 'Sender Name', value: 'senderName' },
    { label: 'Receiver Name', value: 'receiverName' },
    { label: 'From Office', value: 'fromOffice.name' },
    { label: 'To Office', value: 'toOffice.name' },
    { label: 'Dispatch Date', value: 'dispatchDate' },
    { label: 'Created At', value: 'createdAt' }
  ];

  const parser = new Parser({ fields });
  return parser.parse(bookings);
};

module.exports = {
  exportBookings,
  exportUnassignedBookings,
  exportArrivedBookings,
  exportInTransitBookings
};