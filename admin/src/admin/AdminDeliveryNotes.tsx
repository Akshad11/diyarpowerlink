import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from './api';
import { generateCrmPdf } from './generateCrmPdf';
import {
  Plus,
  Search,
  Download,
  X,
  ChevronRight,
  Trash2,
  CheckCircle2,
  FileText,
  MapPin
} from 'lucide-react';

interface CustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  gstPan?: string;
  billingAddress?: CustomerAddress;
  shippingAddress?: CustomerAddress;
}

interface DeliveryNoteItem {
  itemId: string;
  name: string;
  sku: string;
  qty: number;
  uom: string;
  remarks: string;
}

interface DeliveryNote {
  _id: string;
  deliveryNoteNumber: string;
  customer: Customer;
  salesOrder?: any;
  salesInvoice?: any;
  date: string;
  status: 'draft' | 'dispatched' | 'delivered' | 'cancelled';
  items: DeliveryNoteItem[];
  notes: string;
  shippingAddress: CustomerAddress;
}

export const AdminDeliveryNotes = () => {
  const location = useLocation();

  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [itemsMaster, setItemsMaster] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Views: 'list' | 'form' | 'detail'
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [activeNote, setActiveNote] = useState<DeliveryNote | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [linkedOrderId, setLinkedOrderId] = useState('');
  const [linkedInvoiceId, setLinkedInvoiceId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [status, setStatus] = useState<DeliveryNote['status']>('draft');
  const [notes, setNotes] = useState('');
  const [shippingAddress, setShippingAddress] = useState<CustomerAddress>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });
  const [items, setItems] = useState<DeliveryNoteItem[]>([]);

  // Item additions row
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | ''>('');
  const [addQty, setAddQty] = useState(1);
  const [addRemarks, setAddRemarks] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dnData, custData, soData, invData, itemData, settingsData] = await Promise.all([
        api.list('crm/delivery-notes'),
        api.list('crm/customers'),
        api.list('crm/sales-orders'),
        api.list('crm/sales-invoices'),
        api.list('crm/items'),
        api.list('settings').catch(() => ({}))
      ]);
      setDeliveryNotes(dnData);
      setCustomers(custData);
      setSalesOrders(soData);
      setSalesInvoices(invData);
      setItemsMaster(itemData);
      setSettings(settingsData);
    } catch (err: any) {
      setError('Failed to fetch Delivery Notes data');
    } finally {
      setLoading(false);
    }
  };

  // Prefill check on load/mount
  useEffect(() => {
    if (location.state?.prefillCustomerId && customers.length > 0) {
      handleNew();
      setCustomerId(location.state.prefillCustomerId);
      // Auto-prefill address if customer exists
      const cust = customers.find(c => c._id === location.state.prefillCustomerId);
      if (cust?.shippingAddress) {
        setShippingAddress(cust.shippingAddress);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, customers]);

  const handleNew = () => {
    setActiveNote(null);
    setCustomerId(customers[0]?._id || '');
    setLinkedOrderId('');
    setLinkedInvoiceId('');
    setDate(new Date().toISOString().substring(0, 10));
    setStatus('draft');
    setNotes('');
    setShippingAddress({ street: '', city: '', state: '', zip: '', country: '' });
    setItems([]);
    setSelectedItemIndex('');
    setAddQty(1);
    setAddRemarks('');
    setView('form');
  };

  const handleEdit = (dn: DeliveryNote) => {
    setActiveNote(dn);
    setCustomerId(dn.customer?._id || '');
    setLinkedOrderId(dn.salesOrder?._id || dn.salesOrder || '');
    setLinkedInvoiceId(dn.salesInvoice?._id || dn.salesInvoice || '');
    setDate(new Date(dn.date).toISOString().substring(0, 10));
    setStatus(dn.status);
    setNotes(dn.notes || '');
    setShippingAddress(dn.shippingAddress || { street: '', city: '', state: '', zip: '', country: '' });
    setItems(dn.items || []);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery note?')) return;
    try {
      await api.remove('crm/delivery-notes', id);
      setDeliveryNotes(deliveryNotes.filter(dn => dn._id !== id));
      if (activeNote?._id === id) setActiveNote(null);
      setView('list');
    } catch (err) {
      setError('Failed to delete delivery note');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: DeliveryNote['status']) => {
    try {
      const updated = await api.update('crm/delivery-notes', id, { status: newStatus });
      setDeliveryNotes(deliveryNotes.map(dn => dn._id === id ? updated : dn));
      if (activeNote?._id === id) setActiveNote(updated);
    } catch (err) {
      setError('Error updating delivery note status');
    }
  };

  const handleCustomerChange = (cid: string) => {
    setCustomerId(cid);
    setLinkedOrderId('');
    setLinkedInvoiceId('');
    const cust = customers.find(c => c._id === cid);
    if (cust?.shippingAddress) {
      setShippingAddress(cust.shippingAddress);
    } else {
      setShippingAddress({ street: '', city: '', state: '', zip: '', country: '' });
    }
  };

  const handleLinkOrderChange = (soId: string) => {
    setLinkedOrderId(soId);
    setLinkedInvoiceId('');
    if (!soId) return;

    const order = salesOrders.find(o => o._id === soId);
    if (order) {
      // Prefill items
      const mappedItems = order.items.map((it: any) => ({
        itemId: it.itemId?._id || it.itemId,
        name: it.name,
        sku: it.sku,
        qty: it.qty,
        uom: it.uom,
        remarks: ''
      }));
      setItems(mappedItems);

      // Prefill address if available
      if (order.customer?.shippingAddress) {
        setShippingAddress(order.customer.shippingAddress);
      }
    }
  };

  const handleLinkInvoiceChange = (invId: string) => {
    setLinkedInvoiceId(invId);
    setLinkedOrderId('');
    if (!invId) return;

    const invoice = salesInvoices.find(i => i._id === invId);
    if (invoice) {
      // Prefill items
      const mappedItems = invoice.items.map((it: any) => ({
        itemId: it.itemId?._id || it.itemId,
        name: it.name,
        sku: it.sku,
        qty: it.qty,
        uom: it.uom,
        remarks: ''
      }));
      setItems(mappedItems);

      // Prefill address if available
      if (invoice.customer?.shippingAddress) {
        setShippingAddress(invoice.customer.shippingAddress);
      }
    }
  };

  const handleAddItem = () => {
    if (selectedItemIndex === '') return;
    const masterItem = itemsMaster[selectedItemIndex];
    if (!masterItem) return;

    // Check if item already exists
    const existingIdx = items.findIndex(it => it.itemId === masterItem._id);
    if (existingIdx > -1) {
      const updated = [...items];
      updated[existingIdx].qty += addQty;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          itemId: masterItem._id,
          name: masterItem.name,
          sku: masterItem.sku,
          qty: addQty,
          uom: masterItem.uom?.name || 'Pcs',
          remarks: addRemarks
        }
      ]);
    }

    setSelectedItemIndex('');
    setAddQty(1);
    setAddRemarks('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    setItems(items.map((it, i) => i === index ? { ...it, qty } : it));
  };

  const handleUpdateItemRemarks = (index: number, remarks: string) => {
    setItems(items.map((it, i) => i === index ? { ...it, remarks } : it));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) {
      setError('Please select a customer and add at least one item');
      return;
    }

    const payload = {
      customer: customerId,
      salesOrder: linkedOrderId || null,
      salesInvoice: linkedInvoiceId || null,
      date,
      status,
      items,
      notes,
      shippingAddress
    };

    try {
      if (activeNote) {
        const updated = await api.update('crm/delivery-notes', activeNote._id, payload);
        setDeliveryNotes(deliveryNotes.map(dn => dn._id === activeNote._id ? updated : dn));
        setActiveNote(updated);
      } else {
        const created = await api.create('crm/delivery-notes', payload);
        setDeliveryNotes([created, ...deliveryNotes]);
        setActiveNote(created);
      }
      setView('detail');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save delivery note');
    }
  };

  const handleDownloadPdf = async (dn: DeliveryNote) => {
    // Generate base64/url-friendly helper function
    const getBase64ImageFromUrl = async (url: string): Promise<string | null> => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return null;
      }
    };

    const doc = await generateCrmPdf(
      'Delivery Note',
      dn.deliveryNoteNumber,
      new Date(dn.date).toLocaleDateString(),
      '',
      dn.customer,
      dn.items,
      { notes: dn.notes },
      settings
    );
    doc.save(`DeliveryNote_${dn.deliveryNoteNumber}.pdf`);
  };

  const filteredNotes = deliveryNotes.filter(dn => {
    if (!dn) return false;
    return (
      (dn.deliveryNoteNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (dn.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (dn.status || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatusStyle = (s: DeliveryNote['status']) => {
    switch (s) {
      case 'draft': return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'dispatched': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const currentCustomerOrders = salesOrders.filter(o => o.customer?._id === customerId);
  const currentCustomerInvoices = salesInvoices.filter(i => i.customer?._id === customerId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Notes</h1>
          <p className="text-sm text-slate-500 font-medium">Generate dispatch packing lists, tracking documents, and shipping slips.</p>
        </div>
        {view === 'list' && (
          <button
            onClick={handleNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-blue-500/10"
          >
            <Plus size={16} /> New Delivery Note
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
                placeholder="Search delivery notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3.5 px-6">Note Number</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Linked Doc</th>
                  <th className="py-3.5 px-6">Items Count</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredNotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading...' : 'No delivery notes found'}
                    </td>
                  </tr>
                ) : (
                  filteredNotes.map(dn => (
                    <tr key={dn._id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => { setActiveNote(dn); setView('detail'); }}>
                      <td className="py-4 px-6 font-semibold text-slate-900">{dn.deliveryNoteNumber}</td>
                      <td className="py-4 px-6 text-slate-600">{new Date(dn.date).toLocaleDateString()}</td>
                      <td className="py-4 px-6 font-medium text-slate-800">{dn.customer?.name}</td>
                      <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                        {dn.salesOrder?.salesOrderNumber || dn.salesInvoice?.invoiceNumber || 'Scratch'}
                      </td>
                      <td className="py-4 px-6 text-slate-600">{dn.items?.length || 0} items</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusStyle(dn.status)}`}>
                          {dn.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDownloadPdf(dn)}
                          className="text-slate-600 hover:text-blue-600 transition-colors p-1"
                          title="Print Packing Slip"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(dn._id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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
      {view === 'detail' && activeNote && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                &larr; Back
              </button>
              <div className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase">Status:</span>
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusStyle(activeNote.status)}`}>
                  {activeNote.status}
                </span>
              </div>

              {activeNote.status === 'draft' && (
                <button
                  onClick={() => handleUpdateStatus(activeNote._id, 'dispatched')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 size={13} /> Dispatch Shipment
                </button>
              )}
              {activeNote.status === 'dispatched' && (
                <button
                  onClick={() => handleUpdateStatus(activeNote._id, 'delivered')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 size={13} /> Mark Delivered
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDownloadPdf(activeNote)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Download size={14} /> Download slip
              </button>
              <button
                onClick={() => handleEdit(activeNote)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Edit Details
              </button>
              {activeNote.status !== 'cancelled' && (
                <button
                  onClick={() => handleUpdateStatus(activeNote._id, 'cancelled')}
                  className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl"
                >
                  Void Slip
                </button>
              )}
              <button
                onClick={() => handleDelete(activeNote._id)}
                className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{settings?.websiteName || 'Diyar Power Link LLP'}</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">{settings?.contactAddress}</p>
                <p className="text-xs text-slate-500">Phone: {settings?.contactPhone} | Email: {settings?.contactEmail}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Delivery Note</span>
                <span className="text-xl font-mono font-bold text-slate-900 block mt-1">{activeNote.deliveryNoteNumber}</span>
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  <p>Date: {new Date(activeNote.date).toLocaleDateString()}</p>
                  {activeNote.salesOrder && (
                    <p className="font-mono text-slate-600">Order Ref: {activeNote.salesOrder?.salesOrderNumber || activeNote.salesOrder}</p>
                  )}
                  {activeNote.salesInvoice && (
                    <p className="font-mono text-slate-600">Invoice Ref: {activeNote.salesInvoice?.invoiceNumber || activeNote.salesInvoice}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Columns */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Customer Details</span>
                <div className="text-xs text-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900">{activeNote.customer?.name}</p>
                  {activeNote.customer?.gstPan && <p className="font-mono text-slate-600">GST: {activeNote.customer.gstPan}</p>}
                  {activeNote.customer?.phone && <p>Phone: {activeNote.customer.phone}</p>}
                  {activeNote.customer?.email && <p>Email: {activeNote.customer.email}</p>}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Delivery Address</span>
                <div className="text-xs text-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900">{activeNote.customer?.name}</p>
                  {activeNote.shippingAddress?.street ? (
                    <>
                      <p>{activeNote.shippingAddress.street}</p>
                      <p>{activeNote.shippingAddress.city}, {activeNote.shippingAddress.state} - {activeNote.shippingAddress.zip}</p>
                      <p>{activeNote.shippingAddress.country}</p>
                    </>
                  ) : (
                    <p className="text-slate-400">No Shipping Address</p>
                  )}
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
                    <th className="pb-3 text-center">Qty Shipped</th>
                    <th className="pb-3">UOM</th>
                    <th className="pb-3 pl-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeNote.items?.map((it, idx) => (
                    <tr key={idx} className="align-middle">
                      <td className="py-3 pl-1 text-slate-500">{idx + 1}</td>
                      <td className="py-3 font-semibold text-slate-800">{it.name}</td>
                      <td className="py-3 font-mono text-slate-600">{it.sku}</td>
                      <td className="py-3 text-center text-slate-800 font-semibold">{it.qty}</td>
                      <td className="py-3 text-slate-600">{it.uom}</td>
                      <td className="py-3 pl-4 text-slate-500 italic">{it.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes footer */}
            {activeNote.notes && (
              <div className="border-t border-slate-100 pt-6 text-xs text-slate-500">
                <p className="font-bold text-slate-700 mb-1">Notes / Terms:</p>
                <p className="whitespace-pre-line">{activeNote.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM VIEW */}
      {view === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {activeNote ? `Edit Delivery Note: ${activeNote.deliveryNoteNumber}` : 'Create Delivery Note'}
            </h2>
            <button type="button" onClick={() => setView(activeNote ? 'detail' : 'list')} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Customer *</label>
              <select
                required
                value={customerId}
                onChange={e => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Link Sales Order (Optional)</label>
              <select
                disabled={!customerId}
                value={linkedOrderId}
                onChange={e => handleLinkOrderChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
              >
                <option value="">-- None (Scratch) --</option>
                {currentCustomerOrders.map(o => (
                  <option key={o._id} value={o._id}>{o.salesOrderNumber} ({new Date(o.date).toLocaleDateString()})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Link Sales Invoice (Optional)</label>
              <select
                disabled={!customerId}
                value={linkedInvoiceId}
                onChange={e => handleLinkInvoiceChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
              >
                <option value="">-- None (Scratch) --</option>
                {currentCustomerInvoices.map(i => (
                  <option key={i._id} value={i._id}>{i.invoiceNumber} ({new Date(i.date).toLocaleDateString()})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Dispatch Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="draft">Draft</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Shipping Address fields */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1">
              <MapPin size={16} className="text-slate-400" /> Shipping Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs text-slate-500 mb-1">Street Address</label>
                <input
                  type="text"
                  value={shippingAddress.street || ''}
                  onChange={e => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">City</label>
                <input
                  type="text"
                  value={shippingAddress.city || ''}
                  onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">State / Province</label>
                <input
                  type="text"
                  value={shippingAddress.state || ''}
                  onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Zip / Postal Code</label>
                <input
                  type="text"
                  value={shippingAddress.zip || ''}
                  onChange={e => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Country</label>
                <input
                  type="text"
                  value={shippingAddress.country || ''}
                  onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Item addition table */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-700">Line Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <th className="pb-2 pl-1">Item Details</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">UOM</th>
                    <th className="pb-2">Remarks</th>
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
                      <td className="py-3 text-slate-600">{it.uom}</td>
                      <td className="py-3 pr-2">
                        <input
                          type="text"
                          placeholder="Line notes/remarks"
                          value={it.remarks || ''}
                          onChange={e => handleUpdateItemRemarks(idx, e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Addition Line Row */}
                  <tr className="bg-slate-50/50">
                    <td className="py-3 pl-1">
                      <select
                        value={selectedItemIndex}
                        onChange={e => setSelectedItemIndex(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full max-w-xs px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                      >
                        <option value="">-- Choose Item --</option>
                        {itemsMaster.map((item, idx) => (
                          <option key={item._id} value={idx}>{item.name} [{item.sku}]</option>
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
                      {selectedItemIndex !== '' ? `${itemsMaster[selectedItemIndex]?.uom?.name || 'Pcs'}` : '-'}
                    </td>
                    <td className="py-3 pr-2">
                      <input
                        type="text"
                        placeholder="Remarks"
                        value={addRemarks}
                        onChange={e => setAddRemarks(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={selectedItemIndex === ''}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-3 py-1 rounded-lg text-xs font-semibold"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">General Notes & Delivery Terms</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="E.g., Dispatched via BlueDart AWB #987261."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setView(activeNote ? 'detail' : 'list')}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm"
            >
              Save Delivery Note
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
