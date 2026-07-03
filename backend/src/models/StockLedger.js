import mongoose from 'mongoose';

const StockLedgerSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    transactionType: { type: String, enum: ['GRN', 'SalesInvoice', 'Adjustment'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    referenceNumber: { type: String, required: true },
    quantity: { type: Number, required: true }, // positive for receipt/adj-in, negative for invoice/adj-out
    date: { type: Date, required: true, default: Date.now, index: true },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

export const StockLedger = mongoose.model('StockLedger', StockLedgerSchema);
