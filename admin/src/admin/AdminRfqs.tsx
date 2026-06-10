import React, { useEffect, useState } from 'react';
import { api } from './api';
import { generateProcurementPdf } from './generateProcurementPdf';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Send,
  Download,
  Mail,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  ClipboardList,
  CheckSquare,
  Square,
  Users
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

interface InquiryItem {
  itemId: string;
  name: string;
  sku: string;
  qty: number;
  uom: string;
  description: string;
}

interface Inquiry {
  _id: string;
  inquiryNumber: string;
  items: InquiryItem[];
  requestedBy: string;
}

interface Rfq {
  _id: string;
  rfqNumber: string;
  inquiry?: Inquiry;
  date: string;
  suppliers: Supplier[];
  items: InquiryItem[];
  status: 'draft' | 'sent' | 'closed';
  notes?: string;
}

export const AdminRfqs = () => {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [suppliersMaster, setSuppliersMaster] = useState<Supplier[]>([]);
  const [inquiriesMaster, setInquiriesMaster] = useState<Inquiry[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // View state: 'list' | 'form' | 'detail'
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [activeRfq, setActiveRfq] = useState<Rfq | null>(null);

  // RFQ Form states
  const [date, setDate] = useState('');
  const [selectedInquiryId, setSelectedInquiryId] = useState('');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Rfq['status']>('draft');

  // Email state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSupplier, setEmailSupplier] = useState<Supplier | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    fetchData();
    checkForPrefill();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rfqData, supData, inqData, settingsData] = await Promise.all([
        api.list('procurement/rfqs'),
        api.list('procurement/suppliers'),
        api.list('procurement/inquiries'),
        api.list('settings')
      ]);
      setRfqs(rfqData);
      setSuppliersMaster(supData.filter((s: any) => s.status === 'active'));
      setInquiriesMaster(inqData.filter((i: any) => i.status === 'draft'));
      setSettings(settingsData);
    } catch (err: any) {
      setError('Failed to fetch RFQ related data');
    } finally {
      setLoading(false);
    }
  };

  const checkForPrefill = () => {
    const prefillStr = sessionStorage.getItem('prefill_inquiry_rfq');
    if (prefillStr) {
      try {
        const inq = JSON.parse(prefillStr);
        sessionStorage.removeItem('prefill_inquiry_rfq');
        
        // Setup form for new RFQ prefilled from Inquiry
        setActiveRfq(null);
        setDate(new Date().toISOString().substring(0, 10));
        setSelectedInquiryId(inq._id);
        setItems(inq.items || []);
        setSelectedSupplierIds([]);
        setNotes(`Created from Inquiry ${inq.inquiryNumber}.`);
        setStatus('draft');
        setView('form');
      } catch (e) {
        // Ignore JSON error
      }
    }
  };

  const handleInquiryChange = (inqId: string) => {
    setSelectedInquiryId(inqId);
    if (!inqId) {
      setItems([]);
      return;
    }
    const selected = inquiriesMaster.find(i => i._id === inqId);
    if (selected) {
      setItems(selected.items || []);
    }
  };

  const handleToggleSupplier = (supId: string) => {
    if (selectedSupplierIds.includes(supId)) {
      setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== supId));
    } else {
      setSelectedSupplierIds([...selectedSupplierIds, supId]);
    }
  };

  const handleNew = () => {
    setActiveRfq(null);
    setDate(new Date().toISOString().substring(0, 10));
    setSelectedInquiryId('');
    setSelectedSupplierIds([]);
    setItems([]);
    setNotes('');
    setStatus('draft');
    setView('form');
  };

  const handleEdit = (rfq: Rfq) => {
    setActiveRfq(rfq);
    setDate(new Date(rfq.date).toISOString().substring(0, 10));
    setSelectedInquiryId(rfq.inquiry?._id || '');
    setSelectedSupplierIds(rfq.suppliers.map(s => s._id));
    setItems(rfq.items || []);
    setNotes(rfq.notes || '');
    setStatus(rfq.status || 'draft');
    setView('form');
  };

  const handleViewDetail = (rfq: Rfq) => {
    setActiveRfq(rfq);
    setView('detail');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this RFQ?')) return;
    try {
      await api.remove('procurement/rfqs', id);
      setRfqs(rfqs.filter(r => r._id !== id));
      if (activeRfq?._id === id) setActiveRfq(null);
      setView('list');
    } catch (err) {
      setError('Failed to delete RFQ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSupplierIds.length === 0) {
      alert('Please select at least one supplier.');
      return;
    }
    if (items.length === 0) {
      alert('RFQ items list cannot be empty.');
      return;
    }

    const payload = {
      date: new Date(date).toISOString(),
      inquiry: selectedInquiryId || undefined,
      suppliers: selectedSupplierIds,
      items: items.map(it => ({
        itemId: it.itemId,
        name: it.name,
        sku: it.sku,
        qty: it.qty,
        uom: it.uom,
        description: it.description
      })),
      notes: notes.trim(),
      status
    };

    try {
      if (activeRfq) {
        const updated = await api.update('procurement/rfqs', activeRfq._id, payload);
        setRfqs(rfqs.map(r => r._id === activeRfq._id ? updated : r));
        setActiveRfq(updated);
      } else {
        const created = await api.create('procurement/rfqs', payload);
        setRfqs([created, ...rfqs]);
        setActiveRfq(created);
      }
      setView('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to save RFQ');
    }
  };

  const handleDownloadRfqPdf = (rfq: Rfq, supplier: Supplier) => {
    const doc = generateProcurementPdf(
      'RFQ',
      rfq.rfqNumber,
      new Date(rfq.date).toLocaleDateString(),
      '', // No submission deadline yet
      supplier,
      rfq.items,
      { notes: rfq.notes },
      settings
    );
    doc.save(`RFQ_${rfq.rfqNumber}_${supplier.name.replace(/\s+/g, '_')}.pdf`);
  };

  const openEmailModal = (rfq: Rfq, supplier: Supplier) => {
    setEmailSupplier(supplier);
    setEmailTo(supplier.email || '');
    setEmailSubject(`Request for Quotation ${rfq.rfqNumber} - ${settings?.websiteName || 'Diyar Power Link'}`);
    setEmailBody(`
      <p>Dear ${supplier.contactName || supplier.name},</p>
      <p>We invite you to submit your bids for the items mentioned in the attached Request for Quotation <strong>${rfq.rfqNumber}</strong>.</p>
      <p>Please print, fill in your unit prices and tax rates, and return the quote to us at your earliest convenience.</p>
      <br/>
      <p>Best Regards,</p>
      <p>Purchasing Department</p>
      <p><strong>${settings?.websiteName || 'Diyar Power Link LLP'}</strong></p>
    `);
    setEmailSuccess('');
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!activeRfq || !emailSupplier) return;
    setSendingEmail(true);
    setEmailSuccess('');
    try {
      // 1. Generate priceless RFQ PDF
      const doc = generateProcurementPdf(
        'RFQ',
        activeRfq.rfqNumber,
        new Date(activeRfq.date).toLocaleDateString(),
        '',
        emailSupplier,
        activeRfq.items,
        { notes: activeRfq.notes },
        settings
      );
      
      // 2. Output as base64
      const base64 = doc.output('datauristring').split(',')[1];

      // 3. Send via email api
      const result = await api.sendCrmEmail({
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
        pdfBase64: base64,
        filename: `RFQ_${activeRfq.rfqNumber}_${emailSupplier.name.replace(/\s+/g, '_')}.pdf`
      });

      if (result.success) {
        setEmailSuccess('RFQ email sent to supplier successfully!');
        if (activeRfq.status === 'draft') {
          const updated = await api.update('procurement/rfqs', activeRfq._id, { status: 'sent' });
          setRfqs(rfqs.map(r => r._id === activeRfq._id ? updated : r));
          setActiveRfq(updated);
        }
      } else {
        setError('Failed to dispatch email');
      }
    } catch (err: any) {
      setError(err?.message || 'Error generating/sending RFQ email');
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusStyle = (st: Rfq['status']) => {
    switch (st) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'sent': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'closed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  const filtered = rfqs.filter(r =>
    r.rfqNumber.toLowerCase().includes(search.toLowerCase()) ||
    (r.inquiry?.inquiryNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">RFQ Management</h1>
          <p className="text-sm text-slate-500">Send RFQs to multiple suppliers, review pricing sheets, and manage procurement quotes.</p>
        </div>
        {view === 'list' && (
          <button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-indigo-500/10"
          >
            <Plus size={16} /> Create RFQ
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
                placeholder="Search by RFQ number..."
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
                  <th className="py-3.5 px-6">RFQ No</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Inquiry Ref</th>
                  <th className="py-3.5 px-6">Suppliers Count</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading RFQs...' : 'No RFQs issued yet.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                        <Send size={16} className="text-slate-400" />
                        <button
                          onClick={() => handleViewDetail(r)}
                          className="hover:underline text-indigo-600 font-bold"
                        >
                          {r.rfqNumber}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-700">
                        {r.inquiry?.inquiryNumber || 'Direct RFQ'}
                      </td>
                      <td className="py-4 px-6 font-semibold text-indigo-600 flex items-center gap-1.5 mt-2">
                        <Users size={14} className="text-slate-400" /> {r.suppliers?.length || 0} Suppliers
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-3">
                        <button
                          onClick={() => handleViewDetail(r)}
                          className="text-slate-600 hover:text-indigo-600 font-semibold text-xs"
                        >
                          Manage
                        </button>
                        {r.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleEdit(r)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(r._id)}
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
              {activeRfq ? `Edit RFQ: ${activeRfq.rfqNumber}` : 'New Request for Quotation'}
            </h2>
            <button type="button" onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">RFQ Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select Purchase Inquiry Ref (Optional)</label>
              <select
                value={selectedInquiryId}
                onChange={e => handleInquiryChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Direct RFQ / No Inquiry --</option>
                {inquiriesMaster.map(i => (
                  <option key={i._id} value={i._id}>
                    {i.inquiryNumber} (Requested by {i.requestedBy})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">RFQ Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Rfq['status'])}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Supplier Multi-Select check grid */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1">
              <Users size={16} className="text-slate-400" /> Select Suppliers to Bid *
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-150 max-h-40 overflow-y-auto">
              {suppliersMaster.length === 0 ? (
                <p className="text-xs text-slate-400 col-span-full">No active suppliers found in system. Please register suppliers first.</p>
              ) : (
                suppliersMaster.map(s => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => handleToggleSupplier(s._id)}
                    className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-left text-xs font-semibold hover:bg-slate-50"
                  >
                    {selectedSupplierIds.includes(s._id) ? (
                      <CheckSquare size={14} className="text-indigo-600" />
                    ) : (
                      <Square size={14} className="text-slate-400" />
                    )}
                    <div>
                      <p className="text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{s.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Line Items builder */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">RFQ Items List (Priceless)</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Item Details</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4">Qty</th>
                    <th className="py-2.5 px-4">UOM</th>
                    <th className="py-2.5 px-4">Specs / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                        No items added. Select a Purchase Inquiry or register items in inquiry.
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{it.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700">{it.sku}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="1"
                            value={it.qty}
                            onChange={e => {
                              const next = [...items];
                              next[idx].qty = Number(e.target.value) || 1;
                              setItems(next);
                            }}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center"
                          />
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{it.uom}</td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={it.description}
                            onChange={e => {
                              const next = [...items];
                              next[idx].description = e.target.value;
                              setItems(next);
                            }}
                            className="w-full max-w-sm px-2 py-1 border border-slate-200 rounded-lg text-xs"
                            placeholder="Add specs..."
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">RFQ Instructions / Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. Please submit pricing on or before 15th June..."
            />
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
              Save RFQ
            </button>
          </div>
        </form>
      )}

      {/* Detail View */}
      {view === 'detail' && activeRfq && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Request for Quotation Details</h2>
              <p className="text-xs text-slate-500 mt-1">RFQ Number: <span className="font-bold text-slate-700">{activeRfq.rfqNumber}</span></p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Back to List
              </button>
              {activeRfq.status === 'draft' && (
                <button
                  onClick={() => handleEdit(activeRfq)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
                >
                  Edit RFQ
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-sm">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">RFQ Date</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{new Date(activeRfq.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Source Inquiry</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{activeRfq.inquiry?.inquiryNumber || 'Direct'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${getStatusStyle(activeRfq.status)}`}>
                {activeRfq.status}
              </span>
            </div>
          </div>

          {/* Supplier Grid Actions */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-800">Target Vendors & RFQ Dispatch</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRfq.suppliers?.map(s => (
                <div key={s._id} className="border border-slate-200 rounded-xl p-4 bg-white flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{s.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadRfqPdf(activeRfq, s)}
                      className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg"
                      title="Download RFQ Sheet (Priceless)"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => openEmailModal(activeRfq, s)}
                      className="p-2 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 rounded-lg"
                      title="Email RFQ Sheet to Supplier"
                    >
                      <Mail size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items Display */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Requested Items</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Item Details</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4">UOM</th>
                    <th className="py-2.5 px-4">Specs / Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {activeRfq.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{it.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">{it.sku}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{it.qty}</td>
                      <td className="py-3 px-4 text-slate-600">{it.uom}</td>
                      <td className="py-3 px-4 text-xs text-slate-500 italic">{it.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {activeRfq.notes && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">RFQ Instructions / Notes</h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-150">{activeRfq.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && emailSupplier && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <Mail size={18} /> Dispatch RFQ Email
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                <span className="font-semibold text-indigo-600">Attachment:</span>
                <span>RFQ_{activeRfq?.rfqNumber}_{emailSupplier.name.replace(/\s+/g, '_')}.pdf</span>
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
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-500/10"
              >
                {sendingEmail ? 'Sending...' : 'Send RFQ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
