import React, { useEffect, useState } from 'react';
import { api } from './api';
import { Plus, Search, Edit2, Trash2, Tag, Percent, X } from 'lucide-react';

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
  type: 'product' | 'service';
  uom: Uom;
  tax: Tax;
  price: number;
  description: string;
}

export const AdminItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [type, setType] = useState<'product' | 'service'>('product');
  const [uomId, setUomId] = useState('');
  const [taxId, setTaxId] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemData, uomData, taxData] = await Promise.all([
        api.list('crm/items'),
        api.list('crm/uoms'),
        api.list('crm/taxes')
      ]);
      setItems(itemData);
      setUoms(uomData);
      setTaxes(taxData);
    } catch (err: any) {
      setError('Failed to fetch CRM Item Master data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setName(item.name);
    setSku(item.sku);
    setType(item.type);
    setUomId(item.uom?._id || '');
    setTaxId(item.tax?._id || '');
    setPrice(item.price);
    setDescription(item.description || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.remove('crm/items', id);
      setItems(items.filter(i => i._id !== id));
    } catch (err: any) {
      setError('Error deleting item');
    }
  };

  const handleNew = () => {
    setEditingItem(null);
    setName('');
    setSku('');
    setType('product');
    setUomId(uoms[0]?._id || '');
    setTaxId(taxes[0]?._id || '');
    setPrice('');
    setDescription('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !uomId || !taxId) return;

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      type,
      uom: uomId,
      tax: taxId,
      price: Number(price) || 0,
      description: description.trim()
    };

    try {
      if (editingItem) {
        const updated = await api.update('crm/items', editingItem._id, payload);
        setItems(items.map(i => i._id === editingItem._id ? updated : i));
      } else {
        const created = await api.create('crm/items', payload);
        setItems([...items, created]);
      }
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Error saving item');
    }
  };

  const filtered = items.filter(i => {
    if (!i) return false;
    return (
      (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.description || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Item / Service Master</h1>
          <p className="text-sm text-slate-500">Manage Products & Services billed, default selling prices, and Tax settings.</p>
        </div>
        {!showForm && (
          <button
            onClick={handleNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-blue-500/10"
          >
            <Plus size={16} /> Add Item
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
              {editingItem ? `Edit Item: ${editingItem.name}` : 'New Billing Item Master'}
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
              <label className="block text-xs font-semibold text-slate-500 mb-1">Item / Service Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">SKU / Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Type *</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'product' | 'service')}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Default Selling Price (₹) *</label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Unit of Measure (UOM) *</label>
              <select
                value={uomId}
                onChange={e => setUomId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {uoms.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tax Setting (GST) *</label>
              <select
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {taxes.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.rate}%)</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Item technical description or details"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
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
              Save Item
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
                placeholder="Search SKU or item name..."
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
                  <th className="py-3.5 px-6">SKU / Code</th>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">UOM</th>
                  <th className="py-3.5 px-6">Tax Rate</th>
                  <th className="py-3.5 px-6">Price</th>
                  <th className="py-3.5 px-6 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading items...' : 'No items found'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(i => (
                    <tr key={i._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-800">
                        {i.sku}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{i.name}</div>
                        {i.description && (
                          <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{i.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${i.type === 'product' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                          {i.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {i.uom ? `${i.uom.name} (${i.uom.code})` : '-'}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {i.tax ? `${i.tax.name} (${i.tax.rate}%)` : '-'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        ₹{(i.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right pr-8 space-x-2">
                        <button
                          onClick={() => handleEdit(i)}
                          className="text-slate-600 hover:text-blue-600 transition-colors p-1"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(i._id)}
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
