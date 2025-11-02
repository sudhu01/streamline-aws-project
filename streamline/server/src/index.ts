import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { clerkMiddleware } from '@clerk/express';
import { logger } from './utils/logger';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { dashboardRouter } from './routes/dashboard';
import { workflowsRouter } from './routes/workflows';
import { logsRouter } from './routes/logs';
import { triggersRouter } from './routes/triggers';
import { actionsRouter } from './routes/actions';
import { integrationsRouter } from './routes/integrations';
import { apiKeysRouter } from './routes/apiKeys';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
// Raw body only for webhook path; JSON for others
app.use('/api/auth/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Register Clerk middleware - this is required for getAuth() to work properly
// It processes Clerk sessions and bearer tokens
app.use(clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
}));

// Request logging middleware for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.method !== 'GET') {
    logger.info(`[Request Body] ${JSON.stringify(req.body, null, 2)}`);
  }
  logger.info(`[Headers] Authorization: ${req.headers.authorization ? req.headers.authorization.substring(0, 30) + '...' : 'missing'}`);
  next();
});

// Rate limiting - very lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10000, // Very high limit for development (10000 requests per 15 minutes)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/api/health'
});
app.use(limiter);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/triggers', triggersRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/api-keys', apiKeysRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  logger.info(`Streamline server listening on port ${port}`);
  logger.info(`CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
}).on('error', (err: any) => {
  logger.error(`Server error: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${port} is already in use. Please stop the other process or change the PORT environment variable.`);
  }
});
