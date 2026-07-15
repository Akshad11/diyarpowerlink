import { API_BASE } from '../api';

const base = API_BASE || '';

const authHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 400) {
        throw new Error('Invalid email or password');
      }
      throw new Error(`Server error (${res.status}): Please check your backend connection.`);
    }
    return res.json();
  },
  summary: async () => {
    const res = await fetch(`${base}/api/dashboard/summary`, {
      headers: authHeaders(),
      cache: 'no-store'
    });
    if (res.status === 304 || res.status === 204) return {};
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  list: async (resource: string) => {
    const res = await fetch(`${base}/api/${resource}`, {
      headers: authHeaders(),
      cache: 'no-store'
    });
    if (res.status === 304 || res.status === 204) return [];
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  create: (resource: string, data: any) => fetch(`${base}/api/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Request failed with status ${r.status}`);
    }
    return r.json();
  }),
  update: (resource: string, id: string, data: any) => fetch(`${base}/api/${resource}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Request failed with status ${r.status}`);
    }
    return r.json();
  }),
  remove: (resource: string, id: string) => fetch(`${base}/api/${resource}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(async r => {
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Request failed with status ${r.status}`);
    }
    return r.json();
  }),
  patch: (resource: string, id: string, data: any) => fetch(`${base}/api/${resource}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Request failed with status ${r.status}`);
    }
    return r.json();
  }),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${base}/api/media`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: form
    }).then(async r => {
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Upload failed with status ${r.status}`);
      }
      return r.json();
    });
  },
  seedDefaults: () => fetch(`${base}/api/admin/seed-defaults`, {
    method: 'POST',
    headers: authHeaders()
  }).then(async r => {
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Restore failed with status ${r.status}`);
    }
    return r.json();
  }),
  crmDashboardSummary: async () => {
    const res = await fetch(`${base}/api/crm/dashboard-summary`, {
      headers: authHeaders(),
      cache: 'no-store'
    });
    if (res.status === 304 || res.status === 204) return {};
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  procurementDashboardSummary: async () => {
    const res = await fetch(`${base}/api/procurement/dashboard-summary`, {
      headers: authHeaders(),
      cache: 'no-store'
    });
    if (res.status === 304 || res.status === 204) return {};
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  sendCrmEmail: async (data: { to: string; subject: string; body: string; pdfBase64?: string; filename?: string }) => {
    const res = await fetch(`${base}/api/crm/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to send email');
    return res.json();
  },
  reportsSummary: async () => {
    const res = await fetch(`${base}/api/reports/summary`, {
      headers: authHeaders(),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  listExpenses: async (filters?: { category?: string; startDate?: string; endDate?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${base}/api/expenses${query}`, {
      headers: authHeaders(),
      cache: 'no-store'
    });
    if (res.status === 304 || res.status === 204) return [];
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  profitLossReport: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${base}/api/reports/profit-loss${query}`, {
      headers: authHeaders(),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }
};
