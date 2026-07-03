import React, { useEffect, useState } from 'react';
import { api } from './api';
import { UploadField } from './UploadField';
import { resolveImageUrl } from './resolveImage';
import {
  DollarSign,
  Calendar,
  Tag,
  CreditCard,
  Search,
  Filter,
  Trash2,
  Edit,
  Plus,
  X,
  FileText,
  TrendingDown,
  ExternalLink
} from 'lucide-react';

const CATEGORIES = [
  'Salaries & Wages',
  'Rent & Rates',
  'Utilities',
  'Marketing & Advertising',
  'Office Supplies',
  'Travel & Conveyance',
  'Tax & Legal Fees',
  'Others'
];

const METHODS = ['Bank Transfer', 'Cash', 'Credit Card', 'Cheque', 'Other'];

const emptyForm = {
  description: '',
  category: 'Others',
  amount: '',
  date: new Date().toISOString().substring(0, 10),
  paymentMethod: 'Bank Transfer',
  reference: '',
  notes: '',
  attachment: ''
};

export const AdminExpenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  // Filters state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.listExpenses({
        search,
        category: categoryFilter,
        startDate,
        endDate
      });
      setExpenses(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to fetch expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    // Trigger reloading by fetching directly
    api.listExpenses().then(setExpenses);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      date: new Date().toISOString().substring(0, 10)
    });
    setSaveState('idle');
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleOpenEdit = (exp: any) => {
    setEditingId(exp._id);
    setForm({
      description: exp.description || '',
      category: exp.category || 'Others',
      amount: String(exp.amount || ''),
      date: exp.date ? new Date(exp.date).toISOString().substring(0, 10) : '',
      paymentMethod: exp.paymentMethod || 'Bank Transfer',
      reference: exp.reference || '',
      notes: exp.notes || '',
      attachment: exp.attachment || ''
    });
    setSaveState('idle');
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense log?')) return;
    try {
      await api.remove('expenses', id);
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState('saving');
    setErrorMessage('');
    try {
      const numVal = parseFloat(form.amount);
      if (isNaN(numVal) || numVal <= 0) {
        throw new Error('Expense amount must be a positive number');
      }

      const payload = {
        ...form,
        amount: numVal
      };

      if (editingId) {
        await api.update('expenses', editingId, payload);
      } else {
        await api.create('expenses', payload);
      }

      setSaveState('saved');
      setModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      setSaveState('error');
      setErrorMessage(err.message || 'Error occurred while saving');
    }
  };

  // Calculated totals
  const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Group by category for percentage bars
  const categoryTotals: Record<string, number> = {};
  CATEGORIES.forEach(c => { categoryTotals[c] = 0; });
  expenses.forEach(exp => {
    const c = exp.category || 'Others';
    if (categoryTotals[c] !== undefined) {
      categoryTotals[c] += exp.amount || 0;
    } else {
      categoryTotals['Others'] = (categoryTotals['Others'] || 0) + exp.amount;
    }
  });

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Tracker</h1>
          <p className="text-sm text-slate-500">Record, categorize, and track operational overheads and general company payments.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-rose-200 hover:bg-rose-700 hover:shadow-rose-300 transition-all flex items-center gap-2 w-fit cursor-pointer"
        >
          <Plus size={16} /> Log Expense
        </button>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Expenses</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Tag size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Logged Invoices</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{expenses.length} Records</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingDown size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Top Category</span>
            <p className="text-base font-extrabold text-slate-800 mt-0.5 truncate max-w-[180px]">
              {Object.entries(categoryTotals).reduce((top, current) => current[1] > top[1] ? current : top, ['None', 0])[0]}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Filter Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Filter size={18} className="text-slate-500" /> Filter Logs
          </h3>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search description/reference..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none"
              />
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">CATEGORY</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">DATE FROM</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">DATE TO</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-slate-900 text-white rounded-xl py-2 text-xs font-bold hover:bg-slate-800"
              >
                Apply Search
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="border border-slate-200 text-slate-600 rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Category Share List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Overhead Breakdown</h3>
          <div className="space-y-4">
            {CATEGORIES.map(c => {
              const amount = categoryTotals[c] || 0;
              const percent = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
              if (amount === 0) return null;
              return (
                <div key={c} className="space-y-1 text-sm">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">{c}</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(amount)} ({percent.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {totalAmount === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">No expenditures matching selection.</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Expense Book</h3>
          <span className="text-xs text-slate-400 font-medium">Showing {expenses.length} transactions</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Refreshing logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4 text-right">Amount (INR)</th>
                  <th className="p-4 text-center">Receipt</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">No expense records found.</td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp._id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-slate-600 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{exp.description}</td>
                      <td className="p-4">
                        <span className="bg-rose-50 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full border border-rose-100 whitespace-nowrap">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{exp.paymentMethod}</td>
                      <td className="p-4 text-slate-500 font-mono text-xs">{exp.reference || '-'}</td>
                      <td className="p-4 text-right font-extrabold text-rose-600">{formatCurrency(exp.amount)}</td>
                      <td className="p-4 text-center">
                        {exp.attachment ? (
                          <a
                            href={resolveImageUrl(exp.attachment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold"
                          >
                            View <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(exp._id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Logging Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div
            className="fixed inset-0"
            onClick={() => setModalOpen(false)}
          />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Expense Log' : 'Log Operating Expense'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Expense Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Office electricity bill for May"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none"
                    required
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none"
                    required
                  >
                    {METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Reference No. (Optional)</label>
                <input
                  type="text"
                  placeholder="Receipt #, bank txn ref..."
                  value={form.reference}
                  onChange={e => setForm({ ...form, reference: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Remarks / Notes (Optional)</label>
                <textarea
                  placeholder="Additional details..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-rose-400 outline-none h-20 resize-none"
                />
              </div>

              {/* Receipt File Attachment */}
              <UploadField
                label="Attach Receipt / Invoice Image"
                value={form.attachment}
                onChange={url => setForm({ ...form, attachment: url })}
              />

              {errorMessage && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saveState === 'saving'}
                  className="flex-1 bg-rose-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  {saveState === 'saving' ? 'Saving...' : 'Save Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-slate-200 text-slate-500 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
