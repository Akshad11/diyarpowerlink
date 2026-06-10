import React, { useEffect, useState } from 'react';
import { api } from './api';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  X,
  Building,
  Calendar,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  FileText
} from 'lucide-react';

interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Supplier {
  _id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  gst: string;
  pan: string;
  crNumber: string;
  bankDetails: BankDetails;
  address: Address;
  status: 'active' | 'inactive';
}

interface CommLog {
  _id: string;
  supplier: string | any;
  date: string;
  type: 'call' | 'email' | 'meeting' | 'other';
  summary: string;
  remarks: string;
  nextFollowUpDate?: string;
}

const defaultBankDetails = (): BankDetails => ({
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: ''
});

const defaultAddress = (): Address => ({
  street: '',
  city: '',
  state: '',
  zip: '',
  country: ''
});

export const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [commLogs, setCommLogs] = useState<CommLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Supplier Form states
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [pan, setPan] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [bankDetails, setBankDetails] = useState<BankDetails>(defaultBankDetails());
  const [address, setAddress] = useState<Address>(defaultAddress());

  // Comm Log Form states
  const [showLogForm, setShowLogForm] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logType, setLogType] = useState<'call' | 'email' | 'meeting' | 'other'>('call');
  const [logSummary, setLogSummary] = useState('');
  const [logRemarks, setLogRemarks] = useState('');
  const [logNextFollowUp, setLogNextFollowUp] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.list('procurement/suppliers');
      setSuppliers(data);
    } catch (err: any) {
      setError('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogsForSupplier = async (supplierId: string) => {
    try {
      const logs = await api.list(`procurement/supplier-comm-logs?supplierId=${supplierId}`);
      setCommLogs(logs);
    } catch (err) {
      setError('Failed to fetch communication logs');
    }
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    fetchLogsForSupplier(supplier._id);
    setShowLogForm(false);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setContactName(supplier.contactName || '');
    setEmail(supplier.email || '');
    setPhone(supplier.phone || '');
    setGst(supplier.gst || '');
    setPan(supplier.pan || '');
    setCrNumber(supplier.crNumber || '');
    setStatus(supplier.status || 'active');
    setBankDetails(supplier.bankDetails || defaultBankDetails());
    setAddress(supplier.address || defaultAddress());
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api.remove('procurement/suppliers', id);
      setSuppliers(suppliers.filter(s => s._id !== id));
      if (selectedSupplier?._id === id) {
        setSelectedSupplier(null);
        setCommLogs([]);
      }
    } catch (err: any) {
      setError('Error deleting supplier');
    }
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    setName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setGst('');
    setPan('');
    setCrNumber('');
    setStatus('active');
    setBankDetails(defaultBankDetails());
    setAddress(defaultAddress());
    setShowSupplierForm(true);
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gst: gst.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      crNumber: crNumber.trim(),
      status,
      bankDetails,
      address
    };

    try {
      if (editingSupplier) {
        const updated = await api.update('procurement/suppliers', editingSupplier._id, payload);
        setSuppliers(suppliers.map(s => s._id === editingSupplier._id ? updated : s));
        if (selectedSupplier?._id === editingSupplier._id) {
          setSelectedSupplier(updated);
        }
      } else {
        const created = await api.create('procurement/suppliers', payload);
        setSuppliers([...suppliers, created]);
      }
      setShowSupplierForm(false);
    } catch (err: any) {
      setError(err.message || 'Error saving supplier');
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !logSummary.trim()) return;

    const payload = {
      supplier: selectedSupplier._id,
      date: new Date(logDate).toISOString(),
      type: logType,
      summary: logSummary.trim(),
      remarks: logRemarks.trim(),
      nextFollowUpDate: logNextFollowUp ? new Date(logNextFollowUp).toISOString() : undefined
    };

    try {
      const created = await api.create('procurement/supplier-comm-logs', payload);
      setCommLogs([created, ...commLogs]);
      setShowLogForm(false);
      setLogSummary('');
      setLogRemarks('');
      setLogNextFollowUp('');
    } catch (err: any) {
      setError('Error saving communication log');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('Delete this communication log entry?')) return;
    try {
      await api.remove('procurement/supplier-comm-logs', logId);
      setCommLogs(commLogs.filter(l => l._id !== logId));
    } catch (err) {
      setError('Error deleting log entry');
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Master</h1>
          <p className="text-sm text-slate-500">Manage vendor profiles, bank/GST details, and maintain communication histories.</p>
        </div>
        {!showSupplierForm && (
          <button
            onClick={handleNewSupplier}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-indigo-500/10"
          >
            <Plus size={16} /> Add Supplier
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {showSupplierForm ? (
        <form onSubmit={handleSupplierSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'New Supplier Profile'}
            </h2>
            <button
              type="button"
              onClick={() => setShowSupplierForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Company / Supplier Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Person Name</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">GST Registration Number</label>
              <input
                type="text"
                value={gst}
                onChange={e => setGst(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">PAN Number / CR Number</label>
              <input
                type="text"
                placeholder="PAN or CR Number"
                value={pan}
                onChange={e => setPan(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Address Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1">
                <MapPin size={16} className="text-slate-400" /> Supplier Address
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Street Address</label>
                  <textarea
                    rows={2}
                    value={address.street}
                    onChange={e => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={e => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">State / Region</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={e => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Zip / Postal Code</label>
                    <input
                      type="text"
                      value={address.zip}
                      onChange={e => setAddress({ ...address, zip: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Country</label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={e => setAddress({ ...address, country: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1">
                <Building size={16} className="text-slate-400" /> Bank Transfer Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">IFSC / SWIFT Code</label>
                    <input
                      type="text"
                      value={bankDetails.ifscCode}
                      onChange={e => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Branch Name</label>
                    <input
                      type="text"
                      value={bankDetails.branchName}
                      onChange={e => setBankDetails({ ...bankDetails, branchName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSupplierForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-500/10"
            >
              Save Supplier
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suppliers List (Left Column) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
            {/* Header toolbar */}
            <div className="p-4 border-b border-slate-200/80 flex justify-between items-center gap-3">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Tax IDs</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                        {loading ? 'Loading suppliers...' : 'No suppliers found'}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(s => (
                      <tr
                        key={s._id}
                        onClick={() => handleSelectSupplier(s)}
                        className={`cursor-pointer transition-colors ${selectedSupplier?._id === s._id ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                            {s.name.substring(0, 2)}
                          </div>
                          <div className="truncate max-w-[150px]">
                            <p>{s.name}</p>
                            {s.contactName && <p className="text-[10px] text-slate-400 font-normal">Attn: {s.contactName}</p>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          {s.email && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600">
                              <Mail size={10} className="text-slate-400" />
                              {s.email}
                            </div>
                          )}
                          {s.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600">
                              <Phone size={10} className="text-slate-400" />
                              {s.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-700">
                          {s.gst && <div>GST: {s.gst}</div>}
                          {s.pan && <div>PAN: {s.pan}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right pr-6 space-x-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditSupplier(s)}
                            className="text-slate-600 hover:text-indigo-600 transition-colors p-1"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s._id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Panel & Communication Log Timeline (Right Column) */}
          <div className="space-y-6 lg:col-span-1">
            {selectedSupplier ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Supplier Detail Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedSupplier.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Building size={12} /> Status: {selectedSupplier.status}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSupplier(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Account Details Quick Summary */}
                <div className="text-xs text-slate-600 space-y-2.5">
                  <p className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Bank Details</p>
                  {selectedSupplier.bankDetails?.bankName ? (
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-1">
                      <p><span className="text-slate-400">Bank:</span> {selectedSupplier.bankDetails.bankName}</p>
                      <p><span className="text-slate-400">Account:</span> {selectedSupplier.bankDetails.accountNumber}</p>
                      <p><span className="text-slate-400">IFSC/SWIFT:</span> {selectedSupplier.bankDetails.ifscCode}</p>
                      {selectedSupplier.bankDetails.branchName && <p><span className="text-slate-400">Branch:</span> {selectedSupplier.bankDetails.branchName}</p>}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No bank transfer details set.</p>
                  )}
                </div>

                {/* Communication History Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <MessageSquare size={16} className="text-indigo-500" /> Comm History
                    </h4>
                    {!showLogForm && (
                      <button
                        onClick={() => setShowLogForm(true)}
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus size={12} /> Log Comm
                      </button>
                    )}
                  </div>

                  {showLogForm && (
                    <form onSubmit={handleLogSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Add Log Entry</span>
                        <button type="button" onClick={() => setShowLogForm(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Date</label>
                          <input
                            type="date"
                            required
                            value={logDate}
                            onChange={e => setLogDate(e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Type</label>
                          <select
                            value={logType}
                            onChange={e => setLogType(e.target.value as any)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="call">Phone Call</option>
                            <option value="email">Email Sent/Received</option>
                            <option value="meeting">Meeting</option>
                            <option value="other">Other Note</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Summary / Notes *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Discussed pricing of motor components"
                          value={logSummary}
                          onChange={e => setLogSummary(e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Remarks (Optional)</label>
                        <textarea
                          rows={2}
                          placeholder="Additional details..."
                          value={logRemarks}
                          onChange={e => setLogRemarks(e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Next Follow Up Date</label>
                        <input
                          type="date"
                          value={logNextFollowUp}
                          onChange={e => setLogNextFollowUp(e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowLogForm(false)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          Save Log
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Comm Log Timeline */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {commLogs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4">No communications logged yet.</p>
                    ) : (
                      commLogs.map(l => (
                        <div key={l._id} className="relative pl-4 border-l-2 border-slate-200 pb-3 group">
                          {/* Dot indicator */}
                          <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>

                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-semibold text-slate-400">
                              {new Date(l.date).toLocaleDateString()} - <span className="uppercase text-indigo-600 font-bold">{l.type}</span>
                            </span>
                            <button
                              onClick={() => handleDeleteLog(l._id)}
                              className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                            >
                              <X size={10} />
                            </button>
                          </div>

                          <p className="text-xs font-medium text-slate-800 mt-1">{l.summary}</p>
                          {l.remarks && <p className="text-[11px] text-slate-500 italic mt-0.5">{l.remarks}</p>}
                          {l.nextFollowUpDate && (
                            <p className="text-[10px] font-bold text-amber-600 mt-1.5 flex items-center gap-1">
                              <Calendar size={10} /> Follow Up: {new Date(l.nextFollowUpDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 py-24 text-sm">
                Select a supplier from the list to view billing addresses, bank account info, and communication records.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
