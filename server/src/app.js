import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sequelize, User } from './models/index.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { seedDatabase } from './database/seed.js';
import { securityConfig } from './config/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Render / Vercel / Nginx) so req.ip & rate limiting use real client IPs
app.set('trust proxy', 1);

// 1. Security Headers (Helmet with tuned CSP)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"]
    }
  }
}));

// 2. Strict CORS Configuration (Explicit Origin Allowlist)
const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([
  'https://prithwi-vms.vercel.app',
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000']
    : []),
  process.env.CLIENT_URL,
  ...envOrigins
].filter(Boolean)));

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / server-to-server / native clients without Origin header,
    // or strictly matched configured frontend origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Global Rate Limiter (OWASP prevention)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', globalLimiter);

// 4. Request Body & Cookie Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(securityConfig.cookieSecret));

// 5. HTTP Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 6. Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Visitor Management System API',
    version: '1.0.0'
  });
});

// 7. Mount Core API Routes
app.use('/api/v1', apiRoutes);

// 8. Serve Client Frontend SPA (if built)
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 9. 404 Route Handler for unmatched API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// 10. Centralized Error Handler
app.use(errorHandler);

// 11. Database Initialization and Server Boot
const startServer = async () => {
  try {
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Sync schema safely (creates missing tables such as system_settings without dropping data)
    await sequelize.sync();

    // Auto-seed demo users ONLY in non-production environments or when explicitly enabled
    const userCount = await User.count();
    if (userCount === 0) {
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_SEED === 'true') {
        logger.info('No users detected in database. Running initial database seed...');
        await seedDatabase({ force: false });
      } else {
        logger.warn(
          'Database has 0 users in production. Automatic demo seeding is disabled for security; run secure CLI provisioning with SEED_DEFAULT_PASSWORD.'
        );
      }
    }

    app.listen(PORT, () => {
      logger.info(`=================================================`);
      logger.info(`VMS Backend Server running on port ${PORT}`);
      logger.info(`API endpoint: http://localhost:${PORT}/api/v1`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`=================================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
