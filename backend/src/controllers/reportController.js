import { SalesInvoice } from '../models/SalesInvoice.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { Rfq } from '../models/Rfq.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import { Item } from '../models/Item.js';
import { StockLedger } from '../models/StockLedger.js';
import { getStockReport } from '../services/inventoryService.js';

export const getReportsSummary = async (_req, res) => {
  try {
    // 1. SALES REPORTS
    const activeInvoices = await SalesInvoice.find({ status: { $ne: 'cancelled' } }).populate('customer');
    
    // Monthly Sales
    const monthlySales = {};
    activeInvoices.forEach((inv) => {
      const month = new Date(inv.date).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlySales[month]) {
        monthlySales[month] = { month, sales: 0, count: 0 };
      }
      monthlySales[month].sales += inv.totalAmount * (inv.exchangeRate || 1);
      monthlySales[month].count += 1;
    });
    const monthlySalesList = Object.values(monthlySales).sort((a, b) => b.month.localeCompare(a.month));

    // Customer Wise Sales
    const customerSales = {};
    activeInvoices.forEach((inv) => {
      const custId = inv.customer?._id?.toString() || 'unknown';
      const custName = inv.customer?.name || 'Unknown Customer';
      if (!customerSales[custId]) {
        customerSales[custId] = { customerId: custId, name: custName, sales: 0, count: 0 };
      }
      customerSales[custId].sales += inv.totalAmount * (inv.exchangeRate || 1);
      customerSales[custId].count += 1;
    });
    const customerSalesList = Object.values(customerSales).sort((a, b) => b.sales - a.sales);

    // Service Wise Revenue
    const serviceRevenue = {};
    activeInvoices.forEach((inv) => {
      if (inv.status === 'draft') return; // only posted invoices
      inv.items.forEach((item) => {
        if (item.type === 'service') {
          const itemId = item.itemId?.toString() || 'unknown';
          if (!serviceRevenue[itemId]) {
            serviceRevenue[itemId] = { itemId, name: item.name, sku: item.sku, revenue: 0, qty: 0 };
          }
          serviceRevenue[itemId].revenue += item.total * (inv.exchangeRate || 1);
          serviceRevenue[itemId].qty += item.qty;
        }
      });
    });
    const serviceRevenueList = Object.values(serviceRevenue).sort((a, b) => b.revenue - a.revenue);

    // 2. PROCUREMENT REPORTS
    const allPurchaseOrders = await PurchaseOrder.find().populate('supplier');
    
    // Supplier Wise Purchase
    const supplierPurchases = {};
    allPurchaseOrders.forEach((po) => {
      if (po.status === 'cancelled') return;
      const suppId = po.supplier?._id?.toString() || 'unknown';
      const suppName = po.supplier?.name || 'Unknown Supplier';
      if (!supplierPurchases[suppId]) {
        supplierPurchases[suppId] = { supplierId: suppId, name: suppName, purchase: 0, count: 0 };
      }
      supplierPurchases[suppId].purchase += po.totalAmount * (po.exchangeRate || 1);
      supplierPurchases[suppId].count += 1;
    });
    const supplierPurchasesList = Object.values(supplierPurchases).sort((a, b) => b.purchase - a.purchase);

    // Pending RFQs
    const pendingRfqs = await Rfq.find({ status: { $in: ['draft', 'sent'] } }).sort({ date: -1 });

    // Pending POs
    const pendingPosRaw = await PurchaseOrder.find({ status: { $in: ['draft', 'ordered'] } }).populate('supplier').sort({ date: -1 });
    const pendingPos = pendingPosRaw.map(po => {
      const obj = po.toObject();
      obj.totalAmount = po.totalAmount * (po.exchangeRate || 1);
      return obj;
    });

    // 3. INVENTORY REPORTS
    const inventoryReport = await getStockReport();
    const lowStockList = inventoryReport.filter((item) => item.isLowStock);
    const stockMovements = await StockLedger.find().populate('item').sort({ date: -1 }).limit(100);

    // 4. FINANCE REPORTS
    // Sales Register
    const salesRegister = activeInvoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      customer: inv.customer?.name || 'Unknown',
      taxableAmount: inv.taxableAmount * (inv.exchangeRate || 1),
      taxAmount: inv.taxAmount * (inv.exchangeRate || 1),
      totalAmount: inv.totalAmount * (inv.exchangeRate || 1),
      status: inv.status
    }));

    // Purchase Register
    const purchaseRegister = allPurchaseOrders.filter((po) => po.status !== 'cancelled').map((po) => ({
      poNumber: po.poNumber,
      date: po.date,
      supplier: po.supplier?.name || 'Unknown',
      taxableAmount: po.taxableAmount * (po.exchangeRate || 1),
      taxAmount: po.taxAmount * (po.exchangeRate || 1),
      totalAmount: po.totalAmount * (po.exchangeRate || 1),
      status: po.status
    }));

    // GST Report (Sales GST collected vs Purchase GST paid)
    const totalSalesTax = activeInvoices.reduce((sum, inv) => sum + (inv.status !== 'draft' ? inv.taxAmount * (inv.exchangeRate || 1) : 0), 0);
    const totalPurchaseTax = allPurchaseOrders.reduce((sum, po) => sum + (po.status !== 'cancelled' ? po.taxAmount * (po.exchangeRate || 1) : 0), 0);

    // Outstanding Receivables
    const outstandingReceivables = {};
    activeInvoices.forEach((inv) => {
      if (inv.status === 'unpaid') {
        const custId = inv.customer?._id?.toString() || 'unknown';
        const custName = inv.customer?.name || 'Unknown Customer';
        if (!outstandingReceivables[custId]) {
          outstandingReceivables[custId] = { customerId: custId, name: custName, outstanding: 0, invoices: [] };
        }
        outstandingReceivables[custId].outstanding += inv.totalAmount * (inv.exchangeRate || 1);
        outstandingReceivables[custId].invoices.push({
          invoiceNumber: inv.invoiceNumber,
          amount: inv.totalAmount * (inv.exchangeRate || 1),
          date: inv.date
        });
      }
    });
    const outstandingReceivablesList = Object.values(outstandingReceivables).sort((a, b) => b.outstanding - a.outstanding);

    // Outstanding Payables
    const outstandingPayables = {};
    allPurchaseOrders.forEach((po) => {
      if (po.status === 'ordered' || po.status === 'received') {
        const suppId = po.supplier?._id?.toString() || 'unknown';
        const suppName = po.supplier?.name || 'Unknown Supplier';
        if (!outstandingPayables[suppId]) {
          outstandingPayables[suppId] = { supplierId: suppId, name: suppName, outstanding: 0, orders: [] };
        }
        outstandingPayables[suppId].outstanding += po.totalAmount * (po.exchangeRate || 1);
        outstandingPayables[suppId].orders.push({
          poNumber: po.poNumber,
          amount: po.totalAmount * (po.exchangeRate || 1),
          date: po.date
        });
      }
    });
    const outstandingPayablesList = Object.values(outstandingPayables).sort((a, b) => b.outstanding - a.outstanding);

    res.json({
      sales: {
        monthlySales: monthlySalesList,
        customerSales: customerSalesList,
        serviceRevenue: serviceRevenueList
      },
      procurement: {
        supplierPurchases: supplierPurchasesList,
        pendingRfqs,
        pendingPos
      },
      inventory: {
        currentStock: inventoryReport,
        lowStock: lowStockList,
        movements: stockMovements
      },
      finance: {
        salesRegister,
        purchaseRegister,
        gstReport: {
          salesGst: totalSalesTax,
          purchaseGst: totalPurchaseTax,
          netGstPayable: totalSalesTax - totalPurchaseTax
        },
        outstandingReceivables: outstandingReceivablesList,
        outstandingPayables: outstandingPayablesList
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
