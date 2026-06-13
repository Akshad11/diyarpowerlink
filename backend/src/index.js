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
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully.');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
  await seedDefaults();
  app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
};

start();

