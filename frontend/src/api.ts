export const API_BASE = import.meta.env.VITE_API_URL || '';

// Global fetch interceptor to automatically attach authorization header
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === 'object' && 'url' in input) {
    url = input.url;
  }

  // Check if this request is targeting our API backend
  const isBackendRequest = 
    (API_BASE && url.startsWith(API_BASE)) || 
    url.startsWith('/api/') || 
    (!API_BASE && (url.startsWith('http://localhost') || url.startsWith('https://diyarpower')));

  if (isBackendRequest) {
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    if (token) {
      const newInit = { ...(init || {}) };
      
      let headers: Headers;
      if (newInit.headers) {
        headers = new Headers(newInit.headers);
      } else if (input instanceof Request) {
        headers = new Headers(input.headers);
      } else {
        headers = new Headers();
      }

      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      newInit.headers = headers;

      if (input instanceof Request) {
        try {
          const newRequest = input.clone();
          newRequest.headers.set('Authorization', `Bearer ${token}`);
          return originalFetch(newRequest, init);
        } catch (e) {
          console.error('Failed to intercept Request object:', e);
        }
      }

      return originalFetch(input, newInit);
    }
  }

  return originalFetch(input, init);
};

export const pingApi = async () => {
  if (!API_BASE) return;
  try {
    await fetch(API_BASE, { method: 'GET' });
  } catch {
    // Silent fail: backend may be sleeping or not configured in env
  }
};

