import React, { useState } from 'react';
import { api } from './api';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.login(email, password);
      localStorage.setItem('admin_token', res.token);
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to connect to the server');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Login</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to manage website content.</p>
        {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-2.5" required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-2.5" required />
          </div>
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">Login</button>
        </form>
      </div>
    </div>
  );
};
