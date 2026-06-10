import mongoose from 'mongoose';

const TaxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    rate: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export const Tax = mongoose.model('Tax', TaxSchema);
