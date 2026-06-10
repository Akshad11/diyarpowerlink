import { Supplier } from '../models/Supplier.js';
import { SupplierCommLog } from '../models/SupplierCommLog.js';
import { Inquiry } from '../models/Inquiry.js';
import { Rfq } from '../models/Rfq.js';
import { SupplierQuotation } from '../models/SupplierQuotation.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { getNextSequenceNumber } from '../services/sequenceService.js';

// Procurement - Suppliers CRUD
export const listSuppliers = async (_req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Procurement - Supplier Communication Logs CRUD
export const listSupplierCommLogs = async (req, res) => {
  try {
    const { supplierId } = req.query;
    const filter = supplierId ? { supplier: supplierId } : {};
    const logs = await SupplierCommLog.find(filter).populate('supplier').sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createSupplierCommLog = async (req, res) => {
  try {
    const log = await SupplierCommLog.create(req.body);
    const populated = await SupplierCommLog.findById(log._id).populate('supplier');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateSupplierCommLog = async (req, res) => {
  try {
    const log = await SupplierCommLog.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('supplier');
    res.json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteSupplierCommLog = async (req, res) => {
  try {
    await SupplierCommLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Procurement - Inquiries CRUD
export const listInquiries = async (_req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createInquiry = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.inquiryNumber) {
      payload.inquiryNumber = await getNextSequenceNumber('INQ', Inquiry, 'inquiryNumber');
    }
    const created = await Inquiry.create(payload);
    res.json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateInquiry = async (req, res) => {
  try {
    const updated = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteInquiry = async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Procurement - RFQs CRUD
export const listRfqs = async (_req, res) => {
  try {
    const rfqs = await Rfq.find().populate('suppliers').populate('inquiry').sort({ createdAt: -1 });
    res.json(rfqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createRfq = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.rfqNumber) {
      payload.rfqNumber = await getNextSequenceNumber('RFQ', Rfq, 'rfqNumber');
    }
    const created = await Rfq.create(payload);
    if (payload.inquiry) {
      await Inquiry.findByIdAndUpdate(payload.inquiry, { status: 'rfq_created' });
    }
    const populated = await Rfq.findById(created._id).populate('suppliers').populate('inquiry');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateRfq = async (req, res) => {
  try {
    const updated = await Rfq.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('suppliers').populate('inquiry');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteRfq = async (req, res) => {
  try {
    await Rfq.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Procurement - Supplier Quotations CRUD
export const listSupplierQuotations = async (_req, res) => {
  try {
    const quotations = await SupplierQuotation.find().populate('supplier').populate('rfq').sort({ createdAt: -1 });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createSupplierQuotation = async (req, res) => {
  try {
    const created = await SupplierQuotation.create(req.body);
    const populated = await SupplierQuotation.findById(created._id).populate('supplier').populate('rfq');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateSupplierQuotation = async (req, res) => {
  try {
    const updated = await SupplierQuotation.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('supplier').populate('rfq');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteSupplierQuotation = async (req, res) => {
  try {
    await SupplierQuotation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Procurement - Purchase Orders CRUD
export const listPurchaseOrders = async (_req, res) => {
  try {
    const orders = await PurchaseOrder.find().populate('supplier').populate('supplierQuotation').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createPurchaseOrder = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.poNumber) {
      payload.poNumber = await getNextSequenceNumber('PO', PurchaseOrder, 'poNumber');
    }
    const created = await PurchaseOrder.create(payload);
    if (payload.supplierQuotation) {
      await SupplierQuotation.findByIdAndUpdate(payload.supplierQuotation, { status: 'converted' });
    }
    const populated = await PurchaseOrder.findById(created._id).populate('supplier').populate('supplierQuotation');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updatePurchaseOrder = async (req, res) => {
  try {
    const updated = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('supplier').populate('supplierQuotation');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deletePurchaseOrder = async (req, res) => {
  try {
    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Procurement - Dashboard Summary
export const getProcurementDashboardSummary = async (_req, res) => {
  try {
    const [
      totalSuppliers,
      pendingOrders,
      totalInquiries,
      rfqStats,
      poStats
    ] = await Promise.all([
      Supplier.countDocuments(),
      PurchaseOrder.countDocuments({ status: { $in: ['draft', 'ordered'] } }),
      Inquiry.countDocuments(),
      Rfq.aggregate([
        { $group: { _id: null, count: { $sum: 1 } } }
      ]),
      PurchaseOrder.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, totalVal: { $sum: '$totalAmount' } } }
      ])
    ]);

    const rfqs = rfqStats[0] || { count: 0 };
    const pos = poStats[0] || { count: 0, totalVal: 0 };

    res.json({
      totalSuppliers,
      pendingOrders,
      totalInquiries,
      rfqs: {
        count: rfqs.count
      },
      purchaseOrders: {
        count: pos.count,
        total: pos.totalVal
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
