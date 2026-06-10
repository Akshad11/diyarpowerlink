import React, { useEffect, useState } from 'react';
import { api } from './api';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, CheckSquare, Square, X, User } from 'lucide-react';

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstPan, setGstPan] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [billing, setBilling] = useState<Address>(defaultAddress());
  const [shipping, setShipping] = useState<Address>(defaultAddress());
  
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.list('crm/customers');
      setCustomers(data);
    } catch (err: any) {
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setGstPan(customer.gstPan || '');
    setStatus(customer.status || 'active');
    setBilling(customer.billingAddress || defaultAddress());
    setShipping(customer.shippingAddress || defaultAddress());
    
    // Check if shipping matches billing
    const billingStr = JSON.stringify(customer.billingAddress || {});
    const shippingStr = JSON.stringify(customer.shippingAddress || {});
    setShippingSameAsBilling(billingStr === shippingStr);
    
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.remove('crm/customers', id);
      setCustomers(customers.filter(c => c._id !== id));
    } catch (err: any) {
      setError('Error deleting customer');
    }
  };

  const handleNew = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setGstPan('');
    setStatus('active');
    setBilling(defaultAddress());
    setShipping(defaultAddress());
    setShippingSameAsBilling(true);
    setShowForm(true);
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
      if (editingCustomer) {
        const updated = await api.update('crm/customers', editingCustomer._id, payload);
        setCustomers(customers.map(c => c._id === editingCustomer._id ? updated : c));
      } else {
        const created = await api.create('crm/customers', payload);
        setCustomers([...customers, created]);
      }
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Error saving customer');
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.gstPan || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Master</h1>
          <p className="text-sm text-slate-500">Manage business client records, GST details, billing & shipping addresses.</p>
        </div>
        {!showForm && (
          <button
            onClick={handleNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-blue-500/10"
          >
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

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'New Customer Record'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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
              onClick={() => setShowForm(false)}
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
      ) : (
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
                      <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
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
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
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
    </div>
  );
};
