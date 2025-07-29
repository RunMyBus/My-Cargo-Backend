# Cargo Hub Backend

A comprehensive Node.js/Express cargo management system with multi-tenant architecture, role-based authentication, and real-time shipment tracking.

## Features

- **Multi-tenant cargo booking system** with operator-based isolation
- **Role-based authentication** using Passport.js (JWT and local strategies)
- **Event history tracking** for bookings (loaded, unloaded, delivered, cancelled)
- **Cash transfer and transaction management**
- **E-way bill integration**
- **Shipment tracking**
- **Report generation** (booking and branch reports)
- **Export functionality** (CSV, Excel)
- **Comprehensive security** with rate limiting, CORS, and input validation

## Architecture

### Core Components

- **Models** (`models/`): Mongoose schemas for core entities
  - Booking, Branch, User, Operator, Vehicle, Transaction, CashTransfer, Role, Permission
- **Services** (`services/`): Business logic layer containing core operations
- **Controllers** (`controllers/`): Request handlers that use services
- **Routes** (`Routes/`): Express route definitions, centralized in `Routes/index.js`

### Data Flow

1. Routes receive requests and validate authentication
2. Controllers handle request/response logic
3. Services contain business logic and database operations
4. Models define data structure and validation

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cargo-hub-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
- `APP_RUNNING_PORT`: Server port
- `NODE_ENV`: Environment (development/production)
- Database connection strings
- JWT secrets

5. Run database migrations:
```bash
npm run migrate
```

6. Seed initial data (optional):
```bash
npm run seed
```

### Running the Application

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The server will start on the port specified by the `APP_RUNNING_PORT` environment variable.

## Available Scripts

### Development
- `npm start` - Start the server
- `npm run dev` - Development mode with nodemon

### Testing
- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:integration` - Run integration tests
- `npm run test:unit` - Run unit tests
- `npm run test:watch` - Watch mode for tests

### Database
- `npm run migrate` - Run migrations
- `npm run migrate:rollback <version>` - Rollback migrations
- `npm run seed` - Seed data

## API Documentation

The API includes the following main endpoints:

- **Authentication** (`/auth`) - User login, registration, JWT management
- **Bookings** (`/bookings`) - Cargo booking management
- **Branches** (`/branches`) - Branch operations
- **Users** (`/users`) - User management
- **Operators** (`/operators`) - Operator management
- **Vehicles** (`/vehicles`) - Vehicle tracking
- **Transactions** (`/transactions`) - Financial transactions
- **Cash Transfers** (`/cash-transfers`) - Cash transfer operations
- **Reports** (`/reports`) - Generate booking and branch reports
- **E-way Bills** (`/eway-bills`) - E-way bill integration
- **Shipment Tracking** (`/track`) - Real-time shipment tracking

## Security Features

- **Helmet.js** for security headers
- **Rate limiting** (configurable per endpoint)
  - General API: 100 requests per 15 minutes
  - Authentication: 5 attempts per 15 minutes
- **CORS protection** with environment-configurable origins
- **Input sanitization** to prevent XSS attacks
- **Joi-based validation** for all API endpoints
- **Request correlation IDs** for error tracking

## Testing

The project includes comprehensive testing:

- **Unit tests** for utilities and middleware
- **Integration tests** for API endpoints
- **Multi-tenant isolation tests** to ensure data segregation
- **Coverage thresholds** enforced (60% minimum)

Run tests with:
```bash
npm test
```

## Database

- **MongoDB** with Mongoose ODM
- **Version-controlled migrations** with rollback capability
- **Performance indexes** for multi-tenant queries
- **Timestamp standardization** across collections

## Logging

- **Winston logger** configured for structured logging
- Logs stored in `logs/` directory (`combined.log`, `error.log`)
- **Request logging middleware** logs all HTTP requests
- **Error correlation IDs** for tracking issues

## Project Structure

```
├── app.js                 # Application entry point
├── config/                # Configuration files
├── controllers/           # Request handlers
├── database/             # Database configuration
├── middleware/           # Custom middleware
├── migrations/           # Database migrations
├── models/               # Mongoose schemas
├── Routes/               # API routes
├── services/             # Business logic
├── tests/                # Test files
├── utils/                # Utility functions
└── validations/          # Input validation schemas
```

## Environment Variables

Create a `.env` file with the following variables:

```env
APP_RUNNING_PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cargo-hub
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

ISC License

## Support

For support and questions, please refer to the project documentation or create an issue in the repository.