import './bootstrap.js';
import mongoose from 'mongoose';
import app from './app.js';
import { seedDefaults } from './controllers/cmsController.js';

const PORT = process.env.PORT || 4000;

const start = async () => {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    console.error('Missing MONGODB_URI in environment');
    process.exit(1);
  }

  // Set up connection event listeners
  mongoose.connection.on('connected', async () => {
    console.log('Connected to MongoDB successfully.');
    try {
      await seedDefaults();
      console.log('Database defaults seeded successfully.');
    } catch (err) {
      console.error('Failed to seed database defaults:', err.message);
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection disconnected.');
  });

  console.log('Connecting to MongoDB...');
  // Connect in the background so the server can boot and serve health checks
  mongoose.connect(uri).catch(() => {});

  app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
};

start();

