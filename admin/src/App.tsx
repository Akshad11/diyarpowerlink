import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminLayout } from './admin/AdminLayout';
import { AdminLogin } from './admin/AdminLogin';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminHomePage } from './admin/AdminHomePage';
import { AdminAboutPage } from './admin/AdminAboutPage';
import { AdminProductsPage } from './admin/AdminProductsPage';
import { AdminServicesPage } from './admin/AdminServicesPage';
import { AdminContactPage } from './admin/AdminContactPage';
import { AdminMedia } from './admin/AdminMedia';
import { AdminSettings } from './admin/AdminSettings';
import { AdminUsers } from './admin/AdminUsers';
import { CrmDashboard } from './admin/CrmDashboard';
import { AdminCustomers } from './admin/AdminCustomers';
import { AdminItems } from './admin/AdminItems';
import { AdminUomsTaxes } from './admin/AdminUomsTaxes';
import { AdminQuotations } from './admin/AdminQuotations';
import { AdminSalesOrders } from './admin/AdminSalesOrders';
import { AdminInvoices } from './admin/AdminInvoices';
import { AdminDeliveryNotes } from './admin/AdminDeliveryNotes';
import { ProcurementDashboard } from './admin/ProcurementDashboard';
import { AdminSuppliers } from './admin/AdminSuppliers';
import { AdminInquiries } from './admin/AdminInquiries';
import { AdminRfqs } from './admin/AdminRfqs';
import { AdminSupplierQuotations } from './admin/AdminSupplierQuotations';
import { AdminPurchaseOrders } from './admin/AdminPurchaseOrders';
import { AdminCurrencies } from './admin/AdminCurrencies';
import { AdminInventory } from './admin/AdminInventory';
import { AdminReports } from './admin/AdminReports';
import { AdminExpenses } from './admin/AdminExpenses';
import { AdminProfitLoss } from './admin/AdminProfitLoss';
import { pingApi } from './api';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoot = () => (
  <RequireAdmin>
    <AdminLayout />
  </RequireAdmin>
);

export default function App() {
  useEffect(() => {
    pingApi();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/" element={<AdminRoot />}>
          <Route index element={<AdminDashboard />} />
          <Route path="homepage" element={<AdminHomePage />} />
          <Route path="about-page" element={<AdminAboutPage />} />
          <Route path="products-page" element={<AdminProductsPage />} />
          <Route path="services-page" element={<AdminServicesPage />} />
          <Route path="contact-page" element={<AdminContactPage />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="admins" element={<AdminUsers />} />
          <Route path="crm" element={<CrmDashboard />} />
          <Route path="crm/customers" element={<AdminCustomers />} />
          <Route path="crm/items" element={<AdminItems />} />
          <Route path="crm/uoms-taxes" element={<AdminUomsTaxes />} />
          <Route path="crm/quotations" element={<AdminQuotations />} />
          <Route path="crm/sales-orders" element={<AdminSalesOrders />} />
          <Route path="crm/invoices" element={<AdminInvoices />} />
          <Route path="crm/delivery-notes" element={<AdminDeliveryNotes />} />
          <Route path="procurement" element={<ProcurementDashboard />} />
          <Route path="procurement/suppliers" element={<AdminSuppliers />} />
          <Route path="procurement/inquiries" element={<AdminInquiries />} />
          <Route path="procurement/rfqs" element={<AdminRfqs />} />
          <Route path="procurement/supplier-quotations" element={<AdminSupplierQuotations />} />
          <Route path="procurement/purchase-orders" element={<AdminPurchaseOrders />} />
          <Route path="currencies" element={<AdminCurrencies />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="expenses" element={<AdminExpenses />} />
          <Route path="profit-loss" element={<AdminProfitLoss />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
