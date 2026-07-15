import React, { useEffect, useState } from 'react';
import { api } from './api';
import { generateProcurementPdf } from './generateProcurementPdf';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ShoppingBag,
  Download,
  Mail,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  ClipboardList,
  CheckCircle,
  FileCheck
} from 'lucide-react';

interface Supplier {
  _id: string;
  name: string;
  contactName?: string;
  email: string;
  phone: string;
  gst?: string;
  pan?: string;
  crNumber?: string;
  address?: any;
}

interface QuotationItem {
  itemId: string;
  name: string;
  sku: string;
  qty: number;
  uom: string;
  price: number;
  taxRate: number;
  taxName: string;
  taxAmount: number;
  total: number;
}

interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierQuotation?: { _id: string; quotationNumber: string };
  supplier: Supplier;
  date: string;
  deliveryDate?: string;
  items: QuotationItem[];
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  notes?: string;
}

export const AdminPurchaseOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliersMaster, setSuppliersMaster] = useState<Supplier[]>([]);
  const [itemsMaster, setItemsMaster] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // View state: 'list' | 'form' | 'detail'
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [activeOrder, setActiveOrder] = useState<PurchaseOrder | null>(null);

  // Form states
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [status, setStatus] = useState<PurchaseOrder['status']>('draft');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState<number>(1);

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

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    if (code === 'USD') setExchangeRate(83.5);
    else if (code === 'EUR') setExchangeRate(90);
    else if (code === 'AED') setExchangeRate(22.7);
    else setExchangeRate(1);
  };

  // Add Item states
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | ''>('');
  const [addQty, setAddQty] = useState(1);
  const [addPrice, setAddPrice] = useState(0);
  const [addTaxRate, setAddTaxRate] = useState(18);

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poData, supData, itemsData, settingsData] = await Promise.all([
        api.list('procurement/purchase-orders'),
        api.list('procurement/suppliers'),
        api.list('crm/items'),
        api.list('settings')
      ]);
      setOrders(poData);
      setSuppliersMaster(supData.filter((s: any) => s.status === 'active'));
      setItemsMaster(itemsData);
      setSettings(settingsData);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const recalculateLines = (lines: QuotationItem[]) => {
    return lines.map(line => {
      const sub = line.price * line.qty;
      const taxVal = sub * (line.taxRate / 100);
      return {
        ...line,
        taxName: line.taxName || 'GST',
        taxAmount: taxVal,
        total: sub + taxVal
      };
    });
  };

  const handleUpdateItemQty = (idx: number, qty: number) => {
    const copy = [...items];
    copy[idx].qty = qty;
    setItems(recalculateLines(copy));
  };

  const handleUpdateItemPrice = (idx: number, price: number) => {
    const copy = [...items];
    copy[idx].price = price;
    setItems(recalculateLines(copy));
  };

  const handleUpdateItemTaxRate = (idx: number, rate: number) => {
    const copy = [...items];
    copy[idx].taxRate = rate;
    setItems(recalculateLines(copy));
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleAddItem = () => {
    if (selectedItemIndex === '') return;
    const master = itemsMaster[selectedItemIndex];
    const newLines = [
      ...items,
      {
        itemId: master._id,
        name: master.name,
        sku: master.sku,
        qty: addQty,
        uom: master.uom?.code || 'PCS',
        price: addPrice || master.price || 0,
        taxRate: addTaxRate,
        taxName: master.tax?.name || 'GST',
        taxAmount: 0,
        total: 0
      }
    ];
    setItems(recalculateLines(newLines));
    setSelectedItemIndex('');
    setAddQty(1);
    setAddPrice(0);
  };

  const handleNew = () => {
    setActiveOrder(null);
    setSupplierId('');
    setDate(new Date().toISOString().substring(0, 10));
    setDeliveryDate('');
    setItems([]);
    setStatus('draft');
    setNotes('');
    setCurrency('INR');
    setExchangeRate(1);
    setView('form');
  };

  const handleEdit = (po: PurchaseOrder) => {
    setActiveOrder(po);
    setSupplierId(po.supplier._id);
    setDate(new Date(po.date).toISOString().substring(0, 10));
    setDeliveryDate(po.deliveryDate ? new Date(po.deliveryDate).toISOString().substring(0, 10) : '');
    setItems(po.items || []);
    setStatus(po.status || 'draft');
    setNotes(po.notes || '');
    setCurrency((po as any).currency || 'INR');
    setExchangeRate((po as any).exchangeRate || 1);
    setView('form');
  };

  const handleViewDetail = (po: PurchaseOrder) => {
    setActiveOrder(po);
    setView('detail');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this PO?')) return;
    try {
      await api.remove('procurement/purchase-orders', id);
      setOrders(orders.filter(o => o._id !== id));
      if (activeOrder?._id === id) setActiveOrder(null);
      setView('list');
    } catch (err) {
      setError('Failed to delete Purchase Order');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (items.length === 0) {
      alert('PO items list cannot be empty.');
      return;
    }

    const subtotal = items.reduce((acc, it) => acc + (it.price * it.qty), 0);
    const tax = items.reduce((acc, it) => acc + it.taxAmount, 0);

    const payload = {
      supplier: supplierId,
      date: new Date(date).toISOString(),
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      items,
      taxableAmount: subtotal,
      taxAmount: tax,
      totalAmount: subtotal + tax,
      status,
      notes: notes.trim(),
      currency,
      exchangeRate: Number(exchangeRate) || 1
    };

    try {
      if (activeOrder) {
        const updated = await api.update('procurement/purchase-orders', activeOrder._id, payload);
        setOrders(orders.map(o => o._id === activeOrder._id ? updated : o));
        setActiveOrder(updated);
      } else {
        const created = await api.create('procurement/purchase-orders', payload);
        setOrders([created, ...orders]);
        setActiveOrder(created);
      }
      setView('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to save PO');
    }
  };

  const handleDownloadPoPdf = (po: PurchaseOrder) => {
    const doc = generateProcurementPdf(
      'Purchase Order',
      po.poNumber,
      new Date(po.date).toLocaleDateString(),
      po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : '',
      po.supplier,
      po.items,
      { taxableAmount: po.taxableAmount, taxAmount: po.taxAmount, totalAmount: po.totalAmount, notes: po.notes, currency: (po as any).currency || 'INR' },
      settings
    );
    doc.save(`PO_${po.poNumber}.pdf`);
  };

  const openEmailModal = (po: PurchaseOrder) => {
    setEmailTo(po.supplier.email || '');
    setEmailSubject(`Purchase Order ${po.poNumber} from ${settings?.websiteName || 'Diyar Power Link'}`);
    setEmailBody(`
      <p>Dear ${po.supplier.contactName || po.supplier.name},</p>
      <p>Please find attached our Purchase Order <strong>${po.poNumber}</strong> for the requested items.</p>
      <p>Kindly acknowledge receipt and confirm the delivery timeline.</p>
      <br/>
      <p>Best Regards,</p>
      <p>Purchasing Department</p>
      <p><strong>${settings?.websiteName || 'Diyar Power Link LLP'}</strong></p>
    `);
    setEmailSuccess('');
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!activeOrder) return;
    setSendingEmail(true);
    setEmailSuccess('');
    try {
      // 1. Generate PO PDF
      const doc = generateProcurementPdf(
        'Purchase Order',
        activeOrder.poNumber,
        new Date(activeOrder.date).toLocaleDateString(),
        activeOrder.deliveryDate ? new Date(activeOrder.deliveryDate).toLocaleDateString() : '',
        activeOrder.supplier,
        activeOrder.items,
        { taxableAmount: activeOrder.taxableAmount, taxAmount: activeOrder.taxAmount, totalAmount: activeOrder.totalAmount, notes: activeOrder.notes, currency: (activeOrder as any).currency || 'INR' },
        settings
      );
      
      // 2. Output as base64
      const base64 = doc.output('datauristring').split(',')[1];

      // 3. Dispatch email
      const result = await api.sendCrmEmail({
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
        pdfBase64: base64,
        filename: `PO_${activeOrder.poNumber}.pdf`
      });

      if (result.success) {
        setEmailSuccess('Purchase Order sent successfully!');
        if (activeOrder.status === 'draft') {
          const updated = await api.update('procurement/purchase-orders', activeOrder._id, { status: 'ordered' });
          setOrders(orders.map(o => o._id === activeOrder._id ? updated : o));
          setActiveOrder(updated);
        }
      } else {
        setError('Failed to dispatch email');
      }
    } catch (err: any) {
      setError(err?.message || 'Error generating/sending PO email');
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusStyle = (st: PurchaseOrder['status']) => {
    switch (st) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'ordered': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'received': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
    }
  };

  const filtered = orders.filter(o => {
    if (!o) return false;
    return (
      (o.poNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.supplier?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders (PO)</h1>
          <p className="text-sm text-slate-500">Approve final order books, download structured PO templates, and dispatch order emails to vendors.</p>
        </div>
        {view === 'list' && (
          <button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-indigo-500/10"
          >
            <Plus size={16} /> Create PO
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search POs by vendor or ref..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">PO Number</th>
                  <th className="py-3.5 px-6">Supplier</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Delivery Date</th>
                  <th className="py-3.5 px-6">Total Value</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading POs...' : 'No Purchase Orders registered yet.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(o => (
                    <tr key={o._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-slate-400" />
                        <button
                          onClick={() => handleViewDetail(o)}
                          className="hover:underline text-indigo-600 font-bold"
                        >
                          {o.poNumber}
                        </button>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {o.supplier.name}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {new Date(o.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-900">
                        {formatPrice(o.totalAmount, (o as any).currency)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-3">
                        <button
                          onClick={() => handleViewDetail(o)}
                          className="text-slate-600 hover:text-indigo-600 font-semibold text-xs"
                        >
                          View
                        </button>
                        {o.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleEdit(o)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(o._id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form View */}
      {view === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {activeOrder ? `Edit Purchase Order: ${activeOrder.poNumber}` : 'Draft Purchase Order (PO)'}
            </h2>
            <button type="button" onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier *</label>
              <select
                required
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliersMaster.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Order Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Delivery Deadline Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Currency *</label>
              <select
                value={currency}
                onChange={e => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Exchange Rate</label>
              <input
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={e => setExchangeRate(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                disabled={currency === 'INR'}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">PO Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as PurchaseOrder['status'])}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="ordered">Ordered</option>
                <option value="received">Items Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Line items list builder */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Line Items & Purchase Pricing</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <th className="pb-2 pl-1">Item Details</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Price ({currency})</th>
                    <th className="pb-2">GST %</th>
                    <th className="pb-2 text-right pr-2">Total Amount</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((it, idx) => (
                    <tr key={idx} className="align-middle">
                      <td className="py-3 pl-1">
                        <div className="font-semibold text-slate-800">{it.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{it.sku} ({it.uom})</div>
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="1"
                          value={it.qty}
                          onChange={e => handleUpdateItemQty(idx, Number(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.price}
                          onChange={e => handleUpdateItemPrice(idx, Number(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-sm"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={it.taxRate}
                          onChange={e => handleUpdateItemTaxRate(idx, Number(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center"
                        />
                      </td>
                      <td className="py-3 text-right pr-2 font-bold text-slate-900">
                        {formatPrice(it.total, currency)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Add Row */}
                  <tr className="bg-slate-50/50">
                    <td className="py-3 pl-1">
                      <select
                        value={selectedItemIndex}
                        onChange={e => setSelectedItemIndex(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full max-w-xs px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                      >
                        <option value="">-- Choose Item from Master --</option>
                        {itemsMaster.map((item, idx) => (
                          <option key={item._id} value={idx}>
                            {item.name} [{item.sku}]
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        min="1"
                        value={addQty}
                        onChange={e => setAddQty(Number(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs text-center"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={addPrice}
                        onChange={e => setAddPrice(Number(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={addTaxRate}
                        onChange={e => setAddTaxRate(Number(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs text-center"
                      />
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={selectedItemIndex === ''}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-3 py-1 rounded-lg text-xs font-semibold"
                      >
                        Add
                      </button>
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">PO Remarks & Delivery terms</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                placeholder="Terms regarding transport, packing, payment or delivery location..."
              />
            </div>

            {/* Calculations summary panel */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 space-y-3 flex flex-col justify-center">
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Gross Value (Taxable):</span>
                <span className="font-semibold">{formatPrice(items.reduce((acc, it) => acc + (it.price * it.qty), 0), currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-sm">
                <span>GST Tax Value:</span>
                <span className="font-semibold">{formatPrice(items.reduce((acc, it) => acc + it.taxAmount, 0), currency)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between text-slate-900 text-lg font-bold">
                <span>Grand Total Value:</span>
                <span className="text-emerald-600">{formatPrice(items.reduce((acc, it) => acc + it.total, 0), currency)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setView('list')}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-500/10"
            >
              Save Order
            </button>
          </div>
        </form>
      )}

      {/* Detail View */}
      {view === 'detail' && activeOrder && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Purchase Order Details</h2>
              <p className="text-xs text-slate-500 mt-1">PO Number: <span className="font-bold text-slate-700">{activeOrder.poNumber}</span></p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Back to List
              </button>
              <button
                onClick={() => handleDownloadPoPdf(activeOrder)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
              >
                <Download size={15} /> Download PDF
              </button>
              <button
                onClick={() => openEmailModal(activeOrder)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Mail size={15} /> Send Email
              </button>
              {activeOrder.status === 'ordered' && (
                <button
                  onClick={() => navigate('/inventory')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
                >
                  Receive Items (GRN)
                </button>
              )}
              {activeOrder.status === 'draft' && (
                <button
                  onClick={() => handleEdit(activeOrder)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
                >
                  Edit PO
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-sm">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Supplier</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{activeOrder.supplier.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Order Date</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{new Date(activeOrder.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Delivery Target</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{activeOrder.deliveryDate ? new Date(activeOrder.deliveryDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Currency</p>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {(activeOrder as any).currency || 'INR'} {(activeOrder as any).currency && (activeOrder as any).currency !== 'INR' && `(Rate: ${(activeOrder as any).exchangeRate})`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${getStatusStyle(activeOrder.status)}`}>
                {activeOrder.status}
              </span>
            </div>
          </div>

          {/* Items Display */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Order Items</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Item Details</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Rate</th>
                    <th className="py-2.5 px-4 text-center">GST %</th>
                    <th className="py-2.5 px-4 text-right">Tax (GST)</th>
                    <th className="py-2.5 px-4 text-right pr-4">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {activeOrder.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{it.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">{it.sku} ({it.uom})</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{it.qty}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">{formatPrice(it.price, (activeOrder as any).currency)}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{it.taxRate}%</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatPrice(it.taxAmount, (activeOrder as any).currency)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-950 pr-4">{formatPrice(it.total, (activeOrder as any).currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-end pt-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 w-80 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Taxable Value:</span>
                <span>{formatPrice(activeOrder.taxableAmount, (activeOrder as any).currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total GST Tax:</span>
                <span>{formatPrice(activeOrder.taxAmount, (activeOrder as any).currency)}</span>
              </div>
              <div className="h-px bg-slate-200 my-1"></div>
              <div className="flex justify-between font-bold text-slate-900 text-base">
                <span>Grand Total:</span>
                <span className="text-emerald-600">{formatPrice(activeOrder.totalAmount, (activeOrder as any).currency)}</span>
              </div>
            </div>
          </div>

          {activeOrder.notes && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">PO Instructions / Notes</h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-150">{activeOrder.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-600 text-white">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <Mail size={18} /> Dispatch PO Email
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 max-h-[400px]">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">To (Supplier Email)</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email Body (HTML format)</label>
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-emerald-600">Attachment:</span>
                <span>PO_{activeOrder?.poNumber}.pdf</span>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">PDF</span>
              </div>

              {emailSuccess && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-lg text-emerald-700 text-xs font-semibold">
                  {emailSuccess}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
              >
                {sendingEmail ? 'Sending...' : 'Send PO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
