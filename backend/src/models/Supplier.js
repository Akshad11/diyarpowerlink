import mongoose from 'mongoose';

const BankDetailsSchema = new mongoose.Schema(
  {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branchName: { type: String, default: '' }
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  { _id: false }
);

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    gst: { type: String, default: '' },
    pan: { type: String, default: '' },
    crNumber: { type: String, default: '' },
    bankDetails: { type: BankDetailsSchema, default: () => ({}) },
    address: { type: AddressSchema, default: () => ({}) },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

export const Supplier = mongoose.model('Supplier', SupplierSchema);
