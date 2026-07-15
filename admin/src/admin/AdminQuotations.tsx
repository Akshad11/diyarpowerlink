import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from './api';
import { generateCrmPdf } from './generateCrmPdf';
import {
  Plus,
  Search,
  FileText,
  Mail,
  Download,
  Check,
  X,
  ChevronRight,
  Trash2,
  FileSpreadsheet,
  Settings as SettingsIcon,
  ArrowRightLeft
} from 'lucide-react';

interface Uom {
  _id: string;
  name: string;
  code: string;
}

interface Tax {
  _id: string;
  name: string;
  rate: number;
}

interface Item {
  _id: string;
  name: string;
  sku: string;
  price: number;
  uom: Uom;
  tax: Tax;
}

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  gstPan?: string;
  billingAddress?: any;
  shippingAddress?: any;
}

interface QuotationItem {
  itemId: string;
  name: string;
  sku: string;
  type: string;
  uom: string;
  taxRate: number;
  taxName: string;
  price: number;
  qty: number;
  discount: number; // percentage
  taxAmount: number;
  subtotal: number;
  total: number;
}

interface Quotation {
  _id: string;
  quotationNumber: string;
  customer: Customer;
  date: string;
  validUntil?: string;
  items: QuotationItem[];
  discountType: 'percentage' | 'flat' | 'none';
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'converted';
  notes: string;
  currency?: string;
  exchangeRate?: number;
}

