import mongoose from 'mongoose';

const QuotationItemSchema = new mongoose.Schema(
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
    discount: { type: Number, default: 0 }, // percentage discount per line item
    taxAmount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 }, // price * qty
    total: { type: Number, default: 0 } // line grand total
  },
  { _id: false }
);

const QuotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 },
    date: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date },
    items: { type: [QuotationItemSchema], default: [] },
    discountType: { type: String, enum: ['percentage', 'flat', 'none'], default: 'none' },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 }, // calculated total discount
    taxableAmount: { type: Number, default: 0 }, // total after discount before tax
    taxAmount: { type: Number, default: 0 }, // total GST tax amount
    totalAmount: { type: Number, default: 0 }, // grand total (taxable + tax)
    status: { type: String, enum: ['draft', 'sent', 'accepted', 'declined', 'converted'], default: 'draft' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Quotation = mongoose.model('Quotation', QuotationSchema);
