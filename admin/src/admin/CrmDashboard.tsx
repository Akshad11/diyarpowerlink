import React, { useEffect, useState } from 'react';
import { api } from './api';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Receipt,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const CrmDashboard = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await api.crmDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError('Failed to fetch CRM summary metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading CRM dashboard...</div>;
  }

  const statCards = [
    {
      label: 'Total Customers',
      value: summary?.totalCustomers || 0,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/crm/customers'
    },
    {
      label: 'Items / Services',
      value: summary?.totalItems || 0,
      icon: Briefcase,
      color: 'from-violet-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/crm/items'
    },
    {
      label: 'Quotations Drafted',
      value: summary?.quotations?.count || 0,
      subtext: `Value: ₹${(summary?.quotations?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: FileText,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      path: '/crm/quotations'
    },
    {
      label: 'Sales Orders',
      value: summary?.salesOrders?.count || 0,
      subtext: `Value: ₹${(summary?.salesOrders?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '/crm/sales-orders'
    }
  ];

  const unpaidVal = summary?.invoices?.unpaid || 0;
  const paidVal = summary?.invoices?.paid || 0;
  const totalInvoiced = summary?.invoices?.total || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales & CRM Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of client relationships, sales order books, quotes, and receivable balances.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(c => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              onClick={() => navigate(c.path)}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-start group"
            >
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.label}</p>
                <p className="text-3xl font-extrabold text-slate-900">{c.value}</p>
                {c.subtext && <p className="text-xs text-slate-500 font-semibold">{c.subtext}</p>}
              </div>
              <div className={`p-3 rounded-xl ${c.bgColor} ${c.textColor} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoicing Breakdown and Shortcuts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Receivables & Collections Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Receipt size={18} className="text-slate-400" /> Invoice Collections & Receivables
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Invoiced Amount</span>
              <p className="text-xl font-bold text-slate-950 mt-1">₹{totalInvoiced.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">({summary?.invoices?.count || 0} Invoices)</p>
            </div>
            
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center">
              <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                <ShieldCheck size={11} /> Realized Payments
              </span>
              <p className="text-xl font-bold text-emerald-700 mt-1">₹{paidVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">
                {totalInvoiced > 0 ? `${Math.round((paidVal / totalInvoiced) * 100)}% Collected` : '0%'}
              </p>
            </div>
            
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-center">
              <span className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                <AlertCircle size={11} /> Outstanding Receivables
              </span>
              <p className="text-xl font-bold text-amber-700 mt-1 font-extrabold">₹{unpaidVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-amber-500 mt-0.5">
                {totalInvoiced > 0 ? `${Math.round((unpaidVal / totalInvoiced) * 100)}% Pending` : '0%'}
              </p>
            </div>
          </div>

          {/* Simple Receivables progress bar */}
          <div className="space-y-2 pt-2">
            <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${totalInvoiced > 0 ? (paidVal / totalInvoiced) * 100 : 0}%` }}
                title="Collected"
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${totalInvoiced > 0 ? (unpaidVal / totalInvoiced) * 100 : 0}%` }}
                title="Pending"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Collected</span>
              <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Outstanding</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800">Quick Shortcuts</h2>
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/crm/quotations')}
              className="w-full flex items-center justify-between p-3.5 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 rounded-xl transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <PlusCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Draft Quotation</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Create proposals and add line items</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/crm/customers')}
              className="w-full flex items-center justify-between p-3.5 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 rounded-xl transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Register Customer</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Register new company contact records</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/crm/uoms-taxes')}
              className="w-full flex items-center justify-between p-3.5 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 rounded-xl transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Tax & UOM Settings</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Configure billing units and GST rates</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
