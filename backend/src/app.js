import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { corsHeadersMiddleware, corsOptions } from './middleware/corsMiddleware.js';
import { uploadsDir } from './services/migrationService.js';
import apiRouter from './routes/index.js';

const app = express();

app.use(corsHeadersMiddleware);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static(uploadsDir));

// Ensure database is connected for all routes except health checks
const ensureDbConnected = async (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        return res.status(500).json({ error: 'Database URI not configured' });
      }

      console.log(`Database connection not active (state: ${mongoose.connection.readyState}). Attempting connection...`);

      if (mongoose.connection.readyState === 2) {
        // Wait for the ongoing connection attempt
        await new Promise((resolve, reject) => {
          const cleanUp = () => {
            mongoose.connection.removeListener('connected', onConnected);
            mongoose.connection.removeListener('error', onError);
          };
          const onConnected = () => {
            cleanUp();
            resolve();
          };
          const onError = (err) => {
            cleanUp();
            reject(err);
          };
          mongoose.connection.once('connected', onConnected);
          mongoose.connection.once('error', onError);
          
          // Set a timeout to prevent hanging
          setTimeout(() => {
            cleanUp();
            reject(new Error('Timeout waiting for database connection to be established'));
          }, 8000);
        });
      } else {
        // Establish new connection
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000
        });
      }
    } catch (err) {
      console.error('Database connection error in request middleware:', err.message);
      return res.status(503).json({
        error: 'Database connection unavailable',
        message: err.message,
      });
    }
  }
  next();
};

app.use(ensureDbConnected);

// Mount all API routes on /api
app.use('/api', apiRouter);

// Health Check
app.get(['/health', '/api/health'], (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const dbStatus = {
    status: isConnected ? 'up' : 'down',
    readyState: mongoose.connection.readyState,
    readyStateText: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }[mongoose.connection.readyState] || 'unknown',
  };

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'ok' : 'error',
    message: isConnected 
      ? 'Diyar backend running and connected to MongoDB' 
      : 'Diyar backend running but MongoDB is disconnected',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Diyar backend running' });
});

export default app;
