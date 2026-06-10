import React, { useEffect, useState } from 'react';
import { api } from './api';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

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

export const AdminUomsTaxes = () => {
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UOM Form State
  const [uomName, setUomName] = useState('');
  const [uomCode, setUomCode] = useState('');
  const [editingUom, setEditingUom] = useState<Uom | null>(null);

  // Tax Form State
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState<number | ''>('');
  const [editingTax, setEditingTax] = useState<Tax | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uomData, taxData] = await Promise.all([
        api.list('crm/uoms'),
        api.list('crm/taxes')
      ]);
      setUoms(uomData);
      setTaxes(taxData);
    } catch (err: any) {
      setError('Failed to fetch UOMs and Taxes');
    } finally {
      setLoading(false);
    }
  };

  // UOM handlers
  const handleSaveUom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uomName.trim() || !uomCode.trim()) return;

    try {
      if (editingUom) {
        const updated = await api.update('crm/uoms', editingUom._id, {
          name: uomName.trim(),
          code: uomCode.trim().toUpperCase()
        });
        setUoms(uoms.map(u => u._id === editingUom._id ? updated : u));
        setEditingUom(null);
      } else {
        const created = await api.create('crm/uoms', {
          name: uomName.trim(),
          code: uomCode.trim().toUpperCase()
        });
        setUoms([...uoms, created]);
      }
      setUomName('');
      setUomCode('');
    } catch (err: any) {
      setError(err.message || 'Error saving UOM');
    }
  };

  const handleDeleteUom = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this UOM?')) return;
    try {
      await api.remove('crm/uoms', id);
      setUoms(uoms.filter(u => u._id !== id));
    } catch (err: any) {
      setError('Error deleting UOM');
    }
  };

  // Tax handlers
  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxName.trim() || taxRate === '') return;

    try {
      if (editingTax) {
        const updated = await api.update('crm/taxes', editingTax._id, {
          name: taxName.trim(),
          rate: Number(taxRate)
        });
        setTaxes(taxes.map(t => t._id === editingTax._id ? updated : t));
        setEditingTax(null);
      } else {
        const created = await api.create('crm/taxes', {
          name: taxName.trim(),
          rate: Number(taxRate)
        });
        setTaxes([...taxes, created]);
      }
      setTaxName('');
      setTaxRate('');
    } catch (err: any) {
      setError(err.message || 'Error saving Tax');
    }
  };

  const handleDeleteTax = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Tax rate?')) return;
    try {
      await api.remove('crm/taxes', id);
      setTaxes(taxes.filter(t => t._id !== id));
    } catch (err: any) {
      setError('Error deleting Tax rate');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading UOMs & Taxes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">UOMs & Taxes Settings</h1>
          <p className="text-sm text-slate-500">Configure units of measure and tax percentages for item masters and invoices.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* UOMs Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Units of Measure (UOM)</h2>
            
            {/* List */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase">
                    <th className="pb-3 pl-1">Name</th>
                    <th className="pb-3">Code</th>
                    <th className="pb-3 text-right pr-1">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {uoms.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">No UOMs configured</td>
                    </tr>
                  ) : (
                    uoms.map(u => (
                      <tr key={u._id} className="hover:bg-slate-50/50">
                        <td className="py-3 pl-1 font-medium text-slate-800">{u.name}</td>
                        <td className="py-3 font-mono text-slate-600">{u.code}</td>
                        <td className="py-3 text-right pr-1 space-x-2">
                          <button
                            onClick={() => {
                              setEditingUom(u);
                              setUomName(u.name);
                              setUomCode(u.code);
                            }}
                            className="text-slate-600 hover:text-blue-600 transition-colors p-1"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUom(u._id)}
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

          {/* Form */}
          <form onSubmit={handleSaveUom} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 mt-auto">
            <h3 className="text-sm font-bold text-slate-700 mb-3">
              {editingUom ? 'Edit UOM' : 'Add Unit of Measure'}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">UOM Name</label>
                <input
                  type="text"
                  placeholder="e.g. Roll"
                  value={uomName}
                  onChange={e => setUomName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Code</label>
                <input
                  type="text"
                  placeholder="e.g. ROL"
                  value={uomCode}
                  onChange={e => setUomCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              {editingUom && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUom(null);
                    setUomName('');
                    setUomCode('');
                  }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm shadow-blue-500/10"
              >
                {editingUom ? <Check size={14} /> : <Plus size={14} />}
                {editingUom ? 'Update' : 'Add UOM'}
              </button>
            </div>
          </form>
        </div>

        {/* Taxes Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Tax Rates (GST)</h2>

            {/* List */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase">
                    <th className="pb-3 pl-1">Tax Name</th>
                    <th className="pb-3">Rate (%)</th>
                    <th className="pb-3 text-right pr-1">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {taxes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">No Tax rates configured</td>
                    </tr>
                  ) : (
                    taxes.map(t => (
                      <tr key={t._id} className="hover:bg-slate-50/50">
                        <td className="py-3 pl-1 font-medium text-slate-800">{t.name}</td>
                        <td className="py-3 font-semibold text-emerald-600">{t.rate}%</td>
                        <td className="py-3 text-right pr-1 space-x-2">
                          <button
                            onClick={() => {
                              setEditingTax(t);
                              setTaxName(t.name);
                              setTaxRate(t.rate);
                            }}
                            className="text-slate-600 hover:text-blue-600 transition-colors p-1"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTax(t._id)}
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

          {/* Form */}
          <form onSubmit={handleSaveTax} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 mt-auto">
            <h3 className="text-sm font-bold text-slate-700 mb-3">
              {editingTax ? 'Edit Tax' : 'Add Tax Rate'}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tax Label</label>
                <input
                  type="text"
                  placeholder="e.g. GST 18%"
                  value={taxName}
                  onChange={e => setTaxName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Rate (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 18"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              {editingTax && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTax(null);
                    setTaxName('');
                    setTaxRate('');
                  }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm shadow-blue-500/10"
              >
                {editingTax ? <Check size={14} /> : <Plus size={14} />}
                {editingTax ? 'Update' : 'Add Tax'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
