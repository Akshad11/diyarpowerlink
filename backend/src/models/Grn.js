import mongoose from 'mongoose';

const GrnItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    qtyOrdered: { type: Number, required: true, min: 0 },
    qtyReceived: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true },
    remarks: { type: String, default: '' }
  },
  { _id: false }
);

const GrnSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, unique: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    receivedDate: { type: Date, required: true, default: Date.now },
    items: { type: [GrnItemSchema], default: [] },
    status: { type: String, enum: ['draft', 'received', 'cancelled'], default: 'draft' },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Grn = mongoose.model('Grn', GrnSchema);
