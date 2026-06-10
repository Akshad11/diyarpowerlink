import mongoose from 'mongoose';

const CurrencySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true }, // e.g., 'INR', 'USD', 'EUR', 'AED'
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    isBase: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Currency = mongoose.model('Currency', CurrencySchema);
