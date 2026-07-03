import React, { useEffect, useState } from 'react';
import { api } from './api';
import { generateCrmPdf } from './generateCrmPdf';
import {
  Search,
  Download,
  Mail,
  Check,
  X,
  ChevronRight,
  Trash2,
  CheckCircle2,
  DollarSign,
  FileText
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

interface InvoiceItem {
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

interface SalesInvoice {
  _id: string;
  invoiceNumber: string;
  salesOrder?: any;
  customer: Customer;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  discountType: 'percentage' | 'flat' | 'none';
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'unpaid' | 'paid' | 'cancelled';
  notes: string;
}

export const AdminInvoices = () => {
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

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeInvoice, setActiveInvoice] = useState<SalesInvoice | null>(null);
  const [settings, setSettings] = useState<any>({});

  // Email modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const [invData, settingsData] = await Promise.all([
        api.list('crm/sales-invoices'),
        api.list('settings').catch(() => ({}))
      ]);
      setInvoices(invData);
      setSettings(settingsData);
    } catch (err: any) {
      setError('Failed to fetch sales invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.remove('crm/sales-invoices', id);
      setInvoices(invoices.filter(i => i._id !== id));
      if (activeInvoice?._id === id) setActiveInvoice(null);
      setView('list');
    } catch (err: any) {
      setError('Error deleting invoice');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: SalesInvoice['status']) => {
    try {
      const updated = await api.update('crm/sales-invoices', id, { status: newStatus });
      setInvoices(invoices.map(inv => inv._id === id ? updated : inv));
      if (activeInvoice?._id === id) setActiveInvoice(updated);
    } catch (err: any) {
      setError('Error updating invoice status');
    }
  };

  const handleDownloadPdf = async (inv: SalesInvoice) => {
    const doc = await generateCrmPdf(
      'Invoice',
      inv.invoiceNumber,
      new Date(inv.date).toLocaleDateString(),
      inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '',
      inv.customer,
      inv.items,
      inv,
      settings
    );
    doc.save(`Invoice_${inv.invoiceNumber}.pdf`);
  };

  const openEmailModal = (inv: SalesInvoice) => {
    setActiveInvoice(inv);
    setEmailTo(inv.customer.email || '');
    setEmailSubject(`Invoice ${inv.invoiceNumber} from ${settings?.websiteName || 'Diyar Power Link LLP'}`);
    setEmailBody(`
      <p>Dear ${inv.customer.name},</p>
      <p>Please find attached invoice <strong>${inv.invoiceNumber}</strong> for goods/services delivered.</p>
      <p><strong>Invoice Amount:</strong> ₹${inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      <p><strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Immediate'}</p>
      <br/>
      <p>Please log in or issue bank transfer/cheque payment accordingly.</p>
      <p>Thank you for your business!</p>
      <br/>
      <p>Best Regards,</p>
      <p><strong>${settings?.websiteName || 'Diyar Power Link LLP'}</strong></p>
    `);
    setEmailSuccess('');
    setShowEmailModal(true);
  };

  const handleSendCrmEmail = async () => {
    if (!activeInvoice) return;
    setSendingEmail(true);
    setEmailSuccess('');
    try {
      // 1. Generate PDF
      const doc = await generateCrmPdf(
        'Invoice',
        activeInvoice.invoiceNumber,
        new Date(activeInvoice.date).toLocaleDateString(),
        activeInvoice.dueDate ? new Date(activeInvoice.dueDate).toLocaleDateString() : '',
        activeInvoice.customer,
        activeInvoice.items,
        activeInvoice,
        settings
      );
      
      // 2. Output as Base64 string
      const base64 = doc.output('datauristring').split(',')[1];

      // 3. Post to backend
      const result = await api.sendCrmEmail({
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
        pdfBase64: base64,
        filename: `Invoice_${activeInvoice.invoiceNumber}.pdf`
      });

      if (result.success) {
        setEmailSuccess('Invoice email sent successfully!');
      } else {
        setError('Failed to dispatch email');
      }
    } catch (err: any) {
      setError(err?.message || 'Error generating/sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusStyle = (st: SalesInvoice['status']) => {
    switch (st) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'unpaid': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'paid': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
    }
  };

  const filtered = invoices.filter(i => {
    if (!i) return false;
    return (
      (i.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.customer?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Invoices</h1>
          <p className="text-sm text-slate-500">Record billing transactions, collect customer payments, export prints, and send invoice emails.</p>
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
                placeholder="Search invoice number or customer..."
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
                  <th className="py-3.5 px-6">Invoice No</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading invoices...' : 'No invoices found'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(i => (
                    <tr key={i._id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => { setActiveInvoice(i); setView('detail'); }}>
                      <td className="py-4 px-6 font-mono font-bold text-blue-600 hover:underline">
                        {i.invoiceNumber}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {i.customer?.name || 'Deleted Customer'}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(i.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'Immediate'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatPrice(i.totalAmount, (i as any).currency)}
                      </td>
                      <td className="py-4 px-6" onClick={e => e.stopPropagation()}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getStatusStyle(i.status)}`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-2 font-semibold" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDownloadPdf(i)}
                          title="Download PDF"
                          className="text-slate-500 hover:text-blue-600 p-1"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => openEmailModal(i)}
                          title="Email Invoice"
                          className="text-slate-500 hover:text-blue-600 p-1"
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          onClick={() => { setActiveInvoice(i); setView('detail'); }}
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
      {view === 'detail' && activeInvoice && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase">Payment Status:</span>
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusStyle(activeInvoice.status)}`}>
                  {activeInvoice.status}
                </span>
              </div>
              
              {activeInvoice.status === 'unpaid' && (
                <button
                  onClick={() => handleUpdateStatus(activeInvoice._id, 'paid')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 size={13} /> Mark as Paid
                </button>
              )}
              {activeInvoice.status === 'paid' && (
                <button
                  onClick={() => handleUpdateStatus(activeInvoice._id, 'unpaid')}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Mark as Unpaid
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDownloadPdf(activeInvoice)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                onClick={() => openEmailModal(activeInvoice)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Mail size={14} /> Send Email
              </button>
              {activeInvoice.status !== 'cancelled' && (
                <button
                  onClick={() => handleUpdateStatus(activeInvoice._id, 'cancelled')}
                  className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl"
                >
                  Void Invoice
                </button>
              )}
              <button
                onClick={() => handleDelete(activeInvoice._id)}
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-semibold">Tax Invoice</span>
                <span className="text-xl font-mono font-bold text-slate-900 block mt-1">{activeInvoice.invoiceNumber}</span>
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  <p>Date: {new Date(activeInvoice.date).toLocaleDateString()}</p>
                  <p>Due Date: {activeInvoice.dueDate ? new Date(activeInvoice.dueDate).toLocaleDateString() : 'Immediate'}</p>
                  <p>Currency: {(activeInvoice as any).currency || 'INR'} {(activeInvoice as any).currency && (activeInvoice as any).currency !== 'INR' && `(Rate: ${(activeInvoice as any).exchangeRate})`}</p>
                  {activeInvoice.salesOrder && (
                    <p className="font-mono mt-1 text-slate-600">Order Ref: {activeInvoice.salesOrder.salesOrderNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Columns */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Billing Details</span>
                <div className="text-xs text-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900">{activeInvoice.customer?.name}</p>
                  {activeInvoice.customer?.gstPan && (
                    <p className="font-mono text-slate-600">GST/PAN: {activeInvoice.customer.gstPan}</p>
                  )}
                  {activeInvoice.customer?.billingAddress ? (
                    <>
                      <p>{activeInvoice.customer.billingAddress.street}</p>
                      <p>{activeInvoice.customer.billingAddress.city}, {activeInvoice.customer.billingAddress.state} - {activeInvoice.customer.billingAddress.zip}</p>
                      <p>{activeInvoice.customer.billingAddress.country}</p>
                    </>
                  ) : <p className="text-slate-400">No Address</p>}
                  {activeInvoice.customer?.phone && <p>Phone: {activeInvoice.customer.phone}</p>}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Shipping Details</span>
                <div className="text-xs text-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900">{activeInvoice.customer?.name}</p>
                  {activeInvoice.customer?.shippingAddress ? (
                    <>
                      <p>{activeInvoice.customer.shippingAddress.street}</p>
                      <p>{activeInvoice.customer.shippingAddress.city}, {activeInvoice.customer.shippingAddress.state} - {activeInvoice.customer.shippingAddress.zip}</p>
                      <p>{activeInvoice.customer.shippingAddress.country}</p>
                    </>
                  ) : <p className="text-slate-400">No Address</p>}
                </div>
              </div>
            </div>

            {/* Items Table */}
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
                  {activeInvoice.items.map((it, idx) => (
                    <tr key={idx} className="align-middle">
                      <td className="py-3 pl-1 text-slate-500">{idx + 1}</td>
                      <td className="py-3 font-semibold text-slate-800">{it.name}</td>
                      <td className="py-3 font-mono text-slate-600">{it.sku}</td>
                      <td className="py-3 text-center">{it.qty}</td>
                      <td className="py-3 text-slate-600">{it.uom}</td>
                      <td className="py-3 text-right">{formatPrice(it.price, (activeInvoice as any).currency)}</td>
                      <td className="py-3 text-center">{it.discount}%</td>
                      <td className="py-3 text-center text-slate-500">{it.taxRate}%</td>
                      <td className="py-3 text-right pr-1 font-bold text-slate-800">
                        {formatPrice(it.total, (activeInvoice as any).currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes and calculation panels */}
            <div className="flex justify-between items-start gap-8 border-t border-slate-100 pt-6">
              <div className="flex-1 space-y-4">
                <div className="max-w-xs space-y-2 text-xs text-slate-500">
                  {activeInvoice.notes && (
                    <>
                      <p className="font-bold text-slate-700">Notes / Remarks:</p>
                      <p className="whitespace-pre-line leading-relaxed">{activeInvoice.notes}</p>
                    </>
                  )}
                </div>

                {/* QR Code display */}
                <div className="mt-4 border border-slate-100 rounded-xl p-3 bg-slate-50 inline-block">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Invoice QR Code</span>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      [
                        `Invoice: ${activeInvoice.invoiceNumber}`,
                        `Date: ${new Date(activeInvoice.date).toLocaleDateString()}`,
                        `Company: ${settings?.websiteName || 'Diyar Power Link LLP'}`,
                        settings?.companyGst ? `Company GST: ${settings.companyGst}` : '',
                        settings?.companyTaxNo ? `Company Tax No: ${settings.companyTaxNo}` : '',
                        `Customer: ${activeInvoice.customer.name}`,
                        activeInvoice.customer.gstPan ? `Customer GST: ${activeInvoice.customer.gstPan}` : '',
                        `Total: ₹${activeInvoice.totalAmount.toFixed(2)}`
                      ].filter(Boolean).join('\n')
                    )}`}
                    alt="Invoice QR Code"
                    className="w-28 h-28 object-contain"
                  />
                </div>
              </div>

              <div className="w-64 space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Gross Subtotal:</span>
                  <span className="text-slate-800">
                    {formatPrice(activeInvoice.items.reduce((acc, it) => acc + it.price * it.qty, 0), (activeInvoice as any).currency)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatPrice(activeInvoice.discountAmount, (activeInvoice as any).currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                  <span>Taxable Amount:</span>
                  <span className="text-slate-800">{formatPrice(activeInvoice.taxableAmount, (activeInvoice as any).currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax Value:</span>
                  <span className="text-slate-800">{formatPrice(activeInvoice.taxAmount, (activeInvoice as any).currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span>{formatPrice(activeInvoice.totalAmount, (activeInvoice as any).currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL MODAL */}
      {showEmailModal && activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Mail size={18} className="text-blue-500" /> Dispatch Invoice Email
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
                    <p className="text-slate-500 text-[10px] font-mono">Invoice_{activeInvoice.invoiceNumber}.pdf</p>
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
                    onClick={handleSendCrmEmail}
                    disabled={sendingEmail || !emailTo}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow-sm"
                  >
                    {sendingEmail ? 'Sending...' : 'Send Invoice'}
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