export const AdminQuotations = () => {
  const location = useLocation();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [itemsMaster, setItemsMaster] = useState<Item[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // Views: 'list' | 'form' | 'detail'
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [activeQuotation, setActiveQuotation] = useState<Quotation | null>(null);

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'flat' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Quotation['status']>('draft');
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

  // New item row state
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | ''>('');
  const [addQty, setAddQty] = useState(1);
  const [addDiscount, setAddDiscount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.prefillCustomerId && customers.length > 0) {
      const found = customers.find(c => c._id === location.state.prefillCustomerId);
      if (found) {
        handleNew();
        setCustomerId(location.state.prefillCustomerId);
        // Clear history state to avoid triggering on re-entry
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, customers]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quotData, custData, itemData, settingsData] = await Promise.all([
        api.list('crm/quotations'),
        api.list('crm/customers'),
        api.list('crm/items'),
        api.list('settings').catch(() => ({}))
      ]);
      setQuotations(quotData);
      setCustomers(custData);
      setItemsMaster(itemData);
      setSettings(settingsData);
    } catch (err: any) {
      setError('Failed to fetch quotation dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const calculateTotals = (currentItems: QuotationItem[], discType: typeof discountType, discVal: number) => {
    // 1. Calculate each line's subtotal and total
    const updatedLines = currentItems.map(it => {
      const sub = it.price * it.qty;
      const lineDiscVal = sub * (it.discount / 100);
      const taxable = sub - lineDiscVal;
      const taxAmt = taxable * (it.taxRate / 100);
      const total = taxable + taxAmt;
      return { ...it, subtotal: sub, taxAmount: taxAmt, total };
    });

    const linesSubtotal = updatedLines.reduce((sum, l) => sum + l.subtotal, 0);
    const linesTaxable = updatedLines.reduce((sum, l) => sum + (l.subtotal - (l.subtotal * (l.discount / 100))), 0);
    
    // 2. Global discount
    let finalDiscountAmt = 0;
    if (discType === 'flat') {
      finalDiscountAmt = discVal;
    } else if (discType === 'percentage') {
      finalDiscountAmt = linesTaxable * (discVal / 100);
    }

    const overallTaxable = Math.max(0, linesTaxable - finalDiscountAmt);
    
    // Total Tax (sum of line tax amounts scaled down if global discount is applied)
    // For simplicity: lines' tax gets recalculated based on the relative global discount factor
    const discountRatio = linesTaxable > 0 ? overallTaxable / linesTaxable : 0;
    const finalTaxAmt = updatedLines.reduce((sum, l) => {
      const lineTaxable = l.subtotal - (l.subtotal * (l.discount / 100));
      const scaledLineTaxable = lineTaxable * discountRatio;
      return sum + (scaledLineTaxable * (l.taxRate / 100));
    }, 0);

    const grandTotal = overallTaxable + finalTaxAmt;

    return {
      updatedLines,
      totals: {
        discountAmount: finalDiscountAmt,
        taxableAmount: overallTaxable,
        taxAmount: finalTaxAmt,
        totalAmount: grandTotal
      }
    };
  };

  const calculated = calculateTotals(items, discountType, discountValue);

  const handleAddItem = () => {
    if (selectedItemIndex === '') return;
    const master = itemsMaster[selectedItemIndex];
    if (!master) return;

    // Check if item is already added
    if (items.some(i => i.itemId === master._id)) {
      alert('Item is already added to quotation');
      return;
    }

    const newItem: QuotationItem = {
      itemId: master._id,
      name: master.name,
      sku: master.sku,
      type: (master as any).type || 'product',
      uom: master.uom?.code || 'PCS',
      taxRate: master.tax?.rate || 0,
      taxName: master.tax?.name || 'Exempt',
      price: master.price || 0,
      qty: addQty,
      discount: addDiscount,
      taxAmount: 0,
      subtotal: 0,
      total: 0
    };

    setItems([...items, newItem]);
    setSelectedItemIndex('');
    setAddQty(1);
    setAddDiscount(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    if (qty < 1) return;
    setItems(items.map((it, i) => i === index ? { ...it, qty } : it));
  };

  const handleUpdateItemDiscount = (index: number, discount: number) => {
    if (discount < 0 || discount > 100) return;
    setItems(items.map((it, i) => i === index ? { ...it, discount } : it));
  };

  const handleUpdateItemPrice = (index: number, price: number) => {
    if (price < 0) return;
    setItems(items.map((it, i) => i === index ? { ...it, price } : it));
  };

  const handleUpdateItemTaxRate = (index: number, taxRate: number) => {
    if (taxRate < 0 || taxRate > 100) return;
    setItems(items.map((it, i) => i === index ? { ...it, taxRate, taxName: taxRate > 0 ? 'GST' : 'Exempt' } : it));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) {
      alert('Please select a customer and add at least one item');
      return;
    }

    const t = calculated.totals;
    const payload = {
      customer: customerId,
      date,
      validUntil: validUntil || undefined,
      items: calculated.updatedLines,
      discountType,
      discountValue,
      discountAmount: t.discountAmount,
      taxableAmount: t.taxableAmount,
      taxAmount: t.taxAmount,
      totalAmount: t.totalAmount,
      status,
      notes,
      currency,
      exchangeRate: Number(exchangeRate) || 1
    };

    try {
      if (activeQuotation) {
        const updated = await api.update('crm/quotations', activeQuotation._id, payload);
        setQuotations(quotations.map(q => q._id === activeQuotation._id ? updated : q));
        setActiveQuotation(updated);
      } else {
        const created = await api.create('crm/quotations', payload);
        setQuotations([created, ...quotations]);
        setActiveQuotation(created);
      }
      setView('detail');
    } catch (err: any) {
      setError(err.message || 'Error saving quotation');
    }
  };

  const handleEdit = (q: any) => {
    setActiveQuotation(q);
    setCustomerId(q.customer._id);
    setDate(q.date.substring(0, 10));
    setValidUntil(q.validUntil ? q.validUntil.substring(0, 10) : '');
    setItems(q.items);
    setDiscountType(q.discountType || 'none');
    setDiscountValue(q.discountValue || 0);
    setStatus(q.status);
    setNotes(q.notes || '');
    setCurrency(q.currency || 'INR');
    setExchangeRate(q.exchangeRate || 1);
    setView('form');
  };

  const handleNew = () => {
    setActiveQuotation(null);
    setCustomerId(customers[0]?._id || '');
    setDate(new Date().toISOString().substring(0, 10));
    setValidUntil('');
    setItems([]);
    setDiscountType('none');
    setDiscountValue(0);
    setStatus('draft');
    setNotes('');
    setCurrency('INR');
    setExchangeRate(1);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await api.remove('crm/quotations', id);
      setQuotations(quotations.filter(q => q._id !== id));
      if (activeQuotation?._id === id) setActiveQuotation(null);
      setView('list');
    } catch (err: any) {
      setError('Error deleting quotation');
    }
  };

  const handleDownloadPdf = async (q: Quotation) => {
    const doc = await generateCrmPdf(
      'Quotation',
      q.quotationNumber,
      new Date(q.date).toLocaleDateString(),
      q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '',
      q.customer,
      q.items,
      q,
      settings
    );
    doc.save(`Quotation_${q.quotationNumber}.pdf`);
  };

  const openEmailModal = (q: Quotation) => {
    setActiveQuotation(q);
    setEmailTo(q.customer.email || '');
    setEmailSubject(`Quotation ${q.quotationNumber} from ${settings?.websiteName || 'Diyar Power Link LLP'}`);
    setEmailBody(`
      <p>Dear ${q.customer.name},</p>
      <p>Please find attached our quotation <strong>${q.quotationNumber}</strong> for your review.</p>
      <p><strong>Total Amount:</strong> ₹${q.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      <br/>
      <p>Best Regards,</p>
      <p><strong>${settings?.websiteName || 'Diyar Power Link LLP'}</strong></p>
    `);
    setEmailSuccess('');
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!activeQuotation) return;
    setSendingEmail(true);
    setEmailSuccess('');
    try {
      // 1. Generate PDF
      const doc = await generateCrmPdf(
        'Quotation',
        activeQuotation.quotationNumber,
        new Date(activeQuotation.date).toLocaleDateString(),
        activeQuotation.validUntil ? new Date(activeQuotation.validUntil).toLocaleDateString() : '',
        activeQuotation.customer,
        activeQuotation.items,
        activeQuotation,
        settings
      );
      
      // 2. Output as Base64
      const base64 = doc.output('datauristring').split(',')[1];

      // 3. Post to backend
      const result = await api.sendCrmEmail({
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
        pdfBase64: base64,
        filename: `Quotation_${activeQuotation.quotationNumber}.pdf`
      });

      if (result.success) {
        setEmailSuccess('Email sent successfully!');
        // Update quotation status to 'sent' if it's draft
        if (activeQuotation.status === 'draft') {
          const updated = await api.update('crm/quotations', activeQuotation._id, { status: 'sent' });
          setQuotations(quotations.map(q => q._id === activeQuotation._id ? updated : q));
          setActiveQuotation(updated);
        }
      } else {
        setError('Failed to dispatch email');
      }
    } catch (err: any) {
      setError(err?.message || 'Error generating/sending quotation email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleConvertToSalesOrder = async (q: Quotation) => {
    if (!window.confirm('Do you want to convert this Quotation into a Sales Order?')) return;
    try {
      const salesOrderPayload = {
        quotation: q._id,
        customer: q.customer._id,
        date: new Date().toISOString().substring(0, 10),
        items: q.items,
        discountType: q.discountType,
        discountValue: q.discountValue,
        discountAmount: q.discountAmount,
        taxableAmount: q.taxableAmount,
        taxAmount: q.taxAmount,
        totalAmount: q.totalAmount,
        notes: `Converted from Quotation ${q.quotationNumber}. ${q.notes || ''}`,
        currency: q.currency || 'INR',
        exchangeRate: q.exchangeRate || 1
      };
      
      const created = await api.create('crm/sales-orders', salesOrderPayload);
      alert(`Sales Order ${created.salesOrderNumber} created successfully!`);
      
      // Update quotation status in list
      setQuotations(quotations.map(item => item._id === q._id ? { ...item, status: 'converted' } : item));
      if (activeQuotation?._id === q._id) {
        setActiveQuotation({ ...q, status: 'converted' });
      }
      setView('list');
    } catch (err: any) {
      alert(err.message || 'Error converting to Sales Order');
    }
  };

  const getStatusStyle = (st: Quotation['status']) => {
    switch (st) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'sent': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'declined': return 'bg-red-50 text-red-700 border border-red-200';
      case 'converted': return 'bg-purple-50 text-purple-700 border border-purple-200';
    }
  };

  const filtered = quotations.filter(q => {
    if (!q) return false;
    return (
      (q.quotationNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.customer?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotation System</h1>
          <p className="text-sm text-slate-500">Draft proposals, track customer approvals, download PDFs, and dispatch email quotes.</p>
        </div>
        {view === 'list' ? (
          <button
            onClick={handleNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-blue-500/10"
          >
            <Plus size={16} /> Create Quotation
          </button>
        ) : (
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

      {/* 1. LIST VIEW */}
      {view === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search quote number or customer..."
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
                  <th className="py-3.5 px-6">Quote No</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Valid Until</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading quotations...' : 'No quotations found'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(q => (
                    <tr key={q._id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => { setActiveQuotation(q); setView('detail'); }}>
                      <td className="py-4 px-6 font-mono font-bold text-blue-600 hover:underline">
                        {q.quotationNumber}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {q.customer?.name || 'Deleted Customer'}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(q.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        ₹{(q.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6" onClick={e => e.stopPropagation()}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getStatusStyle(q.status)}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-2 font-semibold" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDownloadPdf(q)}
                          title="Download PDF"
                          className="text-slate-500 hover:text-blue-600 p-1"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => openEmailModal(q)}
                          title="Email Quote"
                          className="text-slate-500 hover:text-blue-600 p-1"
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(q)}
                          title="Edit"
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

      {/* 2. FORM VIEW (Create/Edit) */}
      {view === 'form' && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {activeQuotation ? `Modify Quotation ${activeQuotation.quotationNumber}` : 'Draft New Quotation'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Customer *</label>
              <select
                required
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} {c.gstPan ? `(${c.gstPan})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Currency *</label>
              <select
                value={currency}
                onChange={e => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                disabled={currency === 'INR'}
                required
              />
            </div>
          </div>

          {/* Line Items Manager */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Line Items</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <th className="pb-2 pl-1">Item Details</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Price (INR)</th>
                    <th className="pb-2">GST</th>
                    <th className="pb-2">Disc %</th>
                    <th className="pb-2 text-right pr-2">Total Amount</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((it, idx) => {
                    const rowSub = it.price * it.qty;
                    const rowDisc = rowSub * (it.discount / 100);
                    const rowTotal = (rowSub - rowDisc) * (1 + it.taxRate / 100);
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
                          ₹{rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

                  {/* Add New Line Item Row */}
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
                            {item.name} [{item.sku}] (₹{item.price})
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
                    <td className="py-3 text-slate-400 text-xs">
                      {selectedItemIndex !== '' ? `₹${itemsMaster[selectedItemIndex]?.price}` : '-'}
                    </td>
                    <td className="py-3 text-slate-400 text-xs">
                      {selectedItemIndex !== '' ? `${itemsMaster[selectedItemIndex]?.tax?.name}` : '-'}
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
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
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-3 py-1 rounded-lg text-xs font-semibold"
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

          {/* Discount & Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Quotation Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Quotation['status'])}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Global Discount Type</label>
                <div className="flex gap-2">
                  {(['none', 'percentage', 'flat'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setDiscountType(type); setDiscountValue(0); }}
                      className={`px-3 py-1.5 text-xs font-semibold border rounded-lg uppercase ${discountType === type ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {discountType !== 'none' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Discount Value ({discountType === 'percentage' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value) || 0)}
                    className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notes / Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes, delivery terms, payment conditions..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Calculations Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 font-medium text-slate-600 text-sm h-fit">
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span className="text-slate-800">
                  ₹{items.reduce((acc, it) => acc + it.price * it.qty, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>-₹{calculated.totals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-3">
                <span>Taxable Amount:</span>
                <span className="text-slate-800">₹{calculated.totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax Value:</span>
                <span className="text-slate-800">₹{calculated.totals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
                <span>Grand Total:</span>
                <span>₹{calculated.totals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setView('list')}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-sm"
            >
              Save Quotation
            </button>
          </div>
        </form>
      )}

      {/* 3. DETAIL VIEW */}
      {view === 'detail' && activeQuotation && (
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Quotation Status:</span>
              <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusStyle(activeQuotation.status)}`}>
                {activeQuotation.status}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDownloadPdf(activeQuotation)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                onClick={() => openEmailModal(activeQuotation)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Mail size={14} /> Send Email
              </button>
              <button
                onClick={() => handleEdit(activeQuotation)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
              >
                Edit Details
              </button>
              {activeQuotation.status !== 'converted' && (
                <button
                  onClick={() => handleConvertToSalesOrder(activeQuotation)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-blue-500/10"
                >
                  <ArrowRightLeft size={14} /> Convert to Sales Order
                </button>
              )}
              <button
                onClick={() => handleDelete(activeQuotation._id)}
                className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>

          {/* HTML Invoice Template Display */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 max-w-4xl mx-auto">
            {/* Template Header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{settings?.websiteName || 'Diyar Power Link LLP'}</h3>
                <p className="text-xs text-slate-500 max-w-lg mt-1">{settings?.contactAddress || 'Riyadh, Saudi Arabia'}</p>
                <p className="text-xs text-slate-500">
                  {settings?.contactPhone && <span className="mr-3"><strong>Phone:</strong> {settings.contactPhone}</span>}
                  {settings?.companyMobile && <span className="mr-3"><strong>Mobile:</strong> {settings.companyMobile}</span>}
                  {settings?.contactEmail && <span><strong>Email:</strong> {settings.contactEmail}</span>}
                </p>
                {(settings?.companyGst || settings?.companyLlpNo || settings?.companyPanNo || settings?.companyChamberCommerce || settings?.companyFax || settings?.companyTelephone || settings?.companyPoBox) && (
                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {settings.companyGst && <span><strong>GST:</strong> {settings.companyGst}</span>}
                    {settings.companyLlpNo && <span><strong>LLP No:</strong> {settings.companyLlpNo}</span>}
                    {settings.companyPanNo && <span><strong>PAN:</strong> {settings.companyPanNo}</span>}
                    {settings.companyChamberCommerce && <span><strong>Chamber Commerce:</strong> {settings.companyChamberCommerce}</span>}
                    {settings.companyTelephone && <span><strong>Tel:</strong> {settings.companyTelephone}</span>}
                    {settings.companyFax && <span><strong>Fax:</strong> {settings.companyFax}</span>}
                    {settings.companyPoBox && <span><strong>PO Box:</strong> {settings.companyPoBox}</span>}
                    {settings.companyPinCode && <span><strong>PIN:</strong> {settings.companyPinCode}</span>}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Quotation</span>
                <span className="text-xl font-mono font-bold text-slate-900 block mt-1">{activeQuotation.quotationNumber}</span>
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  <p>Date: {new Date(activeQuotation.date).toLocaleDateString()}</p>
                  {activeQuotation.validUntil && (
                    <p>Valid Until: {new Date(activeQuotation.validUntil).toLocaleDateString()}</p>
                  )}
                  <p>Currency: {activeQuotation.currency || 'INR'} {activeQuotation.currency && activeQuotation.currency !== 'INR' && `(Rate: ${activeQuotation.exchangeRate})`}</p>
                </div>
              </div>
            </div>

            {/* Bill/Ship Address Column Grid */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Billing Details</span>
                <div className="text-xs text-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900">{activeQuotation.customer?.name}</p>
                  {activeQuotation.customer?.gstPan && (
                    <p className="font-mono text-slate-600">GST/PAN: {activeQuotation.customer.gstPan}</p>
                  )}
                  {activeQuotation.customer?.billingAddress ? (
                    <>
                      <p>{activeQuotation.customer.billingAddress.street}</p>
                      <p>{activeQuotation.customer.billingAddress.city}, {activeQuotation.customer.billingAddress.state} - {activeQuotation.customer.billingAddress.zip}</p>
                      <p>{activeQuotation.customer.billingAddress.country}</p>
                    </>
                  ) : <p className="text-slate-400">No Address</p>}
                  {activeQuotation.customer?.phone && <p>Phone: {activeQuotation.customer.phone}</p>}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Shipping Details</span>
                <div className="text-xs text-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900">{activeQuotation.customer?.name}</p>
                  {activeQuotation.customer?.shippingAddress ? (
                    <>
                      <p>{activeQuotation.customer.shippingAddress.street}</p>
                      <p>{activeQuotation.customer.shippingAddress.city}, {activeQuotation.customer.shippingAddress.state} - {activeQuotation.customer.shippingAddress.zip}</p>
                      <p>{activeQuotation.customer.shippingAddress.country}</p>
                    </>
                  ) : <p className="text-slate-400">No Address</p>}
                </div>
              </div>
            </div>

            {/* Lines Table */}
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
                  {activeQuotation.items.map((it, idx) => (
                    <tr key={idx} className="align-middle">
                      <td className="py-3 pl-1 text-slate-500">{idx + 1}</td>
                      <td className="py-3 font-semibold text-slate-800">{it.name}</td>
                      <td className="py-3 font-mono text-slate-600">{it.sku}</td>
                      <td className="py-3 text-center">{it.qty}</td>
                      <td className="py-3 text-slate-600">{it.uom}</td>
                      <td className="py-3 text-right">{formatPrice(it.price, activeQuotation.currency)}</td>
                      <td className="py-3 text-center">{it.discount}%</td>
                      <td className="py-3 text-center text-slate-500">{it.taxRate}%</td>
                      <td className="py-3 text-right pr-1 font-bold text-slate-800">
                        {formatPrice(it.total, activeQuotation.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom calculation breakdown */}
            <div className="flex justify-between items-start gap-8 border-t border-slate-100 pt-6">
              <div className="max-w-xs space-y-2 text-xs text-slate-500">
                {activeQuotation.notes && (
                  <>
                    <p className="font-bold text-slate-700">Notes / Remarks:</p>
                    <p className="whitespace-pre-line leading-relaxed">{activeQuotation.notes}</p>
                  </>
                )}
              </div>

              <div className="w-64 space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Gross Subtotal:</span>
                  <span className="text-slate-800">
                    {formatPrice(activeQuotation.items.reduce((acc, it) => acc + it.price * it.qty, 0), activeQuotation.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatPrice(activeQuotation.discountAmount, activeQuotation.currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                  <span>Taxable Amount:</span>
                  <span className="text-slate-800">{formatPrice(activeQuotation.taxableAmount, activeQuotation.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax Value:</span>
                  <span className="text-slate-800">{formatPrice(activeQuotation.taxAmount, activeQuotation.currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span>{formatPrice(activeQuotation.totalAmount, activeQuotation.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. EMAIL DIALOG MODAL */}
      {showEmailModal && activeQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Mail size={18} className="text-blue-500" /> Dispatch Quotation Email
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {emailSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-sm text-emerald-800">
                <p className="font-semibold">{emailSuccess}</p>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="mt-3 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-semibold text-slate-500">
                <div>
                  <label className="block mb-1">To Address</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block mb-1">Email Body (HTML/Text)</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                  <FileText size={18} className="text-red-500" />
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-[11px]">Attachment File</p>
                    <p className="text-slate-500 text-[10px] font-mono">Quotation_{activeQuotation.quotationNumber}.pdf</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg font-semibold hover:bg-slate-100 text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !emailTo}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow-sm"
                  >
                    {sendingEmail ? 'Sending...' : 'Send Quote'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
