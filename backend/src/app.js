import express from 'express';
import cors from 'cors';
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
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Diyar backend running' });
});

export default app;
