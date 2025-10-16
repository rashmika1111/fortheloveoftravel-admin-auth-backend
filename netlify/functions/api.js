const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("../../routes/authRoutes");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001',
    'https://your-frontend-domain.netlify.app',
    'https://your-admin-frontend-domain.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Project LV Backend API is running!" });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });

// Netlify Functions handler
exports.handler = async (event, context) => {
  // Convert Netlify event to Express request/response
  const { httpMethod, path, headers, body, queryStringParameters } = event;
  
  // Create mock request and response objects
  const req = {
    method: httpMethod,
    url: path,
    headers: headers || {},
    body: body ? JSON.parse(body) : {},
    query: queryStringParameters || {},
    cookies: headers?.cookie ? parseCookies(headers.cookie) : {}
  };

  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    json: (data) => {
      res.body = JSON.stringify(data);
      res.headers['Content-Type'] = 'application/json';
    },
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    send: (data) => {
      res.body = data;
    }
  };

  // Handle the request
  try {
    // Simple routing for auth endpoints
    if (path.startsWith('/api/auth')) {
      const authPath = path.replace('/api/auth', '');
      
      // Import and use auth routes
      const authRouter = require('../../routes/authRoutes');
      
      // Handle different HTTP methods
      if (httpMethod === 'POST' && authPath === '/login') {
        // Handle login
        const { email, password } = JSON.parse(body || '{}');
        // You'll need to implement the actual login logic here
        res.json({ message: 'Login endpoint', email, password });
      } else if (httpMethod === 'POST' && authPath === '/register') {
        // Handle registration
        const { email, password, name } = JSON.parse(body || '{}');
        res.json({ message: 'Register endpoint', email, password, name });
      } else if (httpMethod === 'GET' && authPath === '/verify') {
        // Handle token verification
        res.json({ message: 'Verify endpoint' });
      } else {
        res.status(404).json({ error: 'Endpoint not found' });
      }
    } else if (path === '/') {
      res.json({ message: "Project LV Backend API is running!" });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

  return {
    statusCode: res.statusCode,
    headers: res.headers,
    body: res.body
  };
};

// Helper function to parse cookies
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
    });
  }
  return cookies;
}
