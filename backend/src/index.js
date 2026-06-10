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
  await mongoose.connect(uri);
  await seedDefaults();
  app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
};

start();
