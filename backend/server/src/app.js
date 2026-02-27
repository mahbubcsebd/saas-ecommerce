const express = require('express'); // Server entry point

const app = express();
// require('./utils/cronBackup');



// http-errors is a middleware which creates an error object
const createError = require('http-errors');
// morgan is a middleware which logs all the requests to the console
const morgan = require('morgan');
// body-parser is a middleware which parses the incoming request body
const bodyParser = require('body-parser');
// Rate Limiter  is a middleware which limits the number of requests a client can make
const rateLimit = require('express-rate-limit');
// Cors is a middleware which allows cross-origin requests
const cors = require('cors');
const helmet = require('helmet');
// const xss = require('xss');
const compression = require('compression');
// const mongoSanitize = require('express-mongo-sanitize');
// const cron = require('node-cron');

const cookieParser = require('cookie-parser');
const swaggerUI = require('swagger-ui-express');
const morganMiddleware = require('./middlewares/loggerMiddleware');
const { globalErrorHandler } = require('./middlewares/errorHandler');
const { notFound } = require('./middlewares/notFound');

const swaggerSpec = require('./utils/swagger');
const routes = require('./routes');

const { ALLOWED_ORIGINS } = require('./config/env');

const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Middlewares
// Static files
// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://shop-kappa-lac.vercel.app', // Removed trailing slash
      ];
      if (allowedOrigins.indexOf(origin) !== -1) {
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

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(rateLimiter);
app.use(cookieParser());
app.use(morganMiddleware); // Request Logging Middleware
app.use(helmet()); // Secures HTTP headers
// app.use(xss()); // Sanitizes input data
app.use(compression()); // Enable Gzip/Brotli compression for responses
// app.use(mongoSanitize()); // Middleware to sanitize user input

// Swagger UI
app.use(
  '/api-docs',
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpec, { explorer: true })
);

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || ALLOWED_ORIGINS.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
// };

// app.use(cors(corsOptions));
// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//   })
// );


app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Home Page',
  });
});

// Use the centralized router
app.use('/api', routes);

// Client Error Handling Middleware (404)
app.use(notFound);

// Server Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
