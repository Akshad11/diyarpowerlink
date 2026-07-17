import React, { useEffect, useState } from 'react';
import { api } from './api';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  ArrowRight,
  ClipboardList,
  ArrowRightLeft,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Supplier {
  _id: string;
  name: string;
  email?: string;
}

interface Rfq {
  _id: string;
  rfqNumber: string;
  items: any[];
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
  discount: number; // percentage
  taxAmount: number;
  subtotal: number;
  total: number;
}

interface SupplierQuotation {
  _id: string;
  quotationNumber: string; // Supplier's reference
  rfq?: Rfq;
  supplier: Supplier;
  date: string;
  validUntil?: string;
  items: QuotationItem[];
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'received' | 'accepted' | 'rejected' | 'converted';
  remarks?: string;
}

export const AdminSupplierQuotations = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<SupplierQuotation[]>([]);
  const [suppliersMaster, setSuppliersMaster] = useState<Supplier[]>([]);
  const [rfqsMaster, setRfqsMaster] = useState<Rfq[]>([]);
  const [itemsMaster, setItemsMaster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // View state: 'list' | 'form' | 'detail'
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [activeQuotation, setActiveQuotation] = useState<SupplierQuotation | null>(null);

  // Form states
  const [quotationNumber, setQuotationNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedRfqId, setSelectedRfqId] = useState('');
  const [date, setDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [status, setStatus] = useState<SupplierQuotation['status']>('received');
  const [remarks, setRemarks] = useState('');
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
  const [addTaxRate, setAddTaxRate] = useState(18); // Default 18% GST
  const [addDiscount, setAddDiscount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quotes, suppliers, rfqs, rawItems] = await Promise.all([
        api.list('procurement/supplier-quotations'),
        api.list('procurement/suppliers'),
        api.list('procurement/rfqs'),
        api.list('crm/items')
      ]);
      setQuotations(quotes);
      setSuppliersMaster(suppliers.filter((s: any) => s.status === 'active'));
      setRfqsMaster(rfqs);
      setItemsMaster(rawItems);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRfqChange = (rfqId: string) => {
    setSelectedRfqId(rfqId);
    if (!rfqId) return;

    const rfq = rfqsMaster.find(r => r._id === rfqId);
    if (rfq && rfq.items) {
      // Prefill quotation lines from RFQ items
      const prefilledItems = rfq.items.map((it: any) => {
        // Find default item values from master
        const masterItem = itemsMaster.find(m => m._id === it.itemId);
        const rate = masterItem?.tax?.rate || 18;
        const name = masterItem?.tax?.name || 'GST';

        return {
          itemId: it.itemId,
          name: it.name,
          sku: it.sku,
          qty: it.qty,
          uom: it.uom || 'PCS',
          price: masterItem?.price || 0,
          taxRate: rate,
          taxName: name,
          discount: 0,
          taxAmount: 0,
          subtotal: 0,
          total: 0
        };
      });
      setItems(recalculateLines(prefilledItems));
    }
  };

  const recalculateLines = (lines: QuotationItem[]) => {
    return lines.map(line => {
      const gross = line.price * line.qty;
      const discAmt = gross * (line.discount / 100);
      const sub = gross - discAmt;
      const taxVal = sub * (line.taxRate / 100);
      return {
        ...line,
        taxAmount: taxVal,
        subtotal: sub,
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

  const handleUpdateItemDiscount = (idx: number, disc: number) => {
    const copy = [...items];
    copy[idx].discount = disc;
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
        taxName: 'GST',
        discount: addDiscount,
        taxAmount: 0,
        subtotal: 0,
        total: 0
      }
    ];
    setItems(recalculateLines(newLines));
    setSelectedItemIndex('');
    setAddQty(1);
    setAddPrice(0);
    setAddDiscount(0);
  };

  const handleNew = () => {
    setActiveQuotation(null);
    setQuotationNumber('');
    setSelectedSupplierId('');
    setSelectedRfqId('');
    setDate(new Date().toISOString().substring(0, 10));
    setValidUntil('');
    setItems([]);
    setStatus('received');
    setRemarks('');
    setCurrency('INR');
    setExchangeRate(1);
    setView('form');
  };

  const handleEdit = (q: SupplierQuotation) => {
    setActiveQuotation(q);
    setQuotationNumber(q.quotationNumber);
    setSelectedSupplierId(q.supplier._id);
    setSelectedRfqId(q.rfq?._id || '');
    setDate(new Date(q.date).toISOString().substring(0, 10));
    setValidUntil(q.validUntil ? new Date(q.validUntil).toISOString().substring(0, 10) : '');
    setItems(q.items || []);
    setStatus(q.status || 'received');
    setRemarks(q.remarks || '');
    setCurrency((q as any).currency || 'INR');
    setExchangeRate((q as any).exchangeRate || 1);
    setView('form');
  };

  const handleViewDetail = (q: SupplierQuotation) => {
    setActiveQuotation(q);
    setView('detail');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this vendor quotation?')) return;
    try {
      await api.remove('procurement/supplier-quotations', id);
      setQuotations(quotations.filter(q => q._id !== id));
      if (activeQuotation?._id === id) setActiveQuotation(null);
      setView('list');
    } catch (err) {
      setError('Failed to delete quotation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (items.length === 0) {
      alert('Quotation items list cannot be empty.');
      return;
    }

    const calculatedSubtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
    const calculatedTax = items.reduce((acc, it) => acc + it.taxAmount, 0);
    const calculatedTotal = calculatedSubtotal + calculatedTax;

    const payload = {
      quotationNumber: quotationNumber.trim(),
      supplier: selectedSupplierId,
      rfq: selectedRfqId || undefined,
      date: new Date(date).toISOString(),
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      items,
      subtotalAmount: calculatedSubtotal,
      discountAmount: items.reduce((acc, it) => acc + (it.price * it.qty * (it.discount / 100)), 0),
      taxAmount: calculatedTax,
      totalAmount: calculatedTotal,
      status,
      remarks: remarks.trim(),
      currency,
      exchangeRate: Number(exchangeRate) || 1
    };

    try {
      if (activeQuotation) {
        const updated = await api.update('procurement/supplier-quotations', activeQuotation._id, payload);
        setQuotations(quotations.map(q => q._id === activeQuotation._id ? updated : q));
        setActiveQuotation(updated);
      } else {
        const created = await api.create('procurement/supplier-quotations', payload);
        setQuotations([created, ...quotations]);
        setActiveQuotation(created);
      }
      setView('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to save quotation');
    }
  };

  const handleConvertToPurchaseOrder = async (q: SupplierQuotation) => {
    if (!window.confirm('Do you want to convert this vendor Quote into a Purchase Order?')) return;
    try {
      const poPayload = {
        supplierQuotation: q._id,
        supplier: q.supplier._id,
        date: new Date().toISOString(),
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // default 7 days delivery
        items: q.items.map(it => ({
          itemId: it.itemId,
          name: it.name,
          sku: it.sku,
          qty: it.qty,
          uom: it.uom,
          price: it.price,
          taxRate: it.taxRate,
          taxName: it.taxName || 'GST',
          taxAmount: it.taxAmount,
          total: it.total
        })),
        taxableAmount: q.subtotalAmount,
        taxAmount: q.taxAmount,
        totalAmount: q.totalAmount,
        notes: `Converted from Supplier Quotation Reference: ${q.quotationNumber}. ${q.remarks || ''}`,
        status: 'draft',
        currency: (q as any).currency || 'INR',
        exchangeRate: (q as any).exchangeRate || 1
      };

      const created = await api.create('procurement/purchase-orders', poPayload);
      alert(`Purchase Order ${created.poNumber} created successfully!`);
      
      // Update quote status in localized state
      setQuotations(quotations.map(item => item._id === q._id ? { ...item, status: 'converted' } : item));
      if (activeQuotation?._id === q._id) {
        setActiveQuotation({ ...q, status: 'converted' });
      }
      setView('list');
    } catch (err: any) {
      alert(err.message || 'Error converting to Purchase Order');
    }
  };

  const getStatusStyle = (st: SupplierQuotation['status']) => {
    switch (st) {
      case 'received': return 'bg-slate-100 text-slate-700';
      case 'accepted': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'rejected': return 'bg-red-50 text-red-700 border border-red-200';
      case 'converted': return 'bg-purple-50 text-purple-700 border border-purple-200';
    }
  };

  const filtered = quotations.filter(q =>
    q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
    q.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Quotations</h1>
          <p className="text-sm text-slate-500">Record incoming vendor bids, compile product prices, and convert accepted bids into Purchase Orders.</p>
        </div>
        {view === 'list' && (
          <button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-indigo-500/10"
          >
            <Plus size={16} /> Enter Quotation
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
                placeholder="Search quotes by supplier or ref..."
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
                  <th className="py-3.5 px-6">Vendor Ref</th>
                  <th className="py-3.5 px-6">Supplier</th>
                  <th className="py-3.5 px-6">RFQ Ref</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading quotations...' : 'No supplier quotations registered yet.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(q => (
                    <tr key={q._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        <button
                          onClick={() => handleViewDetail(q)}
                          className="hover:underline text-indigo-600 font-bold"
                        >
                          {q.quotationNumber}
                        </button>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {q.supplier.name}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {q.rfq?.rfqNumber || 'Direct Quote'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatPrice(q.totalAmount, (q as any).currency)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(q.status)}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-3">
                        <button
                          onClick={() => handleViewDetail(q)}
                          className="text-slate-600 hover:text-indigo-600 font-semibold text-xs"
                        >
                          View
                        </button>
                        {q.status !== 'converted' && (
                          <>
                            <button
                              onClick={() => handleEdit(q)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(q._id)}
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
              {activeQuotation ? `Edit Quotation: ${activeQuotation.quotationNumber}` : 'Register Vendor Quotation'}
            </h2>
            <button type="button" onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier Quote Ref *</label>
              <input
                type="text"
                required
                value={quotationNumber}
                onChange={e => setQuotationNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier *</label>
              <select
                required
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-500 mb-1">RFQ Association (Optional)</label>
              <select
                value={selectedRfqId}
                onChange={e => handleRfqChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- None --</option>
                {rfqsMaster.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.rfqNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Quote Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
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
          </div>

          {/* Line items table */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Line Items & Vendor Bids</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <th className="pb-2 pl-1">Item Details</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Price ({currency})</th>
                    <th className="pb-2">GST %</th>
                    <th className="pb-2">Disc %</th>
                    <th className="pb-2 text-right pr-2">Total Amount</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((it, idx) => {
                    return (
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
                        <td className="py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={it.discount}
                            onChange={e => handleUpdateItemDiscount(idx, Number(e.target.value) || 0)}
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
                    );
                  })}

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
                    <td className="py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Discount %"
                        value={addDiscount}
                        onChange={e => setAddDiscount(Number(e.target.value) || 0)}
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

          {/* Quotation Status and Grand Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Validity (Valid Until)</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Quotation Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as SupplierQuotation['status'])}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="received">Received</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks / Note</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Calculations Panel */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 space-y-3 flex flex-col justify-center">
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Subtotal (Before GST):</span>
                <span className="font-semibold">{formatPrice(items.reduce((acc, it) => acc + it.subtotal, 0), currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Total Tax Amount (GST):</span>
                <span className="font-semibold">{formatPrice(items.reduce((acc, it) => acc + it.taxAmount, 0), currency)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between text-slate-900 text-lg font-bold">
                <span>Grand Total Amount:</span>
                <span className="text-indigo-700">{formatPrice(items.reduce((acc, it) => acc + it.total, 0), currency)}</span>
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
              Save Quotation
            </button>
          </div>
        </form>
      )}

      {/* Detail View */}
      {view === 'detail' && activeQuotation && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Vendor Quotation Details</h2>
              <p className="text-xs text-slate-500 mt-1">Vendor Ref: <span className="font-bold text-slate-700">{activeQuotation.quotationNumber}</span></p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Back to List
              </button>
              {activeQuotation.status !== 'converted' && (
                <>
                  <button
                    onClick={() => handleEdit(activeQuotation)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    Edit Quote
                  </button>
                  <button
                    onClick={() => handleConvertToPurchaseOrder(activeQuotation)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <ArrowRightLeft size={15} /> Convert to PO
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-sm">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Supplier</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{activeQuotation.supplier.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Quote Date</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{new Date(activeQuotation.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Valid Until</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{activeQuotation.validUntil ? new Date(activeQuotation.validUntil).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Currency</p>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {(activeQuotation as any).currency || 'INR'} {(activeQuotation as any).currency && (activeQuotation as any).currency !== 'INR' && `(Rate: ${(activeQuotation as any).exchangeRate})`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${getStatusStyle(activeQuotation.status)}`}>
                {activeQuotation.status}
              </span>
            </div>
          </div>

          {/* Items Display */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Quoted Line Items</h3>
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
                    <th className="py-2.5 px-4 text-center">Disc %</th>
                    <th className="py-2.5 px-4 text-right">Tax (GST)</th>
                    <th className="py-2.5 px-4 text-right pr-4">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {activeQuotation.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{it.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">{it.sku} ({it.uom})</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{it.qty}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">{formatPrice(it.price, (activeQuotation as any).currency)}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{it.taxRate}%</td>
                      <td className="py-3 px-4 text-center text-slate-600">{it.discount}%</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatPrice(it.taxAmount, (activeQuotation as any).currency)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-950 pr-4">{formatPrice(it.total, (activeQuotation as any).currency)}</td>
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
                <span>Subtotal amount:</span>
                <span>{formatPrice(activeQuotation.subtotalAmount, (activeQuotation as any).currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total GST amount:</span>
                <span>{formatPrice(activeQuotation.taxAmount, (activeQuotation as any).currency)}</span>
              </div>
              <div className="h-px bg-slate-200 my-1"></div>
              <div className="flex justify-between font-bold text-slate-900 text-base">
                <span>Grand Total:</span>
                <span className="text-indigo-700">{formatPrice(activeQuotation.totalAmount, (activeQuotation as any).currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
