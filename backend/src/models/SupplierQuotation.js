import mongoose from 'mongoose';

const SupplierQuotationItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    uom: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // supplier unit price
    taxRate: { type: Number, required: true },
    taxName: { type: String, required: true },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  { _id: false }
);

const SupplierQuotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, required: true }, // supplier's quotation reference
    rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'Rfq' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 },
    date: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date },
    items: { type: [SupplierQuotationItemSchema], default: [] },
    discountType: { type: String, enum: ['percentage', 'flat', 'none'], default: 'none' },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['received', 'accepted', 'rejected', 'converted'], default: 'received' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const SupplierQuotation = mongoose.model('SupplierQuotation', SupplierQuotationSchema);
