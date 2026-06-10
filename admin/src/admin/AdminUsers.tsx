import React, { useEffect, useState } from 'react';
import { api } from './api';

const empty = { name: '', email: '', password: '', role: 'admin' };

export const AdminUsers = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  const load = () => api.list('admin-users').then(setItems);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaveState('saving');
    try {
      const payload: any = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      if (editingId) await api.update('admin-users', editingId, payload);
      else await api.create('admin-users', payload);
      setSaveState('saved');
      setForm(empty);
      setEditingId(null);
      load();
    } catch (err: any) {
      setSaveState('error');
      setError(err?.message || 'Save failed');
    }
  };

  const edit = (item: any) => {
    setEditingId(item._id);
    setForm({ name: item.name || '', email: item.email || '', password: '', role: item.role || 'admin' });
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this admin?')) return;
    setSaveState('saving');
    try {
      await api.remove('admin-users', id);
      setSaveState('saved');
      load();
    } catch {
      setSaveState('error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Users</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit Admin' : 'Add Admin'}</h2>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2" required />
          <input type="password" placeholder={editingId ? 'New Password (optional)' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2" required={!editingId} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2">
            <option value="admin">Admin</option>
            <option value="super">Super Admin</option>
          </select>
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex items-center gap-3">
            <button className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold">
              {saveState === 'saving' ? 'Saving...' : 'Save'}
            </button>
            {saveState === 'saved' && <span className="text-xs text-emerald-600">Saved</span>}
            {saveState === 'error' && <span className="text-xs text-red-600">Save failed</span>}
          </div>
        </form>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Current Admins</h3>
            <span className="text-xs text-slate-500">{items.length} users</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item._id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                <p className="font-semibold text-slate-900">{item.name || 'Admin'}</p>
                <p className="text-xs text-slate-500 mb-2">{item.email}</p>
                <p className="text-xs font-semibold text-blue-600 mb-2">{item.role}</p>
                <div className="flex gap-2">
                  <button onClick={() => edit(item)} className="text-sm text-blue-600">Edit</button>
                  <button onClick={() => remove(item._id)} className="text-sm text-red-600">Delete</button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-slate-500">No admin users yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
