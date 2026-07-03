import mongoose from 'mongoose';

const DeliveryNoteItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    uom: { type: String, required: true },
    remarks: { type: String, default: '' }
  },
  { _id: false }
);

const DeliveryNoteSchema = new mongoose.Schema(
  {
    deliveryNoteNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', index: true },
    salesInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice', index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    status: { type: String, enum: ['draft', 'dispatched', 'delivered', 'cancelled'], default: 'draft' },
    items: { type: [DeliveryNoteItemSchema], default: [] },
    notes: { type: String, default: '' },
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

export const DeliveryNote = mongoose.model('DeliveryNote', DeliveryNoteSchema);
