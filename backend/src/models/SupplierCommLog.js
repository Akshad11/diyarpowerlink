import mongoose from 'mongoose';

const SupplierCommLogSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ['call', 'email', 'meeting', 'other'], default: 'call' },
    summary: { type: String, required: true }, // follow-up notes
    remarks: { type: String, default: '' },
    nextFollowUpDate: { type: Date }
  },
  { timestamps: true }
);

export const SupplierCommLog = mongoose.model('SupplierCommLog', SupplierCommLogSchema);
