import { StockLedger } from '../models/StockLedger.js';
import { Item } from '../models/Item.js';

export async function syncSalesInvoiceStock(invoice) {
  try {
    // Delete any existing ledger entries for this invoice to prevent duplicates
    await StockLedger.deleteMany({ referenceId: invoice._id, transactionType: 'SalesInvoice' });

    // If status is draft or cancelled, no stock is deducted
    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
      return;
    }

    const ledgerEntries = [];
    for (const item of invoice.items) {
      const dbItem = await Item.findById(item.itemId);
      // Only deduct stock for product type items
      if (dbItem && dbItem.type === 'product') {
        ledgerEntries.push({
          item: item.itemId,
          transactionType: 'SalesInvoice',
          referenceId: invoice._id,
          referenceNumber: invoice.invoiceNumber,
          quantity: -item.qty, // negative quantity representing stock reduction
          date: invoice.date || new Date(),
          remarks: `Sales Invoice: ${invoice.invoiceNumber}`
        });
      }
    }

    if (ledgerEntries.length > 0) {
      await StockLedger.insertMany(ledgerEntries);
    }
  } catch (err) {
    console.error('Error syncing sales invoice stock:', err);
    throw err;
  }
}

export async function syncGrnStock(grn) {
  try {
    // Delete any existing entries for this GRN
    await StockLedger.deleteMany({ referenceId: grn._id, transactionType: 'GRN' });

    // Only receive stock if GRN is marked as received
    if (grn.status !== 'received') {
      return;
    }

    const ledgerEntries = [];
    for (const item of grn.items) {
      const dbItem = await Item.findById(item.itemId);
      if (dbItem && dbItem.type === 'product') {
        ledgerEntries.push({
          item: item.itemId,
          transactionType: 'GRN',
          referenceId: grn._id,
          referenceNumber: grn.grnNumber,
          quantity: item.qtyReceived, // positive quantity representing stock addition
          date: grn.receivedDate || new Date(),
          remarks: `Goods Receipt Note: ${grn.grnNumber}`
        });
      }
    }

    if (ledgerEntries.length > 0) {
      await StockLedger.insertMany(ledgerEntries);
    }
  } catch (err) {
    console.error('Error syncing GRN stock:', err);
    throw err;
  }
}

export async function syncAdjustmentStock(adj) {
  try {
    // Delete existing ledger entries for this adjustment
    await StockLedger.deleteMany({ referenceId: adj._id, transactionType: 'Adjustment' });

    // Only post stock movements if status is 'adjusted'
    if (adj.status !== 'adjusted') {
      return;
    }

    const ledgerEntries = [];
    for (const item of adj.items) {
      const dbItem = await Item.findById(item.itemId);
      if (dbItem && dbItem.type === 'product') {
        ledgerEntries.push({
          item: item.itemId,
          transactionType: 'Adjustment',
          referenceId: adj._id,
          referenceNumber: adj.adjustmentNumber,
          quantity: item.qty, // positive or negative qty adjustment
          date: adj.adjustmentDate || new Date(),
          remarks: `Stock Adjustment (${adj.reason}): ${adj.adjustmentNumber}`
        });
      }
    }

    if (ledgerEntries.length > 0) {
      await StockLedger.insertMany(ledgerEntries);
    }
  } catch (err) {
    console.error('Error syncing stock adjustment:', err);
    throw err;
  }
}

export async function getStockReport() {
  const items = await Item.find({ type: 'product' }).populate('uom').populate('tax').sort({ name: 1 });
  const report = [];

  for (const item of items) {
    const transactions = await StockLedger.find({ item: item._id }).sort({ date: 1 });
    const currentStock = transactions.reduce((sum, t) => sum + t.quantity, 0);

    const movements = transactions.map((t) => ({
      transactionType: t.transactionType,
      referenceNumber: t.referenceNumber,
      quantity: t.quantity,
      date: t.date,
      remarks: t.remarks
    }));

    report.push({
      _id: item._id,
      name: item.name,
      sku: item.sku,
      uom: item.uom ? item.uom.name : 'Units',
      price: item.price,
      currentStock,
      movements,
      isLowStock: currentStock < 10 // low stock threshold is 10 units
    });
  }

  return report;
}
