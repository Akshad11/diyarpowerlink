import React, { useEffect, useState } from 'react';
import { api } from './api';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileQuestion,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  ArrowRight,
  ClipboardList,
  FileSignature
} from 'lucide-react';

interface ItemMaster {
  _id: string;
  name: string;
  sku: string;
  uom?: { name: string; code: string };
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
  date: string;
  requestedBy: string;
  items: InquiryItem[];
  status: 'draft' | 'rfq_created' | 'completed' | 'cancelled';
  remarks?: string;
  createdAt: string;
}

export const AdminInquiries = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [itemsMaster, setItemsMaster] = useState<ItemMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // View state: 'list' | 'form' | 'detail'
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);

  // Inquiry Form states
  const [requestedBy, setRequestedBy] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<Inquiry['status']>('draft');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<InquiryItem[]>([]);

  // Add Item Temp state
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | ''>('');
  const [addQty, setAddQty] = useState(1);
  const [addDescription, setAddDescription] = useState('');

  useEffect(() => {
    fetchInquiriesAndMaster();
  }, []);

  const fetchInquiriesAndMaster = async () => {
    setLoading(true);
    try {
      const [inqData, itemsData] = await Promise.all([
        api.list('procurement/inquiries'),
        api.list('crm/items')
      ]);
      setInquiries(inqData);
      setItemsMaster(itemsData);
    } catch (err: any) {
      setError('Failed to fetch inquiries or items master');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setActiveInquiry(null);
    setRequestedBy('');
    setDate(new Date().toISOString().substring(0, 10));
    setStatus('draft');
    setRemarks('');
    setItems([]);
    setSelectedItemIndex('');
    setAddQty(1);
    setAddDescription('');
    setView('form');
  };

  const handleEdit = (inq: Inquiry) => {
    setActiveInquiry(inq);
    setRequestedBy(inq.requestedBy || '');
    setDate(new Date(inq.date).toISOString().substring(0, 10));
    setStatus(inq.status || 'draft');
    setRemarks(inq.remarks || '');
    setItems(inq.items || []);
    setSelectedItemIndex('');
    setAddQty(1);
    setAddDescription('');
    setView('form');
  };

  const handleViewDetail = (inq: Inquiry) => {
    setActiveInquiry(inq);
    setView('detail');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await api.remove('procurement/inquiries', id);
      setInquiries(inquiries.filter(i => i._id !== id));
      if (activeInquiry?._id === id) setActiveInquiry(null);
      setView('list');
    } catch (err) {
      setError('Failed to delete inquiry');
    }
  };

  const handleAddItem = () => {
    if (selectedItemIndex === '') return;
    const master = itemsMaster[selectedItemIndex];
    
    // Check if item already exists in line items
    const existsIdx = items.findIndex(it => it.itemId === master._id);
    if (existsIdx > -1) {
      const updated = [...items];
      updated[existsIdx].qty += addQty;
      if (addDescription) {
        updated[existsIdx].description += ` ${addDescription}`;
      }
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          itemId: master._id,
          name: master.name,
          sku: master.sku,
          qty: addQty,
          uom: master.uom?.code || 'PCS',
          description: addDescription
        }
      ]);
    }
    setSelectedItemIndex('');
    setAddQty(1);
    setAddDescription('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleUpdateItemQty = (idx: number, qty: number) => {
    const updated = [...items];
    updated[idx].qty = qty;
    setItems(updated);
  };

  const handleUpdateItemDesc = (idx: number, desc: string) => {
    const updated = [...items];
    updated[idx].description = desc;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item.');
      return;
    }

    const payload = {
      requestedBy: requestedBy.trim(),
      date: new Date(date).toISOString(),
      status,
      remarks: remarks.trim(),
      items
    };

    try {
      if (activeInquiry) {
        const updated = await api.update('procurement/inquiries', activeInquiry._id, payload);
        setInquiries(inquiries.map(i => i._id === activeInquiry._id ? updated : i));
        setActiveInquiry(updated);
      } else {
        const created = await api.create('procurement/inquiries', payload);
        setInquiries([created, ...inquiries]);
        setActiveInquiry(created);
      }
      setView('detail');
    } catch (err: any) {
      setError(err.message || 'Error saving inquiry');
    }
  };

  const handleConvertToRfq = (inq: Inquiry) => {
    // Navigate to RFQ creation and prefill inquiry
    navigateWithInquiry(inq);
  };

  // Simple event emitter simulation via sessionStorage / state passing
  const navigateWithInquiry = (inq: Inquiry) => {
    sessionStorage.setItem('prefill_inquiry_rfq', JSON.stringify(inq));
    navigate('/procurement/rfqs');
  };

  const getStatusStyle = (st: Inquiry['status']) => {
    switch (st) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'rfq_created': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
    }
  };

  const filtered = inquiries.filter(i =>
    i.inquiryNumber.toLowerCase().includes(search.toLowerCase()) ||
    (i.requestedBy || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Inquiries</h1>
          <p className="text-sm text-slate-500">Log and compile internal corporate purchase requirements and material requests.</p>
        </div>
        {view === 'list' && (
          <button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-indigo-500/10"
          >
            <Plus size={16} /> Create Inquiry
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Main Content Area */}
      {view === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by inquiry number..."
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
                  <th className="py-3.5 px-6">Inquiry No</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Requested By</th>
                  <th className="py-3.5 px-6">Items Count</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading inquiries...' : 'No inquiries logged yet.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(i => (
                    <tr key={i._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                        <FileQuestion size={16} className="text-slate-400" />
                        <button
                          onClick={() => handleViewDetail(i)}
                          className="hover:underline text-indigo-600 font-bold"
                        >
                          {i.inquiryNumber}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {new Date(i.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-slate-900 font-medium">
                        {i.requestedBy}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">
                        {i.items?.length || 0}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(i.status)}`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-3">
                        <button
                          onClick={() => handleViewDetail(i)}
                          className="text-slate-600 hover:text-indigo-600 font-semibold text-xs"
                        >
                          View
                        </button>
                        {i.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleEdit(i)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(i._id)}
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

      {view === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {activeInquiry ? `Edit Inquiry: ${activeInquiry.inquiryNumber}` : 'Draft Purchase Inquiry'}
            </h2>
            <button type="button" onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Requested By *</label>
              <input
                type="text"
                required
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Request Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Inquiry Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Inquiry['status'])}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="rfq_created">RFQ Created</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Item compiler table */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Requested Items List</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <th className="pb-2 pl-1">Item Detail</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">UOM</th>
                    <th className="pb-2">Specifications / Notes</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((it, idx) => (
                    <tr key={idx} className="align-middle">
                      <td className="py-3 pl-1">
                        <div className="font-semibold text-slate-800">{it.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{it.sku}</div>
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
                      <td className="py-3 text-slate-600 font-semibold">{it.uom}</td>
                      <td className="py-3">
                        <input
                          type="text"
                          value={it.description}
                          onChange={e => handleUpdateItemDesc(idx, e.target.value)}
                          className="w-full max-w-sm px-2 py-1 border border-slate-200 rounded-lg text-sm"
                          placeholder="e.g. Model XYZ, Grade-A finish"
                        />
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
                    <td className="py-3 text-slate-400 text-xs">
                      {selectedItemIndex !== '' ? itemsMaster[selectedItemIndex]?.uom?.code || 'PCS' : '-'}
                    </td>
                    <td className="py-3">
                      <input
                        type="text"
                        placeholder="Specifications or target specs"
                        value={addDescription}
                        onChange={e => setAddDescription(e.target.value)}
                        className="w-full max-w-sm px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={selectedItemIndex === ''}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-3 py-1 rounded-lg text-xs font-semibold"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks / Internal Comments</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. Items required for Diyar project expansion..."
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
              Save Inquiry
            </button>
          </div>
        </form>
      )}

      {view === 'detail' && activeInquiry && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Purchase Inquiry Details</h2>
              <p className="text-xs text-slate-500 mt-1">Inquiry Number: <span className="font-bold text-slate-700">{activeInquiry.inquiryNumber}</span></p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Back to List
              </button>
              {activeInquiry.status === 'draft' && (
                <>
                  <button
                    onClick={() => handleEdit(activeInquiry)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    Edit Draft
                  </button>
                  <button
                    onClick={() => handleConvertToRfq(activeInquiry)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <FileSignature size={15} /> Create RFQ
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Requested By</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{activeInquiry.requestedBy}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Request Date</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{new Date(activeInquiry.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${getStatusStyle(activeInquiry.status)}`}>
                {activeInquiry.status}
              </span>
            </div>
          </div>

          {/* Items display list */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Items Requested</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Item Details</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4">UOM</th>
                    <th className="py-2.5 px-4">Specs / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {activeInquiry.items?.map((it, idx) => (
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

          {activeInquiry.remarks && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Comments / Remarks</h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-150">{activeInquiry.remarks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Prefill event listener helper wrapper (if window is not defined, safe-guard it)
const navigateToUrl = (hash: string) => {
  window.location.hash = hash;
};
