import mongoose from 'mongoose';

const SalesOrderItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    type: { type: String, required: true },
    uom: { type: String, required: true },
    taxRate: { type: Number, required: true },
    taxName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  { _id: false }
);

const SalesOrderSchema = new mongoose.Schema(
  {
    salesOrderNumber: { type: String, required: true, unique: true },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 },
    date: { type: Date, required: true, default: Date.now },
    items: { type: [SalesOrderItemSchema], default: [] },
    discountType: { type: String, enum: ['percentage', 'flat', 'none'], default: 'none' },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'confirmed', 'invoiced', 'cancelled'], default: 'draft' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const SalesOrder = mongoose.model('SalesOrder', SalesOrderSchema);
