import React, { useEffect, useState } from 'react';
import { api } from './api';
import { generateProfitLossPdf } from './generateProfitLossPdf';
import {
  TrendingUp,
  Briefcase,
  AlertTriangle,
  Receipt,
  FileText,
  DollarSign,
  Calendar,
  Percent,
  Download,
  ArrowUpRight,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

export const AdminProfitLoss = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Date range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<string>('this-fy');

  const fetchReport = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const data = await api.profitLossReport(start, end);
      setReport(data);
      if (data.period) {
        setStartDate(new Date(data.period.startDate).toISOString().substring(0, 10));
        setEndDate(new Date(data.period.endDate).toISOString().substring(0, 10));
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch Profit and Loss details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch using default dates (which will be this financial year by backend default)
    fetchReport();
  }, []);

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePreset('custom');
    fetchReport(startDate, endDate);
  };

  const handleApplyPreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    const currentYear = now.getFullYear();
    let start = '';
    let end = '';

    switch (preset) {
      case 'this-month':
        start = new Date(currentYear, now.getMonth(), 1).toISOString().substring(0, 10);
        end = now.toISOString().substring(0, 10);
        break;
      case 'last-month':
        start = new Date(currentYear, now.getMonth() - 1, 1).toISOString().substring(0, 10);
        end = new Date(currentYear, now.getMonth(), 0).toISOString().substring(0, 10);
        break;
      case 'this-quarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3); // 0 to 3
        start = new Date(currentYear, currentQuarter * 3, 1).toISOString().substring(0, 10);
        end = now.toISOString().substring(0, 10);
        break;
      }
      case 'this-fy':
        if (now.getMonth() >= 3) {
          start = new Date(currentYear, 3, 1).toISOString().substring(0, 10);
        } else {
          start = new Date(currentYear - 1, 3, 1).toISOString().substring(0, 10);
        }
        end = now.toISOString().substring(0, 10);
        break;
      case 'last-fy':
        if (now.getMonth() >= 3) {
          start = new Date(currentYear - 1, 3, 1).toISOString().substring(0, 10);
          end = new Date(currentYear, 2, 31).toISOString().substring(0, 10);
        } else {
          start = new Date(currentYear - 2, 3, 1).toISOString().substring(0, 10);
          end = new Date(currentYear - 1, 2, 31).toISOString().substring(0, 10);
        }
        break;
    }

    fetchReport(start, end);
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    setGeneratingPdf(true);
    try {
      const settings = await api.list('settings');
      const doc = generateProfitLossPdf(report, settings?.[0] || {});
      const dateRangeSlug = `${startDate}_to_${endDate}`;
      doc.save(`Profit_and_Loss_Statement_${dateRangeSlug}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF statement.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const calculateMargin = (profit: number, revenue: number) => {
    if (!revenue || revenue <= 0) return '0%';
    return `${((profit / revenue) * 100).toFixed(1)}%`;
  };

  if (loading && !report) {
    return <div className="text-center py-12 text-slate-500">Compiling financial logs...</div>;
  }

  // Find max value in monthly trends for chart scaling
  const maxTrendVal = report?.trends?.reduce((max: number, t: any) => {
    const vals = [t.revenue || 0, t.cogs || 0, t.expenses || 0];
    return Math.max(max, ...vals);
  }, 1000) || 1000;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profit & Loss Statement</h1>
          <p className="text-sm text-slate-500">
            Analyze company revenues, direct production costs, and overhead expenditures net of tax liabilities.
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={generatingPdf}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center gap-2 w-fit cursor-pointer disabled:opacity-50"
        >
          {generatingPdf ? (
            <>
              <RefreshCw className="animate-spin" size={16} /> Generating...
            </>
          ) : (
            <>
              <Download size={16} /> Export Statement
            </>
          )}
        </button>
      </div>

      {/* Date Range Selector and Presets */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'this-month', label: 'This Month' },
              { id: 'last-month', label: 'Last Month' },
              { id: 'this-quarter', label: 'This Quarter' },
              { id: 'this-fy', label: 'This FY' },
              { id: 'last-fy', label: 'Last FY' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activePreset === preset.id
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-extrabold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleApplyCustomDates} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">START DATE</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">END DATE</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-400"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Apply Filter
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {report && (
        <>
          {/* Summary KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Revenue</span>
              <p className="text-xl font-extrabold text-slate-900">{formatCurrency(report.revenue.totalRevenue)}</p>
              <span className="text-xs text-emerald-600 font-bold block flex items-center gap-0.5">
                <ArrowUpRight size={14} /> Inflow
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cost of Sales</span>
              <p className="text-xl font-extrabold text-slate-900">{formatCurrency(report.cogs.totalCogs)}</p>
              <span className="text-xs text-rose-600 font-bold block flex items-center gap-0.5">
                <TrendingDown size={14} /> Production Cost
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gross Profit</span>
              <p className="text-xl font-extrabold text-slate-900">{formatCurrency(report.grossProfit)}</p>
              <span className="text-xs text-slate-500 font-bold block">
                Margin: {calculateMargin(report.grossProfit, report.revenue.totalRevenue)}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Expenses</span>
              <p className="text-xl font-extrabold text-slate-900">{formatCurrency(report.totalExpenses)}</p>
              <span className="text-xs text-rose-600 font-bold block flex items-center gap-0.5">
                <TrendingDown size={14} /> Operating Cost
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Net Profit</span>
              <p className={`text-xl font-extrabold ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(report.netProfit)}
              </p>
              <span className={`text-xs font-bold block ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                Margin: {calculateMargin(report.netProfit, report.revenue.totalRevenue)}
              </span>
            </div>
          </div>

          {/* Income Statement Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Statement of Operations</h3>
              <p className="text-xs text-slate-400 mt-1">Structured operational figures in local base currency (INR).</p>
            </div>

            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <tbody className="divide-y divide-slate-100">
                  {/* Revenue section */}
                  <tr className="bg-slate-50/70">
                    <td colSpan={2} className="p-3.5 font-bold text-slate-800">1. Revenue / Operating Income</td>
                  </tr>
                  <tr className="hover:bg-slate-50/30">
                    <td className="p-3.5 text-slate-600 pl-8">Product Sales Revenue</td>
                    <td className="p-3.5 text-right font-semibold text-slate-700">{formatCurrency(report.revenue.productRevenue)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/30">
                    <td className="p-3.5 text-slate-600 pl-8">Service Sales Revenue</td>
                    <td className="p-3.5 text-right font-semibold text-slate-700">{formatCurrency(report.revenue.serviceRevenue)}</td>
                  </tr>
                  <tr className="font-bold bg-slate-50/20">
                    <td className="p-3.5 text-slate-800 pl-8">Total Operating Revenue</td>
                    <td className="p-3.5 text-right text-slate-900">{formatCurrency(report.revenue.totalRevenue)}</td>
                  </tr>

                  {/* Cost of Goods Sold section */}
                  <tr className="bg-slate-50/70">
                    <td colSpan={2} className="p-3.5 font-bold text-slate-800">2. Cost of Sales / Production Cost (COGS)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/30">
                    <td className="p-3.5 text-slate-600 pl-8">Product Purchase Costs</td>
                    <td className="p-3.5 text-right font-semibold text-slate-700">{formatCurrency(report.cogs.productCogs)}</td>
                  </tr>
                  {report.cogs.serviceCogs > 0 && (
                    <tr className="hover:bg-slate-50/30">
                      <td className="p-3.5 text-slate-600 pl-8">Service Procurement Cost</td>
                      <td className="p-3.5 text-right font-semibold text-slate-700">{formatCurrency(report.cogs.serviceCogs)}</td>
                    </tr>
                  )}
                  <tr className="font-bold bg-slate-50/20">
                    <td className="p-3.5 text-slate-800 pl-8">Total Cost of Sales</td>
                    <td className="p-3.5 text-right text-slate-900">{formatCurrency(report.cogs.totalCogs)}</td>
                  </tr>

                  {/* Gross Profit section */}
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-3.5 text-slate-900">GROSS TRADING PROFIT</td>
                    <td className="p-3.5 text-right text-slate-900">{formatCurrency(report.grossProfit)}</td>
                  </tr>

                  {/* Operating Expenses section */}
                  <tr className="bg-slate-50/70">
                    <td colSpan={2} className="p-3.5 font-bold text-slate-800">3. Operating Expenses (OPEX)</td>
                  </tr>
                  {report.expenses.map((exp: any) => (
                    <tr key={exp.category} className="hover:bg-slate-50/30">
                      <td className="p-3.5 text-slate-600 pl-8">{exp.category}</td>
                      <td className="p-3.5 text-right font-semibold text-slate-700">{formatCurrency(exp.amount)}</td>
                    </tr>
                  ))}
                  {report.expenses.length === 0 && (
                    <tr>
                      <td className="p-3.5 text-slate-400 pl-8 italic">No operating expenses logged in this range</td>
                      <td className="p-3.5 text-right text-slate-400 font-mono">-</td>
                    </tr>
                  )}
                  <tr className="font-bold bg-slate-50/20">
                    <td className="p-3.5 text-slate-800 pl-8">Total Operating Expenses</td>
                    <td className="p-3.5 text-right text-slate-900">{formatCurrency(report.totalExpenses)}</td>
                  </tr>

                  {/* Net Profit section */}
                  <tr className={`font-bold text-base border-t-2 border-slate-200 ${report.netProfit >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                    <td className="p-4 uppercase tracking-wide">NET OPERATIONAL PROFIT</td>
                    <td className="p-4 text-right">{formatCurrency(report.netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trend Visualizer */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Operational Trends</h3>
              <p className="text-xs text-slate-400 mt-1">Comparison of Revenue, Cost of Sales, and Operating Expenses monthly.</p>
            </div>

            {report.trends?.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">No historical data available for trend analysis.</p>
            ) : (
              <div className="space-y-8">
                {/* Visual Chart Grid */}
                <div className="flex flex-col gap-6 md:flex-row items-end justify-between h-64 border-b border-slate-100 pb-2 overflow-y-hidden overflow-x-auto pt-6 px-4">
                  {report.trends.map((t: any) => {
                    const revH = (t.revenue / maxTrendVal) * 100;
                    const cogsH = (t.cogs / maxTrendVal) * 100;
                    const expH = (t.expenses / maxTrendVal) * 100;

                    return (
                      <div key={t.month} className="flex flex-col items-center gap-2 flex-1 min-w-[70px] max-w-[120px]">
                        <div className="flex items-end justify-center gap-1.5 h-44 w-full">
                          {/* Revenue bar */}
                          <div
                            className="w-3.5 bg-blue-500 rounded-t-sm hover:opacity-85 transition-all relative group cursor-pointer"
                            style={{ height: `${Math.max(revH, 2)}%` }}
                          >
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[9px] px-1 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              Rev: {formatCurrency(t.revenue)}
                            </span>
                          </div>
                          {/* Cost/COGS bar */}
                          <div
                            className="w-3.5 bg-amber-500 rounded-t-sm hover:opacity-85 transition-all relative group cursor-pointer"
                            style={{ height: `${Math.max(cogsH, 2)}%` }}
                          >
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[9px] px-1 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              COGS: {formatCurrency(t.cogs)}
                            </span>
                          </div>
                          {/* Expense bar */}
                          <div
                            className="w-3.5 bg-rose-500 rounded-t-sm hover:opacity-85 transition-all relative group cursor-pointer"
                            style={{ height: `${Math.max(expH, 2)}%` }}
                          >
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[9px] px-1 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              Opex: {formatCurrency(t.expenses)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{t.month}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Chart Legend */}
                <div className="flex justify-center gap-6 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 bg-blue-500 rounded" /> Revenue
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 bg-amber-500 rounded" /> Cost of Sales (COGS)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 bg-rose-500 rounded" /> Operating Expenses
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
