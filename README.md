# Project LV - Authentication Backend

A secure authentication backend API for the "For the Love of Travel" website built with Node.js, Express.js, and MongoDB.

## Features

- 🔐 User Registration and Login
- 🔑 JWT Token Authentication
- 📧 Password Reset via Email
- 🛡️ Password Hashing with bcrypt
- ⚡ Rate Limiting for Security
- 🔒 CORS Configuration
- 📊 MongoDB Integration
- 🧪 Development Email Testing

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Email Service**: Nodemailer (Gmail + Ethereal for testing)
- **Security**: express-rate-limit, CORS

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | User registration |
| POST | `/login` | User login |
| POST | `/forgot-password` | Send password reset email (production) |
| POST | `/forgot-password-test` | Send password reset email (development) |
| POST | `/reset-password` | Reset password with token |

### Request/Response Examples

#### User Registration
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Password Reset Request
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- Gmail account (for email service)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd project-lv-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Configure your `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/lv-travel-auth
JWT_SECRET=your-super-secret-jwt-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

5. Start MongoDB service

6. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

The server will start on `http://localhost:5000`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `EMAIL_USER` | Gmail address for sending emails | Yes |
| `EMAIL_PASS` | Gmail app password | Yes |
| `FRONTEND_URL` | Frontend URL for reset links | No (default: localhost:3000) |

## Database Schema

### User Model
```javascript
{
  fullname: String (required, max 100 chars)
  email: String (required, unique, validated)
  password: String (required, min 6 chars, hashed)
  resetToken: String (optional)
  resetTokenExpiry: Date (optional)
  createdAt: Date
  updatedAt: Date
}
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication tokens
- **Rate Limiting**: 3 password reset attempts per 15 minutes
- **CORS**: Configured for frontend integration
- **Input Validation**: Email format and password requirements
- **Token Expiry**: Reset tokens expire in 1 hour

## Email Configuration

### Production (Gmail)
1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Use your Gmail address and app password in `.env`

### Development (Ethereal)
- Uses Ethereal Email for testing
- No real emails sent
- Preview URLs provided in console

## Project Structure

```
├── models/
│   └── User.js              # User schema and methods
├── routes/
│   └── authRoutes.js        # Authentication routes
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
├── env.example              # Environment variables template
└── README.md                # This file
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not implemented yet)

## API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

## CORS Configuration

The server is configured to accept requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:3001`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository.

