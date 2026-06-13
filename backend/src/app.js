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

// Mount all API routes on /api
app.use('/api', apiRouter);

// Health Check
app.get('/health', (_req, res) => {
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
