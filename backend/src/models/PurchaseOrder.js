import mongoose from 'mongoose';

const PurchaseOrderItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    uom: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true },
    taxName: { type: String, required: true },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  { _id: false }
);

const PurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    supplierQuotation: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierQuotation', index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 },
    date: { type: Date, required: true, default: Date.now, index: true },
    deliveryDate: { type: Date },
    items: { type: [PurchaseOrderItemSchema], default: [] },
    discountType: { type: String, enum: ['percentage', 'flat', 'none'], default: 'none' },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'ordered', 'received', 'cancelled'], default: 'draft' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
