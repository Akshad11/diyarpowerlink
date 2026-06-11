import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const loginPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate(loginPath, { replace: true });
      return;
    }
    fetch(`${API_BASE}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => {
      if (!res.ok) {
        console.error(`Session verification failed fetching ${API_BASE}/api/dashboard/summary: Status ${res.status} ${res.statusText}`);
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('admin_token');
          navigate(loginPath, { replace: true });
        }
      }
    }).catch((err) => {
      console.error(`Session verification network error fetching ${API_BASE}/api/dashboard/summary:`, err);
      // If backend is down, keep user here so they can start it
    });
  }, [navigate, loginPath]);

  const onLogout = () => {
    localStorage.removeItem('admin_token');
    navigate(loginPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 h-screen sticky top-0 overflow-y-auto overscroll-contain bg-white border-r border-slate-200 p-6 hidden lg:block shadow-lg shadow-slate-200/40">
        <div className="text-lg font-bold text-slate-900 mb-8">Admin Panel</div>
        <nav className="space-y-2">
          <Link
            to="/"
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${location.pathname === '/'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Dashboard
          </Link>
          <Link
            to="/homepage"
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${location.pathname === '/homepage'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Home Page
          </Link>
          <Link
            to="/services-page"
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${location.pathname === '/services-page'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Services
          </Link>
          <Link
            to="/products-page"
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${location.pathname === '/products-page'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Products
          </Link>
          <Link
            to="/about-page"
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${location.pathname === '/about-page'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            About
          </Link>
          <Link
            to="/contact-page"
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${location.pathname === '/contact-page'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Contact
          </Link>
          <Link
            to="/media"
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${location.pathname === '/media'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Media Library
          </Link>
          <Link
            to="/settings"
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${location.pathname === '/settings'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Settings
          </Link>
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
            <span className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sales & CRM</span>
            <Link
              to="/crm"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname === '/crm'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              CRM Dashboard
            </Link>
            <Link
              to="/crm/customers"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname === '/crm/customers'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Customer Master
            </Link>
            <Link
              to="/crm/items"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname === '/crm/items'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Item Master
            </Link>
            <Link
              to="/crm/quotations"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname.startsWith('/crm/quotations')
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Quotations
            </Link>
            <Link
              to="/crm/sales-orders"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname.startsWith('/crm/sales-orders')
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Sales Orders
            </Link>
            <Link
              to="/crm/invoices"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname.startsWith('/crm/invoices')
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Invoices
            </Link>
            <Link
              to="/crm/uoms-taxes"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname === '/crm/uoms-taxes'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              UOMs & Taxes
            </Link>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
            <span className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Procurement & Purchase</span>
            <Link
              to="/procurement"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname === '/procurement'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Procurement Dashboard
            </Link>
            <Link
              to="/procurement/suppliers"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname.startsWith('/procurement/suppliers')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Supplier Master
            </Link>
            <Link
              to="/procurement/inquiries"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname.startsWith('/procurement/inquiries')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Purchase Inquiries
            </Link>
            <Link
              to="/procurement/rfqs"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname.startsWith('/procurement/rfqs')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              RFQs (Request Quote)
            </Link>
            <Link
              to="/procurement/supplier-quotations"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname.startsWith('/procurement/supplier-quotations')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Supplier Quotes
            </Link>
            <Link
              to="/procurement/purchase-orders"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname.startsWith('/procurement/purchase-orders')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Purchase Orders (PO)
            </Link>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
            <span className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Inventory & Finance</span>
            <Link
              to="/inventory"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname.startsWith('/inventory')
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Inventory Management
            </Link>
            <Link
              to="/reports"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname === '/reports'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Analytics & Reports
            </Link>
            <Link
              to="/currencies"
              className={`block px-4 py-2 rounded-xl text-sm font-semibold ${location.pathname === '/currencies'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Exchange Rates
            </Link>
          </div>
        </nav>
        <button
          onClick={onLogout}
          className="mt-8 w-full text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl py-2"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
