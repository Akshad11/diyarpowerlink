import mongoose from 'mongoose';

const ExchangeRateSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, uppercase: true }, // e.g., 'USD'
    to: { type: String, required: true, uppercase: true },   // e.g., 'INR' (base currency)
    rate: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export const ExchangeRate = mongoose.model('ExchangeRate', ExchangeRateSchema);
