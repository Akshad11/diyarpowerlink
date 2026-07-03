import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Salaries & Wages',
        'Rent & Rates',
        'Utilities',
        'Marketing & Advertising',
        'Office Supplies',
        'Travel & Conveyance',
        'Tax & Legal Fees',
        'Others'
      ],
      required: true,
      index: true
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Cash', 'Credit Card', 'Cheque', 'Other'],
      default: 'Bank Transfer'
    },
    reference: { type: String, default: '' },
    notes: { type: String, default: '' },
    attachment: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Expense = mongoose.model('Expense', ExpenseSchema);
