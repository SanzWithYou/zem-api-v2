const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const corsErrorHandler = require('./middleware/corsErrorHandler');

const app = express();

// FIXED: Path now matches Leapcell's warmup request
app.get('/kaithheathcheck', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000'];

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: process.env.CORS_METHODS
    ? process.env.CORS_METHODS.split(',')
    : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: process.env.CORS_HEADERS
    ? process.env.CORS_HEADERS.split(',')
    : ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error
app.use(corsErrorHandler);
app.use(errorHandler);

module.exports = app;
