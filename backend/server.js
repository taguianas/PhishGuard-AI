require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createLogger, transports, format } = require('winston');

fs.mkdirSync('logs', { recursive: true });

const urlRoutes = require('./routes/url');
const emailRoutes = require('./routes/email');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 4000;

// Logger
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/scans.log' }),
  ],
});

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '50kb' }));

// Rate limiting — 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Attach logger to requests
app.use((req, _res, next) => {
  req.logger = logger;
  next();
});

// Routes
app.use('/api/url', urlRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
