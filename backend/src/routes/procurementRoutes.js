import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  listSuppliers, createSupplier, updateSupplier, deleteSupplier,
  listSupplierCommLogs, createSupplierCommLog, updateSupplierCommLog, deleteSupplierCommLog,
  listInquiries, createInquiry, updateInquiry, deleteInquiry,
  listRfqs, createRfq, updateRfq, deleteRfq,
  listSupplierQuotations, createSupplierQuotation, updateSupplierQuotation, deleteSupplierQuotation,
  listPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
  getProcurementDashboardSummary
} from '../controllers/procurementController.js';

const router = express.Router();

// Apply auth middleware to all procurement routes
router.use(requireAuth);

// Suppliers
router.get('/suppliers', listSuppliers);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// Supplier Communication Logs
router.get('/supplier-comm-logs', listSupplierCommLogs);
router.post('/supplier-comm-logs', createSupplierCommLog);
router.put('/supplier-comm-logs/:id', updateSupplierCommLog);
router.delete('/supplier-comm-logs/:id', deleteSupplierCommLog);

// Purchase Inquiries
router.get('/inquiries', listInquiries);
router.post('/inquiries', createInquiry);
router.put('/inquiries/:id', updateInquiry);
router.delete('/inquiries/:id', deleteInquiry);

// RFQs
router.get('/rfqs', listRfqs);
router.post('/rfqs', createRfq);
router.put('/rfqs/:id', updateRfq);
router.delete('/rfqs/:id', deleteRfq);

// Supplier Quotations
router.get('/supplier-quotations', listSupplierQuotations);
router.post('/supplier-quotations', createSupplierQuotation);
router.put('/supplier-quotations/:id', updateSupplierQuotation);
router.delete('/supplier-quotations/:id', deleteSupplierQuotation);

// Purchase Orders (PO)
router.get('/purchase-orders', listPurchaseOrders);
router.post('/purchase-orders', createPurchaseOrder);
router.put('/purchase-orders/:id', updatePurchaseOrder);
router.delete('/purchase-orders/:id', deletePurchaseOrder);

// Dashboard stats summary
router.get('/dashboard-summary', getProcurementDashboardSummary);

export default router;
