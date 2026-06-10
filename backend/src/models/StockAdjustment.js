import mongoose from 'mongoose';

const StockAdjustmentItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    uom: { type: String, required: true },
    qty: { type: Number, required: true }, // positive or negative adjustment quantity
    remarks: { type: String, default: '' }
  },
  { _id: false }
);

const StockAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentNumber: { type: String, required: true, unique: true },
    adjustmentDate: { type: Date, required: true, default: Date.now },
    reason: { type: String, enum: ['Damaged', 'Lost', 'Manual Correction'], required: true },
    items: { type: [StockAdjustmentItemSchema], default: [] },
    status: { type: String, enum: ['draft', 'adjusted', 'cancelled'], default: 'draft' },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

export const StockAdjustment = mongoose.model('StockAdjustment', StockAdjustmentSchema);
