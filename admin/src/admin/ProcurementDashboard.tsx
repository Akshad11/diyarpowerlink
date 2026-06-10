import React, { useEffect, useState } from 'react';
import { api } from './api';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  FileQuestion,
  Send,
  ShoppingBag,
  PlusCircle,
  ArrowRight,
  ClipboardList,
  Clock,
  AlertCircle
} from 'lucide-react';

export const ProcurementDashboard = () => {
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
      const data = await api.procurementDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError('Failed to fetch procurement summary metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading procurement dashboard...</div>;
  }

  const statCards = [
    {
      label: 'Suppliers',
      value: summary?.totalSuppliers || 0,
      icon: Truck,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      path: '/procurement/suppliers'
    },
    {
      label: 'Purchase Inquiries',
      value: summary?.totalInquiries || 0,
      icon: FileQuestion,
      color: 'from-violet-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/procurement/inquiries'
    },
    {
      label: 'RFQs Issued',
      value: summary?.rfqs?.count || 0,
      icon: Send,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      path: '/procurement/rfqs'
    },
    {
      label: 'Purchase Orders',
      value: summary?.purchaseOrders?.count || 0,
      subtext: `Total Value: ₹${(summary?.purchaseOrders?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: ShoppingBag,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '/procurement/purchase-orders'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Procurement & Supplier Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of supplier records, RFQs, purchase requests, quotes and purchase orders.</p>
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

      {/* Order Status & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Procurement Summary card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList size={18} className="text-slate-400" /> Procurement Pipeline Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pending PO Delivery</p>
                <p className="text-2xl font-extrabold text-slate-950 mt-1">{summary?.pendingOrders || 0}</p>
                <p className="text-xs text-slate-400 mt-0.5">PO status is 'draft' or 'ordered'</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                <Send size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Inquiries</p>
                <p className="text-2xl font-extrabold text-slate-950 mt-1">{summary?.totalInquiries || 0}</p>
                <p className="text-xs text-slate-400 mt-0.5">Inquiries converted or draft</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shortcuts Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800">Quick Shortcuts</h2>
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/procurement/inquiries')}
              className="w-full flex items-center justify-between p-3.5 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 rounded-xl transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <PlusCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Create Inquiry</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Internal purchase requests</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/procurement/suppliers')}
              className="w-full flex items-center justify-between p-3.5 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 rounded-xl transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Truck size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Add Supplier</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Register supplier details</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/procurement/supplier-quotations')}
              className="w-full flex items-center justify-between p-3.5 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 rounded-xl transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <PlusCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Log Supplier Quote</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Record incoming vendor bids</p>
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
