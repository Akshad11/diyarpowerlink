import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    type: { type: String, enum: ['product', 'service'], required: true },
    uom: { type: mongoose.Schema.Types.ObjectId, ref: 'Uom', required: true },
    tax: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax', required: true },
    price: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Item = mongoose.model('Item', ItemSchema);
