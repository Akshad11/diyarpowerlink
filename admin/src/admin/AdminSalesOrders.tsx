import React, { useEffect, useState } from 'react';
import { api } from './api';
import { generateCrmPdf } from './generateCrmPdf';
import {
  Plus,
  Search,
  Download,
  Check,
  X,
  ChevronRight,
  Trash2,
  Settings as SettingsIcon,
  ArrowRightLeft,
  FileSpreadsheet
} from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  gstPan?: string;
  billingAddress?: any;
  shippingAddress?: any;
}

interface OrderItem {
  itemId: string;
  name: string;
  sku: string;
  type: string;
  uom: string;
  taxRate: number;
  taxName: string;
  price: number;
  qty: number;
  discount: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

interface SalesOrder {
  _id: string;
  salesOrderNumber: string;
  quotation?: any;
  customer: Customer;
  date: string;
  items: OrderItem[];
  discountType: 'percentage' | 'flat' | 'none';
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'invoiced' | 'cancelled';
  notes: string;
}

export const AdminSalesOrders = () => {
  const getCurrencySymbol = (code: string) => {
    if (code === 'USD') return '$';
    if (code === 'EUR') return '€';
    if (code === 'AED') return 'AED ';
    return '₹';
  };

  const formatPrice = (amount: number, currCode?: string) => {
    const code = currCode || 'INR';
    const symbol = getCurrencySymbol(code);
    return `${symbol}${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeOrder, setActiveOrder] = useState<SalesOrder | null>(null);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [ordData, settingsData] = await Promise.all([
        api.list('crm/sales-orders'),
        api.list('settings').catch(() => ({}))
      ]);
      setOrders(ordData);
      setSettings(settingsData);
    } catch (err: any) {
      setError('Failed to fetch sales orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sales order?')) return;
    try {
      await api.remove('crm/sales-orders', id);
      setOrders(orders.filter(o => o._id !== id));
      if (activeOrder?._id === id) setActiveOrder(null);
      setView('list');
    } catch (err: any) {
      setError('Error deleting sales order');
    }
  };

  const handleDownloadPdf = async (o: SalesOrder) => {
    const doc = await generateCrmPdf(
      'Sales Order',
      o.salesOrderNumber,
      new Date(o.date).toLocaleDateString(),
      '',
      o.customer,
      o.items,
      o,
      settings
    );
    doc.save(`SalesOrder_${o.salesOrderNumber}.pdf`);
  };

  const handleConvertToInvoice = async (o: SalesOrder) => {
    if (!window.confirm('Do you want to convert this Sales Order into a Sales Invoice?')) return;
    try {
      const invoicePayload = {
        salesOrder: o._id,
        customer: o.customer._id,
        date: new Date().toISOString().substring(0, 10),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 15 days credit by default
        items: o.items,
        discountType: o.discountType,
        discountValue: o.discountValue,
        discountAmount: o.discountAmount,
        taxableAmount: o.taxableAmount,
        taxAmount: o.taxAmount,
        totalAmount: o.totalAmount,
        notes: `Converted from Sales Order ${o.salesOrderNumber}. ${o.notes || ''}`,
        currency: (o as any).currency || 'INR',
        exchangeRate: (o as any).exchangeRate || 1
      };
      
      const created = await api.create('crm/sales-invoices', invoicePayload);
      alert(`Sales Invoice ${created.invoiceNumber} created successfully!`);
      
      // Update sales order status
      setOrders(orders.map(item => item._id === o._id ? { ...item, status: 'invoiced' } : item));
      if (activeOrder?._id === o._id) {
        setActiveOrder({ ...o, status: 'invoiced' });
      }
      setView('list');
    } catch (err: any) {
      alert(err.message || 'Error converting to Invoice');
    }
  };

  const getStatusStyle = (st: SalesOrder['status']) => {
    switch (st) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'invoiced': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
    }
  };

  const filtered = orders.filter(o => {
    if (!o) return false;
    return (
      (o.salesOrderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Orders</h1>
          <p className="text-sm text-slate-500">Track purchase orders received, confirm orders, and dispatch invoices.</p>
        </div>
        {view === 'detail' && (
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-600"
          >
            Back to List
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search order number or customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3.5 px-6">Sales Order No</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Quotation Ref</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading orders...' : 'No sales orders found'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(o => (
                    <tr key={o._id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => { setActiveOrder(o); setView('detail'); }}>
                      <td className="py-4 px-6 font-mono font-bold text-blue-600 hover:underline">
                        {o.salesOrderNumber}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {o.customer?.name || 'Deleted Customer'}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">
                        {o.quotation?.quotationNumber || '-'}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(o.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatPrice(o.totalAmount, (o as any).currency)}
                      </td>
                      <td className="py-4 px-6" onClick={e => e.stopPropagation()}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getStatusStyle(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-2 font-semibold" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDownloadPdf(o)}
                          title="Download PDF"
                          className="text-slate-500 hover:text-blue-600 p-1"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => { setActiveOrder(o); setView('detail'); }}
                          title="View Details"
                          className="text-slate-500 hover:text-blue-600 p-1"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL VIEW */}
      {view === 'detail' && activeOrder && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Sales Order Status:</span>
              <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusStyle(activeOrder.status)}`}>
                {activeOrder.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDownloadPdf(activeOrder)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Download size={14} /> Download PDF
              </button>
              {activeOrder.status !== 'invoiced' && (
                <button
                  onClick={() => handleConvertToInvoice(activeOrder)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-blue-500/10"
                >
                  <ArrowRightLeft size={14} /> Convert to Invoice
                </button>
              )}
              {activeOrder.status === 'draft' && (
                <button
                  onClick={async () => {
                    if (window.confirm('Confirm this order?')) {
                      const updated = await api.update('crm/sales-orders', activeOrder._id, { status: 'confirmed' });
                      setActiveOrder(updated);
                      setOrders(orders.map(o => o._id === activeOrder._id ? updated : o));
                    }
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                >
                  Confirm Order
                </button>
              )}
              <button
                onClick={() => handleDelete(activeOrder._id)}
                className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>

          {/* HTML Invoice Template Display */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{settings?.websiteName || 'Diyar Power Link LLP'}</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">{settings?.contactAddress}</p>
                <p className="text-xs text-slate-500">Phone: {settings?.contactPhone} | Email: {settings?.contactEmail}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-semibold">Sales Order</span>
                <span className="text-xl font-mono font-bold text-slate-900 block mt-1">{activeOrder.salesOrderNumber}</span>
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  <p>Date: {new Date(activeOrder.date).toLocaleDateString()}</p>
                  {activeOrder.quotation && (
                    <p className="font-mono text-slate-600">Quotation Ref: {activeOrder.quotation.quotationNumber}</p>
                  )}
                  <p>Currency: {(activeOrder as any).currency || 'INR'} {(activeOrder as any).currency && (activeOrder as any).currency !== 'INR' && `(Rate: ${(activeOrder as any).exchangeRate})`}</p>
                </div>
              </div>
            </div>

            {/* Bill/Ship address columns */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Billing Details</span>
                <div className="text-xs text-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900">{activeOrder.customer?.name}</p>
                  {activeOrder.customer?.gstPan && (
                    <p className="font-mono text-slate-600">GST/PAN: {activeOrder.customer.gstPan}</p>
                  )}
                  {activeOrder.customer?.billingAddress ? (
                    <>
                      <p>{activeOrder.customer.billingAddress.street}</p>
                      <p>{activeOrder.customer.billingAddress.city}, {activeOrder.customer.billingAddress.state} - {activeOrder.customer.billingAddress.zip}</p>
                      <p>{activeOrder.customer.billingAddress.country}</p>
                    </>
                  ) : <p className="text-slate-400">No Address</p>}
                  {activeOrder.customer?.phone && <p>Phone: {activeOrder.customer.phone}</p>}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Shipping Details</span>
                <div className="text-xs text-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900">{activeOrder.customer?.name}</p>
                  {activeOrder.customer?.shippingAddress ? (
                    <>
                      <p>{activeOrder.customer.shippingAddress.street}</p>
                      <p>{activeOrder.customer.shippingAddress.city}, {activeOrder.customer.shippingAddress.state} - {activeOrder.customer.shippingAddress.zip}</p>
                      <p>{activeOrder.customer.shippingAddress.country}</p>
                    </>
                  ) : <p className="text-slate-400">No Address</p>}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border-t border-slate-100 pt-6">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                    <th className="pb-3 pl-1">#</th>
                    <th className="pb-3">Item Details</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3">UOM</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-center">Disc</th>
                    <th className="pb-3 text-center">GST</th>
                    <th className="pb-3 text-right pr-1">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeOrder.items.map((it, idx) => (
                    <tr key={idx} className="align-middle">
                      <td className="py-3 pl-1 text-slate-500">{idx + 1}</td>
                      <td className="py-3 font-semibold text-slate-800">{it.name}</td>
                      <td className="py-3 font-mono text-slate-600">{it.sku}</td>
                      <td className="py-3 text-center">{it.qty}</td>
                      <td className="py-3 text-slate-600">{it.uom}</td>
                      <td className="py-3 text-right">{formatPrice(it.price, (activeOrder as any).currency)}</td>
                      <td className="py-3 text-center">{it.discount}%</td>
                      <td className="py-3 text-center text-slate-500">{it.taxRate}%</td>
                      <td className="py-3 text-right pr-1 font-bold text-slate-800">
                        {formatPrice(it.total, (activeOrder as any).currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom summary and totals */}
            <div className="flex justify-between items-start gap-8 border-t border-slate-100 pt-6">
              <div className="max-w-xs space-y-2 text-xs text-slate-500">
                {activeOrder.notes && (
                  <>
                    <p className="font-bold text-slate-700">Notes / Remarks:</p>
                    <p className="whitespace-pre-line leading-relaxed">{activeOrder.notes}</p>
                  </>
                )}
              </div>

              <div className="w-64 space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Gross Subtotal:</span>
                  <span className="text-slate-800">
                    {formatPrice(activeOrder.items.reduce((acc, it) => acc + it.price * it.qty, 0), (activeOrder as any).currency)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatPrice(activeOrder.discountAmount, (activeOrder as any).currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                  <span>Taxable Amount:</span>
                  <span className="text-slate-800">{formatPrice(activeOrder.taxableAmount, (activeOrder as any).currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax Value:</span>
                  <span className="text-slate-800">{formatPrice(activeOrder.taxAmount, (activeOrder as any).currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span>{formatPrice(activeOrder.totalAmount, (activeOrder as any).currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
