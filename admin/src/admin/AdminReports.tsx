import React, { useEffect, useState } from 'react';
import { api } from './api';
import {
  TrendingUp,
  Briefcase,
  AlertTriangle,
  Receipt,
  FileText,
  DollarSign,
  Users,
  Percent,
  Calendar,
  AlertCircle,
  ClipboardList,
  Package
} from 'lucide-react';

export const AdminReports = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'procurement' | 'inventory' | 'finance'>('sales');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.reportsSummary();
      setSummary(data);
    } catch (err: any) {
      setError('Failed to compile reports summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Compiling reports summary dashboards...</div>;
  }

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-sm text-slate-500">Cross-module operational reporting covering sales revenue, procurement pipelines, inventories, and tax liability registers.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'sales' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <TrendingUp size={16} /> Sales Reports
        </button>
        <button
          onClick={() => setActiveTab('procurement')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'procurement' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Briefcase size={16} /> Procurement Reports
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'inventory' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <AlertTriangle size={16} /> Inventory Reports
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'finance' ? 'border-b-2 border-violet-600 text-violet-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Receipt size={16} /> Finance Reports
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* SALES PANEL */}
        {activeTab === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Sales Breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" /> Monthly Sales Register
              </h2>
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="p-3">Billing Month</th>
                      <th className="p-3 text-right">Invoices Count</th>
                      <th className="p-3 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.sales?.monthlySales?.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">No monthly invoice logs found.</td>
                      </tr>
                    ) : (
                      summary?.sales?.monthlySales?.map((m: any) => (
                        <tr key={m.month} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-700">{m.month}</td>
                          <td className="p-3 text-right font-medium text-slate-500">{m.count}</td>
                          <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(m.sales)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Wise Sales */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-indigo-500" /> Top Customer Billings
              </h2>
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="p-3">Customer Name</th>
                      <th className="p-3 text-right">Invoices</th>
                      <th className="p-3 text-right">Total Purchases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.sales?.customerSales?.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">No customer purchases found.</td>
                      </tr>
                    ) : (
                      summary?.sales?.customerSales?.map((c: any) => (
                        <tr key={c.customerId} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-700">{c.name}</td>
                          <td className="p-3 text-right font-medium text-slate-500">{c.count}</td>
                          <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(c.sales)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Service Wise Revenue */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Briefcase size={18} className="text-violet-500" /> Service Revenue Contribution
              </h2>
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="p-3">Service Name</th>
                      <th className="p-3">SKU Code</th>
                      <th className="p-3 text-right">Sold Qty</th>
                      <th className="p-3 text-right">Total Revenue Realized</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.sales?.serviceRevenue?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">No service revenue logs recorded.</td>
                      </tr>
                    ) : (
                      summary?.sales?.serviceRevenue?.map((s: any) => (
                        <tr key={s.itemId} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-700">{s.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{s.sku}</td>
                          <td className="p-3 text-right font-medium text-slate-500">{s.qty}</td>
                          <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(s.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PROCUREMENT PANEL */}
        {activeTab === 'procurement' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Supplier Wise Purchase */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-blue-500" /> Supplier Procurement Summary
              </h2>
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="p-3">Supplier Name</th>
                      <th className="p-3 text-right">PO Count</th>
                      <th className="p-3 text-right">Total Purchase Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.procurement?.supplierPurchases?.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">No supplier purchases recorded yet.</td>
                      </tr>
                    ) : (
                      summary?.procurement?.supplierPurchases?.map((s: any) => (
                        <tr key={s.supplierId} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-700">{s.name}</td>
                          <td className="p-3 text-right font-medium text-slate-500">{s.count}</td>
                          <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(s.purchase)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending RFQs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-amber-500" /> Active / Pending RFQs
              </h2>
              <div className="space-y-3">
                {summary?.procurement?.pendingRfqs?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No active RFQs pending response.</p>
                ) : (
                  summary?.procurement?.pendingRfqs?.map((r: any) => (
                    <div key={r._id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{r.rfqNumber}</p>
                        <p className="text-xs text-slate-400">Date: {new Date(r.date).toLocaleDateString()}</p>
                      </div>
                      <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-100">
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Purchase Orders */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-500" /> Pending Delivery POs
              </h2>
              <div className="space-y-3">
                {summary?.procurement?.pendingPos?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No pending POs waiting for delivery.</p>
                ) : (
                  summary?.procurement?.pendingPos?.map((p: any) => (
                    <div key={p._id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{p.poNumber}</p>
                        <p className="text-xs text-slate-500 font-medium">{p.supplier?.name}</p>
                      </div>
                      <span className="text-slate-900 font-extrabold">{formatCurrency(p.totalAmount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY PANEL */}
        {activeTab === 'inventory' && (
          <div className="space-y-8">
            {/* Low Stock Alerts */}
            {summary?.inventory?.lowStock?.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 space-y-3">
                <h2 className="text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle size={18} /> Low Stock Warnings (Threshold &lt; 10 Units)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {summary.inventory.lowStock.map((it: any) => (
                    <div key={it._id} className="bg-white border border-rose-200/50 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{it.name}</p>
                        <p className="text-xs text-slate-400">SKU: {it.sku}</p>
                      </div>
                      <span className="text-rose-600 font-extrabold text-lg">{it.currentStock} {it.uom}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Stock Valuation */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Package size={18} className="text-emerald-500" /> Physical Item Stocks Valuation
              </h2>
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="p-3">Product Name</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-right">Selling Price</th>
                      <th className="p-3 text-right">Available Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.inventory?.currentStock?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">No products catalogs registered.</td>
                      </tr>
                    ) : (
                      summary?.inventory?.currentStock?.map((it: any) => (
                        <tr key={it._id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-700">{it.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{it.sku}</td>
                          <td className="p-3 text-right font-medium text-slate-700">{formatCurrency(it.price)}</td>
                          <td className={`p-3 text-right font-extrabold ${it.currentStock < 10 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {it.currentStock} {it.uom}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FINANCE PANEL */}
        {activeTab === 'finance' && (
          <div className="space-y-8">
            {/* GST Summary & Register Valuation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Output GST (Collected from Sales)</span>
                <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(summary?.finance?.gstReport?.salesGst)}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Input GST (Paid on Purchases)</span>
                <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(summary?.finance?.gstReport?.purchaseGst)}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Net GST Liability (Sales - Purchase)</span>
                <p className={`text-2xl font-extrabold ${summary?.finance?.gstReport?.netGstPayable >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(summary?.finance?.gstReport?.netGstPayable)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sales Invoice Register */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-blue-500" /> Sales Invoice Book
                </h2>
                <div className="overflow-hidden border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                        <th className="p-3">Inv Number</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3 text-right">Taxable Val</th>
                        <th className="p-3 text-right">GST</th>
                        <th className="p-3 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary?.finance?.salesRegister?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">No sales invoices recorded.</td>
                        </tr>
                      ) : (
                        summary?.finance?.salesRegister?.map((inv: any) => (
                          <tr key={inv.invoiceNumber} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-700">{inv.invoiceNumber}</td>
                            <td className="p-3 text-slate-500 text-xs truncate max-w-[120px]">{inv.customer}</td>
                            <td className="p-3 text-right text-slate-600">{formatCurrency(inv.taxableAmount)}</td>
                            <td className="p-3 text-right text-slate-600">{formatCurrency(inv.taxAmount)}</td>
                            <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Outstanding Receivables */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <AlertCircle size={18} className="text-rose-500" /> Outstanding Receivables (Customer-wise)
                </h2>
                <div className="overflow-hidden border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                        <th className="p-3">Customer Name</th>
                        <th className="p-3 text-right">Pending Invoices</th>
                        <th className="p-3 text-right">Receivable Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary?.finance?.outstandingReceivables?.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">No outstanding client invoices.</td>
                        </tr>
                      ) : (
                        summary?.finance?.outstandingReceivables?.map((c: any) => (
                          <tr key={c.customerId} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-700">{c.name}</td>
                            <td className="p-3 text-right font-medium text-slate-500">{c.invoices?.length || 0}</td>
                            <td className="p-3 text-right font-extrabold text-rose-600">{formatCurrency(c.outstanding)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
