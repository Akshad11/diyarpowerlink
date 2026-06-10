import mongoose from 'mongoose';

const UomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true }
  },
  { timestamps: true }
);

export const Uom = mongoose.model('Uom', UomSchema);
