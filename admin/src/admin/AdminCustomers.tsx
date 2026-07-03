import React, { useEffect, useState } from 'react';
import { api } from './api';
import { useNavigate } from 'react-router-dom';
import { generateCrmPdf } from './generateCrmPdf';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  CheckSquare,
  Square,
  X,
  FileText,
  TrendingUp,
  Receipt,
  Truck,
  Download,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  gstPan: string;
  billingAddress: Address;
  shippingAddress: Address;
  status: 'active' | 'inactive';
}

const defaultAddress = (): Address => ({
  street: '',
  city: '',
  state: '',
  zip: '',
  country: ''
});

export const AdminCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<any>({});

  // Layout View: 'list' | 'form' | 'detail'
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstPan, setGstPan] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [billing, setBilling] = useState<Address>(defaultAddress());
  const [shipping, setShipping] = useState<Address>(defaultAddress());
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);

  // Details Tab states
  const [activeTab, setActiveTab] = useState<'Quotations' | 'Orders' | 'Invoices' | 'Delivery Notes'>('Quotations');
  const [customerQuotations, setCustomerQuotations] = useState<any[]>([]);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [customerDeliveryNotes, setCustomerDeliveryNotes] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Email modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailDoc, setEmailDoc] = useState<any>(null);
  const [emailDocType, setEmailDocType] = useState<'Quotation' | 'Invoice'>('Quotation');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const [custData, settingsData] = await Promise.all([
        api.list('crm/customers'),
        api.list('settings').catch(() => ({}))
      ]);
      setCustomers(custData);
      setSettings(settingsData);
    } catch (err: any) {
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerTransactions = async (customerId: string) => {
    setLoadingTransactions(true);
    try {
      const [quots, orders, invs, dns] = await Promise.all([
        api.list('crm/quotations').catch(() => []),
        api.list('crm/sales-orders').catch(() => []),
        api.list('crm/sales-invoices').catch(() => []),
        api.list('crm/delivery-notes').catch(() => [])
      ]);
      setCustomerQuotations(quots.filter((q: any) => (q.customer?._id || q.customer) === customerId));
      setCustomerOrders(orders.filter((o: any) => (o.customer?._id || o.customer) === customerId));
      setCustomerInvoices(invs.filter((i: any) => (i.customer?._id || i.customer) === customerId));
      setCustomerDeliveryNotes(dns.filter((d: any) => (d.customer?._id || d.customer) === customerId));
    } catch (err) {
      console.error('Error loading customer transaction details:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setActiveCustomer(customer);
    setName(customer.name);
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setGstPan(customer.gstPan || '');
    setStatus(customer.status || 'active');
    setBilling(customer.billingAddress || defaultAddress());
    setShipping(customer.shippingAddress || defaultAddress());
    const billingStr = JSON.stringify(customer.billingAddress || {});
    const shippingStr = JSON.stringify(customer.shippingAddress || {});
    setShippingSameAsBilling(billingStr === shippingStr);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.remove('crm/customers', id);
      setCustomers(customers.filter(c => c._id !== id));
      if (activeCustomer?._id === id) {
        setActiveCustomer(null);
        setView('list');
      }
    } catch (err: any) {
      setError('Error deleting customer');
    }
  };

  const handleNew = () => {
    setActiveCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setGstPan('');
    setStatus('active');
    setBilling(defaultAddress());
    setShipping(defaultAddress());
    setShippingSameAsBilling(true);
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalShipping = shippingSameAsBilling ? { ...billing } : { ...shipping };
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gstPan: gstPan.trim().toUpperCase(),
      status,
      billingAddress: billing,
      shippingAddress: finalShipping
    };

    try {
      if (activeCustomer) {
        const updated = await api.update('crm/customers', activeCustomer._id, payload);
        setCustomers(customers.map(c => c._id === activeCustomer._id ? updated : c));
        setActiveCustomer(updated);
        setView('detail');
      } else {
        const created = await api.create('crm/customers', payload);
        setCustomers([created, ...customers]);
        setActiveCustomer(created);
        setView('detail');
      }
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error saving customer');
    }
  };

  const downloadQuotationPdf = async (q: any) => {
    const doc = await generateCrmPdf('Quotation', q.quotationNumber, new Date(q.date).toLocaleDateString(), q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '', activeCustomer!, q.items, q, settings);
    doc.save(`Quotation_${q.quotationNumber}.pdf`);
  };

  const downloadSalesOrderPdf = async (so: any) => {
    const doc = await generateCrmPdf('Sales Order', so.salesOrderNumber, new Date(so.date).toLocaleDateString(), '', activeCustomer!, so.items, so, settings);
    doc.save(`SalesOrder_${so.salesOrderNumber}.pdf`);
  };

  const downloadInvoicePdf = async (inv: any) => {
    const doc = await generateCrmPdf('Invoice', inv.invoiceNumber, new Date(inv.date).toLocaleDateString(), inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '', activeCustomer!, inv.items, inv, settings);
    doc.save(`Invoice_${inv.invoiceNumber}.pdf`);
  };

  const downloadDeliveryNotePdf = async (dn: any) => {
    const doc = await generateCrmPdf('Delivery Note', dn.deliveryNoteNumber, new Date(dn.date).toLocaleDateString(), '', activeCustomer!, dn.items, { notes: dn.notes }, settings);
    doc.save(`DeliveryNote_${dn.deliveryNoteNumber}.pdf`);
  };

  const openEmailModal = (doc: any, type: 'Quotation' | 'Invoice') => {
    setEmailDoc(doc);
    setEmailDocType(type);
    setEmailTo(activeCustomer?.email || '');
    const num = type === 'Quotation' ? doc.quotationNumber : doc.invoiceNumber;
    setEmailSubject(`${type} ${num} from ${settings?.websiteName || 'Diyar Power Link LLP'}`);
    setEmailBody(`<p>Dear ${activeCustomer?.name},</p><p>Please find attached our ${type.toLowerCase()} <strong>${num}</strong> for your record.</p><br/><p>Thank you for your business!</p><br/><p>Best Regards,</p><p><strong>${settings?.websiteName || 'Diyar Power Link LLP'}</strong></p>`);
    setEmailSuccess('');
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailDoc) return;
    setSendingEmail(true);
    setEmailSuccess('');
    try {
      let doc;
      if (emailDocType === 'Quotation') {
        doc = await generateCrmPdf('Quotation', emailDoc.quotationNumber, new Date(emailDoc.date).toLocaleDateString(), emailDoc.validUntil ? new Date(emailDoc.validUntil).toLocaleDateString() : '', activeCustomer!, emailDoc.items, emailDoc, settings);
      } else {
        doc = await generateCrmPdf('Invoice', emailDoc.invoiceNumber, new Date(emailDoc.date).toLocaleDateString(), emailDoc.dueDate ? new Date(emailDoc.dueDate).toLocaleDateString() : '', activeCustomer!, emailDoc.items, emailDoc, settings);
      }
      const base64 = doc.output('datauristring').split(',')[1];
      const filename = emailDocType === 'Quotation' ? `Quotation_${emailDoc.quotationNumber}.pdf` : `Invoice_${emailDoc.invoiceNumber}.pdf`;
      await api.sendCrmEmail({ to: emailTo, subject: emailSubject, body: emailBody, pdfBase64: base64, filename });
      setEmailSuccess('Email sent successfully!');
      setTimeout(() => setShowEmailModal(false), 1500);
    } catch (err: any) {
      setError('Failed to dispatch email');
    } finally {
      setSendingEmail(false);
    }
  };

  const filtered = customers.filter(c => {
    if (!c) return false;
    return (
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search) ||
      (c.gstPan || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  // Transactions arrays are already stored in component state variables
  // (customerQuotations, customerOrders, customerInvoices, customerDeliveryNotes)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Master</h1>
          <p className="text-sm text-slate-500">Manage business client records, GST details, billing & shipping addresses.</p>
        </div>
        {view === 'list' && (
          <button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-blue-500/10">
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {/* 2. LIST VIEW */}
      {view === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header toolbar */}
          <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3.5 px-6">Company/Customer</th>
                  <th className="py-3.5 px-6">Contact Info</th>
                  <th className="py-3.5 px-6">GST / PAN</th>
                  <th className="py-3.5 px-6">Address</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading customers...' : 'No customers found'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50/50">
                      <td
                        className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => {
                          setActiveCustomer(c);
                          fetchCustomerTransactions(c._id);
                          setView('detail');
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                          {c.name.substring(0, 2)}
                        </div>
                        {c.name}
                      </td>
                      <td className="py-4 px-6 space-y-1">
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Mail size={12} className="text-slate-400" />
                            {c.email}
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone size={12} className="text-slate-400" />
                            {c.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-700">
                        {c.gstPan || '-'}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs max-w-xs truncate">
                        {c.billingAddress?.street ? (
                          <span>
                            {c.billingAddress.street}, {c.billingAddress.city}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-slate-600 hover:text-blue-600 transition-colors p-1"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="text-slate-400 hover:text-red-650 transition-colors p-1"
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

      {/* 3. FORM VIEW */}
      {view === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {activeCustomer ? `Edit Customer: ${activeCustomer.name}` : 'New Customer Record'}
            </h2>
            <button
              type="button"
              onClick={() => setView(activeCustomer ? 'detail' : 'list')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Company / Customer Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">GST / PAN Number</label>
              <input
                type="text"
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={gstPan}
                onChange={e => setGstPan(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Billing Address */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1">
                <MapPin size={16} className="text-slate-400" /> Billing Address
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Street Address</label>
                  <textarea
                    rows={2}
                    value={billing.street}
                    onChange={e => setBilling({ ...billing, street: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">City</label>
                    <input
                      type="text"
                      value={billing.city}
                      onChange={e => setBilling({ ...billing, city: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">State / Region</label>
                    <input
                      type="text"
                      value={billing.state}
                      onChange={e => setBilling({ ...billing, state: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Zip / Postal Code</label>
                    <input
                      type="text"
                      value={billing.zip}
                      onChange={e => setBilling({ ...billing, zip: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Country</label>
                    <input
                      type="text"
                      value={billing.country}
                      onChange={e => setBilling({ ...billing, country: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <MapPin size={16} className="text-slate-400" /> Shipping Address
                </h3>
                <button
                  type="button"
                  onClick={() => setShippingSameAsBilling(!shippingSameAsBilling)}
                  className="text-xs text-blue-600 font-semibold flex items-center gap-1"
                >
                  {shippingSameAsBilling ? <CheckSquare size={14} /> : <Square size={14} />}
                  Same as Billing
                </button>
              </div>

              {!shippingSameAsBilling && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Street Address</label>
                    <textarea
                      rows={2}
                      value={shipping.street}
                      onChange={e => setShipping({ ...shipping, street: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">City</label>
                      <input
                        type="text"
                        value={shipping.city}
                        onChange={e => setShipping({ ...shipping, city: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">State / Region</label>
                      <input
                        type="text"
                        value={shipping.state}
                        onChange={e => setShipping({ ...shipping, state: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Zip / Postal Code</label>
                      <input
                        type="text"
                        value={shipping.zip}
                        onChange={e => setShipping({ ...shipping, zip: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Country</label>
                      <input
                        type="text"
                        value={shipping.country}
                        onChange={e => setShipping({ ...shipping, country: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {shippingSameAsBilling && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 py-12">
                  Shipping address is linked to the billing address.
                </div>
              )}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/10"
            >
              Save Customer
            </button>
          </div>
        </form>
      )}

      {/* 3. DETAIL VIEW (Unified Tabs) */}
      {view === 'detail' && activeCustomer && (
        <div className="space-y-6">
          {/* Top customer detail profile */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg uppercase shadow-inner">
                  {activeCustomer.name.substring(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{activeCustomer.name}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 uppercase ${activeCustomer.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}`}>
                    {activeCustomer.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {activeCustomer.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Mail size={14} className="text-slate-400" />
                    <span>{activeCustomer.email}</span>
                  </div>
                )}
                {activeCustomer.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    <span>{activeCustomer.phone}</span>
                  </div>
                )}
                {activeCustomer.gstPan && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                    <UserCheck size={14} className="text-slate-400" />
                    <span>GST: {activeCustomer.gstPan}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 items-start justify-end">
              <button
                onClick={() => handleEdit(activeCustomer)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Edit Profile
              </button>
              <button
                onClick={() => handleDelete(activeCustomer._id)}
                className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Billing & Shipping Addresses display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1">
              <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider mb-2 text-[10px]">
                <MapPin size={13} className="text-slate-400" /> Billing Address
              </h4>
              {activeCustomer.billingAddress?.street ? (
                <>
                  <p className="text-slate-800 font-medium">{activeCustomer.billingAddress.street}</p>
                  <p className="text-slate-600">{activeCustomer.billingAddress.city}, {activeCustomer.billingAddress.state} - {activeCustomer.billingAddress.zip}</p>
                  <p className="text-slate-500">{activeCustomer.billingAddress.country}</p>
                </>
              ) : <p className="text-slate-400 italic">No Address Configured</p>}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1">
              <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider mb-2 text-[10px]">
                <MapPin size={13} className="text-slate-400" /> Shipping Destination Address
              </h4>
              {activeCustomer.shippingAddress?.street ? (
                <>
                  <p className="text-slate-800 font-medium">{activeCustomer.shippingAddress.street}</p>
                  <p className="text-slate-600">{activeCustomer.shippingAddress.city}, {activeCustomer.shippingAddress.state} - {activeCustomer.shippingAddress.zip}</p>
                  <p className="text-slate-500">{activeCustomer.shippingAddress.country}</p>
                </>
              ) : <p className="text-slate-400 italic">Same as Billing Address</p>}
            </div>
          </div>

          {/* Unified Transactions Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Tabs Header */}
            <div className="border-b border-slate-200 bg-slate-50/50 p-2 flex flex-wrap justify-between items-center gap-3">
              <div className="flex gap-1.5">
                {(['Quotations', 'Orders', 'Invoices', 'Delivery Notes'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Quick Creation shortcut based on active tab */}
              <div>
                {activeTab === 'Quotations' && (
                  <button
                    onClick={() => navigate('/crm/quotations')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus size={13} /> Create Quote
                  </button>
                )}
                {activeTab === 'Orders' && (
                  <button
                    onClick={() => navigate('/crm/sales-orders')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus size={13} /> Create Order
                  </button>
                )}
                {activeTab === 'Invoices' && (
                  <button
                    onClick={() => navigate('/crm/invoices')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus size={13} /> Create Invoice
                  </button>
                )}
                {activeTab === 'Delivery Notes' && (
                  <button
                    onClick={() => navigate('/crm/delivery-notes')}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus size={13} /> Create Delivery Note
                  </button>
                )}
              </div>
            </div>

            {/* Tabs Content */}
            <div className="p-4">
              {loadingTransactions ? (
                <div className="text-center py-8 text-slate-500 text-xs">Loading transaction logs...</div>
              ) : (
                <>
                  {/* QUOTATIONS TAB CONTENT */}
                  {activeTab === 'Quotations' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase pb-2">
                            <th className="pb-2">Quote No</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Valid Until</th>
                            <th className="pb-2">Total Amount</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {customerQuotations.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">No quotes found for this client.</td>
                            </tr>
                          ) : (
                            customerQuotations.map(q => (
                              <tr key={q._id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-mono font-bold text-blue-600">{q.quotationNumber}</td>
                                <td className="py-3 text-slate-500">{new Date(q.date).toLocaleDateString()}</td>
                                <td className="py-3 text-slate-500">{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '-'}</td>
                                <td className="py-3 font-bold text-slate-800">₹{(q.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="py-3">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                    {q.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right space-x-2">
                                  <button
                                    onClick={() => openEmailModal(q, 'Quotation')}
                                    title="Email Quotation"
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <Mail size={14} />
                                  </button>
                                  <button
                                    onClick={() => downloadQuotationPdf(q)}
                                    title="Download PDF"
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    onClick={() => navigate('/crm/quotations')}
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SALES ORDERS TAB CONTENT */}
                  {activeTab === 'Orders' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase pb-2">
                            <th className="pb-2">Order No</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Total Amount</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {customerOrders.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No orders found for this client.</td>
                            </tr>
                          ) : (
                            customerOrders.map(o => (
                              <tr key={o._id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-mono font-bold text-blue-600">{o.salesOrderNumber}</td>
                                <td className="py-3 text-slate-500">{new Date(o.date).toLocaleDateString()}</td>
                                <td className="py-3 font-bold text-slate-800">₹{(o.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="py-3">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                                    {o.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right space-x-2">
                                  <button
                                    onClick={() => downloadSalesOrderPdf(o)}
                                    title="Download PDF"
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    onClick={() => navigate('/crm/sales-orders')}
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* INVOICES TAB CONTENT */}
                  {activeTab === 'Invoices' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase pb-2">
                            <th className="pb-2">Invoice No</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Due Date</th>
                            <th className="pb-2">Total Amount</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {customerInvoices.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">No billing invoices found.</td>
                            </tr>
                          ) : (
                            customerInvoices.map(inv => (
                              <tr key={inv._id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                                <td className="py-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                                <td className="py-3 text-slate-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Immediate'}</td>
                                <td className="py-3 font-bold text-slate-800">₹{(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="py-3">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700">
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right space-x-2">
                                  <button
                                    onClick={() => openEmailModal(inv, 'Invoice')}
                                    title="Email Invoice"
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <Mail size={14} />
                                  </button>
                                  <button
                                    onClick={() => downloadInvoicePdf(inv)}
                                    title="Download Tax Invoice"
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    onClick={() => navigate('/crm/invoices')}
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* DELIVERY NOTES TAB CONTENT */}
                  {activeTab === 'Delivery Notes' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase pb-2">
                            <th className="pb-2">DN No</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Reference Ref</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {customerDeliveryNotes.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No delivery shipments dispatched.</td>
                            </tr>
                          ) : (
                            customerDeliveryNotes.map(dn => (
                              <tr key={dn._id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-mono font-bold text-blue-600">{dn.deliveryNoteNumber}</td>
                                <td className="py-3 text-slate-500">{new Date(dn.date).toLocaleDateString()}</td>
                                <td className="py-3 text-slate-500 font-mono">
                                  {dn.salesOrder?.salesOrderNumber || dn.salesOrder || dn.salesInvoice?.invoiceNumber || dn.salesInvoice || 'Direct Delivery'}
                                </td>
                                <td className="py-3">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                                    {dn.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right space-x-2">
                                  <button
                                    onClick={() => downloadDeliveryNotePdf(dn)}
                                    title="Download PDF"
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    onClick={() => navigate('/crm/delivery-notes')}
                                    className="text-slate-500 hover:text-blue-600 p-1"
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && emailDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Mail size={18} className="text-blue-500" /> Dispatch {emailDocType} Email
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">Email Body (HTML/Text)</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                  <FileText size={18} className="text-red-500" />
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-[11px]">Attachment File</p>
                    <p className="text-slate-500 text-[10px] font-mono">
                      {emailDocType === 'Quotation' ? `Quotation_${emailDoc.quotationNumber}.pdf` : `Invoice_${emailDoc.invoiceNumber}.pdf`}
                    </p>
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
                    {sendingEmail ? 'Sending...' : 'Send Email'}
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
