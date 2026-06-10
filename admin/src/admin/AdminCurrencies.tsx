import React, { useEffect, useState } from 'react';
import { api } from './api';
import { DollarSign, Globe, TrendingUp, RefreshCw } from 'lucide-react';

export const AdminCurrencies = () => {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateVal, setEditingRateVal] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const loadData = async () => {
    setLoading(true);
    try {
      const [currencyList, rateList] = await Promise.all([
        api.list('currencies'),
        api.list('currencies/rates')
      ]);
      setCurrencies(currencyList);
      setRates(rateList);
    } catch (err) {
      console.error('Failed to load currency data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditRate = (rateObj: any) => {
    setEditingRateId(rateObj._id);
    setEditingRateVal(String(rateObj.rate));
    setSaveState('idle');
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRateId) return;
    setSaveState('saving');
    try {
      const numRate = parseFloat(editingRateVal);
      if (isNaN(numRate) || numRate <= 0) {
        throw new Error('Invalid rate value');
      }
      await api.update('currencies/rates', editingRateId, { rate: numRate });
      setSaveState('saved');
      setEditingRateId(null);
      loadData();
    } catch (err) {
      console.error(err);
      setSaveState('error');
    }
  };

  if (loading && currencies.length === 0) {
    return <div className="text-center py-12 text-slate-500">Loading currency configurations...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Multi-Currency & Exchange Rates</h1>
        <p className="text-sm text-slate-500">Set conversion rates relative to the base currency (INR). These rates are used across all transactional documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Currencies Directory */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Globe size={18} className="text-blue-500" /> Supported Currencies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currencies.map((curr) => (
              <div key={curr._id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-slate-900">{curr.code}</span>
                    {curr.isBase && (
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                        Base Currency
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{curr.name}</p>
                </div>
                <div className="text-2xl font-semibold text-slate-400 font-display">
                  {curr.symbol}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exchange Rates Editor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> Exchange Rates (to INR)
          </h2>

          <div className="space-y-4">
            {rates.map((rateObj) => (
              <div key={rateObj._id} className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">
                    1 {rateObj.from} = {rateObj.rate} {rateObj.to}
                  </span>
                  {rateObj.from !== 'INR' && editingRateId !== rateObj._id && (
                    <button
                      onClick={() => handleEditRate(rateObj)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Update
                    </button>
                  )}
                </div>

                {editingRateId === rateObj._id && (
                  <form onSubmit={handleSaveRate} className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.0001"
                        value={editingRateVal}
                        onChange={(e) => setEditingRateVal(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm"
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={saveState === 'saving'}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700"
                      >
                        {saveState === 'saving' ? 'Saving' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRateId(null)}
                        className="border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>

          {saveState === 'error' && (
            <p className="text-xs text-red-600">Failed to save rate. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
};
