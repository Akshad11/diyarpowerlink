import { Customer } from '../models/Customer.js';
import { Uom } from '../models/Uom.js';
import { Tax } from '../models/Tax.js';
import { Item } from '../models/Item.js';
import { Quotation } from '../models/Quotation.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { DeliveryNote } from '../models/DeliveryNote.js';
import { getNextSequenceNumber } from '../services/sequenceService.js';
import { sendMail } from '../services/emailService.js';
import { syncSalesInvoiceStock } from '../services/inventoryService.js';

// CRM - Customers CRUD
export const listCustomers = async (_req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CRM - UOMs CRUD
export const listUoms = async (_req, res) => {
  try {
    const uoms = await Uom.find().sort({ name: 1 });
    res.json(uoms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createUom = async (req, res) => {
  try {
    const uom = await Uom.create(req.body);
    res.json(uom);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateUom = async (req, res) => {
  try {
    const uom = await Uom.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(uom);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteUom = async (req, res) => {
  try {
    await Uom.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CRM - Taxes CRUD
export const listTaxes = async (_req, res) => {
  try {
    const taxes = await Tax.find().sort({ rate: 1 });
    res.json(taxes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createTax = async (req, res) => {
  try {
    const tax = await Tax.create(req.body);
    res.json(tax);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateTax = async (req, res) => {
  try {
    const tax = await Tax.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(tax);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteTax = async (req, res) => {
  try {
    await Tax.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CRM - Items Master CRUD
export const listItems = async (_req, res) => {
  try {
    const items = await Item.find().populate('uom').populate('tax').sort({ name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createItem = async (req, res) => {
  try {
    const created = await Item.create(req.body);
    const populated = await Item.findById(created._id).populate('uom').populate('tax');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateItem = async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('uom').populate('tax');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteItem = async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CRM - Quotations CRUD
export const listQuotations = async (_req, res) => {
  try {
    const quotations = await Quotation.find().populate('customer').sort({ createdAt: -1 });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createQuotation = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.quotationNumber) {
      payload.quotationNumber = await getNextSequenceNumber('QT', Quotation, 'quotationNumber');
    }
    const created = await Quotation.create(payload);
    const populated = await Quotation.findById(created._id).populate('customer');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateQuotation = async (req, res) => {
  try {
    const updated = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('customer');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteQuotation = async (req, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CRM - Sales Orders CRUD
export const listSalesOrders = async (_req, res) => {
  try {
    const orders = await SalesOrder.find().populate('customer').populate('quotation').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createSalesOrder = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.salesOrderNumber) {
      payload.salesOrderNumber = await getNextSequenceNumber('SO', SalesOrder, 'salesOrderNumber');
    }
    const created = await SalesOrder.create(payload);
    if (payload.quotation) {
      await Quotation.findByIdAndUpdate(payload.quotation, { status: 'converted' });
    }
    const populated = await SalesOrder.findById(created._id).populate('customer').populate('quotation');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateSalesOrder = async (req, res) => {
  try {
    const updated = await SalesOrder.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('customer').populate('quotation');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteSalesOrder = async (req, res) => {
  try {
    await SalesOrder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CRM - Sales Invoices CRUD
export const listSalesInvoices = async (_req, res) => {
  try {
    const invoices = await SalesInvoice.find().populate('customer').populate('salesOrder').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const createSalesInvoice = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.invoiceNumber) {
      payload.invoiceNumber = await getNextSequenceNumber('INV', SalesInvoice, 'invoiceNumber');
    }
    const created = await SalesInvoice.create(payload);
    await syncSalesInvoiceStock(created);
    if (payload.salesOrder) {
      await SalesOrder.findByIdAndUpdate(payload.salesOrder, { status: 'invoiced' });
    }
    const populated = await SalesInvoice.findById(created._id).populate('customer').populate('salesOrder');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const updateSalesInvoice = async (req, res) => {
  try {
    const updated = await SalesInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('customer').populate('salesOrder');
    await syncSalesInvoiceStock(updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteSalesInvoice = async (req, res) => {
  try {
    const invoice = await SalesInvoice.findById(req.params.id);
    if (invoice) {
      invoice.status = 'cancelled';
      await syncSalesInvoiceStock(invoice);
      await SalesInvoice.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CRM - Delivery Notes CRUD
export const listDeliveryNotes = async (_req, res) => {
  try {
    const notes = await DeliveryNote.find()
      .populate('customer')
      .populate('salesOrder')
      .populate('salesInvoice')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createDeliveryNote = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.deliveryNoteNumber) {
      payload.deliveryNoteNumber = await getNextSequenceNumber('DN', DeliveryNote, 'deliveryNoteNumber');
    }
    const created = await DeliveryNote.create(payload);
    const populated = await DeliveryNote.findById(created._id)
      .populate('customer')
      .populate('salesOrder')
      .populate('salesInvoice');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateDeliveryNote = async (req, res) => {
  try {
    const updated = await DeliveryNote.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('customer')
      .populate('salesOrder')
      .populate('salesInvoice');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteDeliveryNote = async (req, res) => {
  try {
    await DeliveryNote.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// CRM - Send Email with PDF Attachment
export const sendCrmEmail = async (req, res) => {
  const { to, subject, body, pdfBase64, filename } = req.body || {};
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Recipient (to), subject, and body are required' });
  }

  try {
    const attachments = [];
    if (pdfBase64 && filename) {
      const buffer = Buffer.from(pdfBase64, 'base64');
      attachments.push({
        filename: filename,
        content: buffer,
        contentType: 'application/pdf'
      });
    }

    const result = await sendMail({ to, subject, html: body, attachments });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Email delivery failed' });
  }
};

// CRM - Dashboard Summary
export const getCrmDashboardSummary = async (_req, res) => {
  try {
    const [
      totalCustomers,
      totalItems,
      quotationStats,
      salesOrderStats,
      invoiceStats
    ] = await Promise.all([
      Customer.countDocuments(),
      Item.countDocuments(),
      Quotation.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, totalVal: { $sum: '$totalAmount' } } }
      ]),
      SalesOrder.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, totalVal: { $sum: '$totalAmount' } } }
      ]),
      SalesInvoice.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalVal: { $sum: '$totalAmount' },
            paidVal: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0]
              }
            },
            unpaidVal: {
              $sum: {
                $cond: [{ $eq: ['$status', 'unpaid'] }, '$totalAmount', 0]
              }
            }
          }
        }
      ])
    ]);

    const quotations = quotationStats[0] || { count: 0, totalVal: 0 };
    const salesOrders = salesOrderStats[0] || { count: 0, totalVal: 0 };
    const invoices = invoiceStats[0] || { count: 0, totalVal: 0, paidVal: 0, unpaidVal: 0 };

    res.json({
      totalCustomers,
      totalItems,
      quotations: {
        count: quotations.count,
        total: quotations.totalVal
      },
      salesOrders: {
        count: salesOrders.count,
        total: salesOrders.totalVal
      },
      invoices: {
        count: invoices.count,
        total: invoices.totalVal,
        paid: invoices.paidVal,
        unpaid: invoices.unpaidVal
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
