import mongoose from 'mongoose';

const InquiryItemSchema = new mongoose.Schema(
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

const InquirySchema = new mongoose.Schema(
  {
    inquiryNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    requestedBy: { type: String, default: '' },
    items: { type: [InquiryItemSchema], default: [] },
    status: { type: String, enum: ['draft', 'rfq_created', 'completed', 'cancelled'], default: 'draft' },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Inquiry = mongoose.model('Inquiry', InquirySchema);
