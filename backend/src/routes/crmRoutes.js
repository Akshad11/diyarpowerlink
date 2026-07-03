import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  listCustomers, createCustomer, updateCustomer, deleteCustomer,
  listUoms, createUom, updateUom, deleteUom,
  listTaxes, createTax, updateTax, deleteTax,
  listItems, createItem, updateItem, deleteItem,
  listQuotations, createQuotation, updateQuotation, deleteQuotation,
  listSalesOrders, createSalesOrder, updateSalesOrder, deleteSalesOrder,
  listSalesInvoices, createSalesInvoice, updateSalesInvoice, deleteSalesInvoice,
  listDeliveryNotes, createDeliveryNote, updateDeliveryNote, deleteDeliveryNote,
  sendCrmEmail, getCrmDashboardSummary
} from '../controllers/crmController.js';

const router = express.Router();

// Apply auth middleware to all CRM routes
router.use(requireAuth);

// Customers
router.get('/customers', listCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// UOMs
router.get('/uoms', listUoms);
router.post('/uoms', createUom);
router.put('/uoms/:id', updateUom);
router.delete('/uoms/:id', deleteUom);

// Taxes
router.get('/taxes', listTaxes);
router.post('/taxes', createTax);
router.put('/taxes/:id', updateTax);
router.delete('/taxes/:id', deleteTax);

// Items Catalog
router.get('/items', listItems);
router.post('/items', createItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

// Quotations
router.get('/quotations', listQuotations);
router.post('/quotations', createQuotation);
router.put('/quotations/:id', updateQuotation);
router.delete('/quotations/:id', deleteQuotation);

// Sales Orders
router.get('/sales-orders', listSalesOrders);
router.post('/sales-orders', createSalesOrder);
router.put('/sales-orders/:id', updateSalesOrder);
router.delete('/sales-orders/:id', deleteSalesOrder);

// Sales Invoices
router.get('/sales-invoices', listSalesInvoices);
router.post('/sales-invoices', createSalesInvoice);
router.put('/sales-invoices/:id', updateSalesInvoice);
router.delete('/sales-invoices/:id', deleteSalesInvoice);

// Delivery Notes
router.get('/delivery-notes', listDeliveryNotes);
router.post('/delivery-notes', createDeliveryNote);
router.put('/delivery-notes/:id', updateDeliveryNote);
router.delete('/delivery-notes/:id', deleteDeliveryNote);

// Email dispatch
router.post('/send-email', sendCrmEmail);

// Dashboard stats summary
router.get('/dashboard-summary', getCrmDashboardSummary);

export default router;
