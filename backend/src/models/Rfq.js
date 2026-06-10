import mongoose from 'mongoose';

const RfqItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    uom: { type: String, required: true },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const RfqSchema = new mongoose.Schema(
  {
    rfqNumber: { type: String, required: true, unique: true },
    inquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry' },
    date: { type: Date, required: true, default: Date.now },
    suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
    items: { type: [RfqItemSchema], default: [] },
    status: { type: String, enum: ['draft', 'sent', 'closed'], default: 'draft' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Rfq = mongoose.model('Rfq', RfqSchema);
