import React, { useEffect, useState } from 'react';
import { api } from './api';
import {
  Package,
  ClipboardList,
  FileCheck,
  TrendingUp,
  PlusCircle,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  FileText
} from 'lucide-react';

export const AdminInventory = () => {
  const [activeTab, setActiveTab] = useState<'grn' | 'adjustment' | 'ledger'>('grn');
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [posList, setPosList] = useState<any[]>([]);

  // GRN States
  const [grns, setGrns] = useState<any[]>([]);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [grnForm, setGrnForm] = useState<any>({
    purchaseOrder: '',
    supplier: '',
    receivedDate: new Date().toISOString().substring(0, 10),
    items: [],
    status: 'draft',
    remarks: ''
  });
  const [showGrnModal, setShowGrnModal] = useState(false);

  // Adjustment States
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [adjForm, setAdjForm] = useState<any>({
    reason: 'Manual Correction',
    adjustmentDate: new Date().toISOString().substring(0, 10),
    items: [{ itemId: '', name: '', sku: '', uom: '', qty: 1, remarks: '' }],
    status: 'draft',
    remarks: ''
  });
  const [showAdjModal, setShowAdjModal] = useState(false);

  // Ledger States
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allGrns, allAdjs, ledgerLogs, items, suppliers, pos] = await Promise.all([
        api.list('inventory/grns'),
        api.list('inventory/adjustments'),
        api.list('inventory/ledger'),
        api.list('crm/items'),
        api.list('procurement/suppliers'),
        api.list('procurement/purchase-orders')
      ]);
      setGrns(allGrns);
      setAdjustments(allAdjs);
      setLedger(ledgerLogs);
      setItemsList(items.filter((i: any) => i.type === 'product'));
      setSuppliersList(suppliers);
      setPosList(pos.filter((po: any) => po.status !== 'cancelled' && po.status !== 'received'));
    } catch (err: any) {
      setError('Failed to fetch inventory module records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle PO selection for GRN
  const handlePoChange = (poId: string) => {
    const po = posList.find(p => p._id === poId);
    if (!po) {
      setSelectedPo(null);
      setGrnForm({ ...grnForm, purchaseOrder: '', supplier: '', items: [] });
      return;
    }
    setSelectedPo(po);
    const grnItems = po.items.map((pi: any) => ({
      itemId: pi.itemId,
      name: pi.name,
      sku: pi.sku,
      qtyOrdered: pi.qty,
      qtyReceived: pi.qty, // default received to ordered
      uom: pi.uom || 'Units',
      remarks: ''
    }));
    setGrnForm({
      ...grnForm,
      purchaseOrder: poId,
      supplier: po.supplier?._id || po.supplier,
      items: grnItems
    });
  };

  const handleGrnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.create('inventory/grns', grnForm);
      setShowGrnModal(false);
      resetGrnForm();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to register GRN');
    }
  };

  const resetGrnForm = () => {
    setGrnForm({
      purchaseOrder: '',
      supplier: '',
      receivedDate: new Date().toISOString().substring(0, 10),
      items: [],
      status: 'draft',
      remarks: ''
    });
    setSelectedPo(null);
  };

  const handleFinalizeGrn = async (grnId: string) => {
    if (!window.confirm('Finalize receipt? This will post positive inventory to Stock Ledger.')) return;
    try {
      await api.update('inventory/grns', grnId, { status: 'received' });
      loadData();
    } catch (err: any) {
      alert('Failed to finalize GRN: ' + err.message);
    }
  };

  const handleDeleteGrn = async (grnId: string) => {
    if (!window.confirm('Cancel/Delete this GRN? Respective stock entries will be reversed.')) return;
    try {
      await api.remove('inventory/grns', grnId);
      loadData();
    } catch (err: any) {
      alert('Failed to delete GRN');
    }
  };

  // Adjustments handling
  const handleAdjItemChange = (index: number, itemId: string) => {
    const itemObj = itemsList.find(i => i._id === itemId);
    const newItems = [...adjForm.items];
    if (itemObj) {
      newItems[index] = {
        ...newItems[index],
        itemId,
        name: itemObj.name,
        sku: itemObj.sku,
        uom: itemObj.uom?.name || 'Units'
      };
    } else {
      newItems[index] = { itemId: '', name: '', sku: '', uom: '', qty: 1, remarks: '' };
    }
    setAdjForm({ ...adjForm, items: newItems });
  };

  const handleAdjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.create('inventory/adjustments', adjForm);
      setShowAdjModal(false);
      resetAdjForm();
      loadData();
    } catch (err: any) {
      alert('Failed to record stock adjustment');
    }
  };

  const handleFinalizeAdj = async (adjId: string) => {
    if (!window.confirm('Post this adjustment? This will sync stock levels.')) return;
    try {
      await api.update('inventory/adjustments', adjId, { status: 'adjusted' });
      loadData();
    } catch (err: any) {
      alert('Failed to finalize adjustment');
    }
  };

  const handleDeleteAdj = async (adjId: string) => {
    if (!window.confirm('Cancel/Delete this adjustment? Respective stock entries will be reversed.')) return;
    try {
      await api.remove('inventory/adjustments', adjId);
      loadData();
    } catch (err: any) {
      alert('Failed to delete adjustment');
    }
  };

  const resetAdjForm = () => {
    setAdjForm({
      reason: 'Manual Correction',
      adjustmentDate: new Date().toISOString().substring(0, 10),
      items: [{ itemId: '', name: '', sku: '', uom: '', qty: 1, remarks: '' }],
      status: 'draft',
      remarks: ''
    });
  };

  // Filtered Ledger Logs
  const filteredLedger = ledger.filter(log => {
    if (!ledgerFilter) return true;
    return log.item?._id === ledgerFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory & Stock Control</h1>
          <p className="text-sm text-slate-500">Track physical product additions, manual corrections, and full historical ledger movements.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetGrnForm();
              setShowGrnModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <PlusCircle size={16} /> New GRN
          </button>
          <button
            onClick={() => {
              resetAdjForm();
              setShowAdjModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <PlusCircle size={16} /> Log Adjustment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('grn')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'grn' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <ClipboardList size={16} /> Goods Receipt Notes (GRN)
        </button>
        <button
          onClick={() => setActiveTab('adjustment')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'adjustment' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <AlertTriangle size={16} /> Stock Adjustments
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'ledger' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <ArrowRightLeft size={16} /> Stock Ledger Movements
        </button>
      </div>

      {loading && grns.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Loading module logs...</div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: GRNs */}
          {activeTab === 'grn' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                    <th className="p-4">GRN Number</th>
                    <th className="p-4">PO Ref</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4">Received Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {grns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">No Goods Receipt Notes generated yet.</td>
                    </tr>
                  ) : (
                    grns.map(g => (
                      <tr key={g._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{g.grnNumber}</td>
                        <td className="p-4 text-slate-500 font-semibold">{g.purchaseOrder?.poNumber || 'N/A'}</td>
                        <td className="p-4 font-semibold text-slate-700">{g.supplier?.name}</td>
                        <td className="p-4 text-slate-500">{new Date(g.receivedDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${g.status === 'received' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : g.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            {g.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-3">
                          {g.status === 'draft' && (
                            <button
                              onClick={() => handleFinalizeGrn(g._id)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
                            >
                              Finalize & Receive
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteGrn(g._id)}
                            className="text-xs font-bold text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: STOCK ADJUSTMENTS */}
          {activeTab === 'adjustment' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                    <th className="p-4">Adjustment No</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Items Count</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">No stock adjustments logged yet.</td>
                    </tr>
                  ) : (
                    adjustments.map(adj => (
                      <tr key={adj._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{adj.adjustmentNumber}</td>
                        <td className="p-4 text-slate-500">{new Date(adj.adjustmentDate).toLocaleDateString()}</td>
                        <td className="p-4 font-semibold text-slate-700">{adj.reason}</td>
                        <td className="p-4 text-slate-500">{adj.items?.length || 0} Products</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${adj.status === 'adjusted' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : adj.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            {adj.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-3">
                          {adj.status === 'draft' && (
                            <button
                              onClick={() => handleFinalizeAdj(adj._id)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                              Finalize & Adjust
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAdj(adj._id)}
                            className="text-xs font-bold text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: STOCK LEDGER LOGS */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex gap-4 max-w-sm">
                <select
                  value={ledgerFilter}
                  onChange={(e) => setLedgerFilter(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- Filter by Product --</option>
                  {itemsList.map(item => (
                    <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
                  ))}
                </select>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                      <th className="p-4">Date</th>
                      <th className="p-4">Product Name</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Transaction Type</th>
                      <th className="p-4">Reference Document</th>
                      <th className="p-4 text-right">Qty Change</th>
                      <th className="p-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">No stock ledger entries found.</td>
                      </tr>
                    ) : (
                      filteredLedger.map(log => (
                        <tr key={log._id} className="hover:bg-slate-50/50">
                          <td className="p-4 text-slate-500">{new Date(log.date).toLocaleString()}</td>
                          <td className="p-4 font-bold text-slate-900">{log.item?.name}</td>
                          <td className="p-4 text-slate-500 font-semibold">{log.item?.sku}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${log.transactionType === 'GRN' ? 'bg-emerald-50 text-emerald-700' : log.transactionType === 'SalesInvoice' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                              {log.transactionType}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{log.referenceNumber}</td>
                          <td className={`p-4 text-right font-extrabold ${log.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                          </td>
                          <td className="p-4 text-slate-500 text-xs">{log.remarks}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE GRN MODAL */}
      {showGrnModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Generate Goods Receipt Note</h2>
            
            <form onSubmit={handleGrnSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Purchase Order</label>
                <select
                  value={grnForm.purchaseOrder}
                  onChange={(e) => handlePoChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  required
                >
                  <option value="">-- Choose PO --</option>
                  {posList.map(po => (
                    <option key={po._id} value={po._id}>{po.poNumber} (Supplier: {po.supplier?.name})</option>
                  ))}
                </select>
              </div>

              {selectedPo && (
                <div className="space-y-4 border border-slate-100 bg-slate-50 p-4 rounded-2xl">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items In PO</h3>
                  <div className="space-y-3">
                    {grnForm.items.map((it: any, index: number) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-white p-3 border border-slate-200/50 rounded-xl">
                        <div className="md:col-span-2">
                          <p className="text-xs font-bold text-slate-800">{it.name}</p>
                          <p className="text-[10px] text-slate-400">SKU: {it.sku} | Ordered: {it.qtyOrdered} {it.uom}</p>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Qty Received</label>
                          <input
                            type="number"
                            min="0"
                            max={it.qtyOrdered}
                            value={it.qtyReceived}
                            onChange={(e) => {
                              const newItems = [...grnForm.items];
                              newItems[index].qtyReceived = parseInt(e.target.value, 10) || 0;
                              setGrnForm({ ...grnForm, items: newItems });
                            }}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Remarks</label>
                          <input
                            type="text"
                            placeholder="Condition, details"
                            value={it.remarks}
                            onChange={(e) => {
                              const newItems = [...grnForm.items];
                              newItems[index].remarks = e.target.value;
                              setGrnForm({ ...grnForm, items: newItems });
                            }}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={grnForm.receivedDate}
                    onChange={(e) => setGrnForm({ ...grnForm, receivedDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Receipt Status</label>
                  <select
                    value={grnForm.status}
                    onChange={(e) => setGrnForm({ ...grnForm, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    required
                  >
                    <option value="draft">Draft (No ledger update)</option>
                    <option value="received">Received (Post to Ledger)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">General Notes</label>
                <textarea
                  placeholder="Additional delivery information..."
                  value={grnForm.remarks}
                  onChange={(e) => setGrnForm({ ...grnForm, remarks: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGrnModal(false)}
                  className="border border-slate-200 text-slate-500 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
                >
                  Save GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ADJUSTMENT MODAL */}
      {showAdjModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Log Stock Adjustment</h2>
            
            <form onSubmit={handleAdjSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Adjustment Reason</label>
                  <select
                    value={adjForm.reason}
                    onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    required
                  >
                    <option value="Damaged">Damaged</option>
                    <option value="Lost">Lost</option>
                    <option value="Manual Correction">Manual Correction</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Adjustment Date</label>
                  <input
                    type="date"
                    value={adjForm.adjustmentDate}
                    onChange={(e) => setAdjForm({ ...adjForm, adjustmentDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    required
                  />
                </div>
              </div>

              {adjForm.items.map((it: any, index: number) => (
                <div key={index} className="space-y-4 border border-slate-100 bg-slate-50 p-4 rounded-xl">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Product</label>
                    <select
                      value={it.itemId}
                      onChange={(e) => handleAdjItemChange(index, e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                      required
                    >
                      <option value="">-- Choose Item --</option>
                      {itemsList.map(item => (
                        <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Quantity Adjustment</label>
                      <input
                        type="number"
                        placeholder="e.g. -5 or +10"
                        value={it.qty}
                        onChange={(e) => {
                          const newItems = [...adjForm.items];
                          newItems[index].qty = parseInt(e.target.value, 10) || 0;
                          setAdjForm({ ...adjForm, items: newItems });
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Use negative numbers to deduct, positive to add.</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Line Remarks</label>
                      <input
                        type="text"
                        placeholder="Detailed reason..."
                        value={it.remarks}
                        onChange={(e) => {
                          const newItems = [...adjForm.items];
                          newItems[index].remarks = e.target.value;
                          setAdjForm({ ...adjForm, items: newItems });
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Post Adjustment Instantly?</label>
                <select
                  value={adjForm.status}
                  onChange={(e) => setAdjForm({ ...adjForm, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  required
                >
                  <option value="draft">Draft (Save only)</option>
                  <option value="adjusted">Adjusted (Post and Apply to Ledger)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">General Notes</label>
                <textarea
                  placeholder="Audit explanation..."
                  value={adjForm.remarks}
                  onChange={(e) => setAdjForm({ ...adjForm, remarks: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="border border-slate-200 text-slate-500 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
