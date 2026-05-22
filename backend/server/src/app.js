const express = require('express'); // Server entry point

const app = express();

// http-errors is a middleware which creates an error object
const createError = require('http-errors');
// body-parser is a middleware which parses the incoming request body
const bodyParser = require('body-parser');
// Rate Limiter  is a middleware which limits the number of requests a client can make
const rateLimit = require('express-rate-limit');
// Cors is a middleware which allows cross-origin requests
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

const cookieParser = require('cookie-parser');
const swaggerUI = require('swagger-ui-express');
const morganMiddleware = require('./middlewares/loggerMiddleware');
const { globalErrorHandler } = require('./middlewares/errorHandler');
const { notFound } = require('./middlewares/notFound');

const swaggerSpec = require('./utils/swagger');
const routes = require('./routes');

const { ALLOWED_ORIGINS } = require('./config/env');

// ─── Rate Limiter ─────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 requests per minute
  message: 'Too many requests from this IP, please try again shortly',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth routes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 min
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── CORS ─────────────────────────────────────────────
// Default dev origins (always allowed)
const defaultOrigins = [
  'http://localhost:8050',
  'http://localhost:8060',
  'http://127.0.0.1:8050',
  'http://127.0.0.1:8060',
  'https://admin.mahbuburrahman.xyz',
  'https://shop.mahbuburrahman.xyz',
];

// Merge default origins with env-configured production origins
const allowedOrigins = [...new Set([...defaultOrigins, ...ALLOWED_ORIGINS])];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow any localhost, local subnets (192.168.x.x, 10.x.x.x, 127.0.0.1, etc.), or if in development
      const isLocal = 
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
        process.env.NODE_ENV === 'development';

      if (isLocal || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-lang'],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// ─── Middlewares ────────────────────────────────────────
app.use(express.static('public'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(globalLimiter);
app.use(cookieParser());
app.use(morganMiddleware); // Request Logging Middleware
app.use(helmet()); // Secures HTTP headers
// app.use(mongoSanitize()); // Sanitizes NoSQL injection from user input
app.use(compression()); // Enable Gzip/Brotli compression for responses

// ─── Swagger UI ────────────────────────────────────────
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec, { explorer: true }));

// ─── Routes ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Mahbub Shop API is running',
  });
});

// Apply stricter rate limit on auth routes
app.use('/api/auth', authLimiter);

// Use the centralized router
app.use('/api', routes);

// Client Error Handling Middleware (404)
app.use(notFound);

// Server Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
