import React, { useEffect, useState } from 'react';
import { api } from './api';
import { API_BASE } from '../api';
import { UploadField } from './UploadField';
import { AdminUsers } from './AdminUsers';

export const AdminSettings = () => {
  const [form, setForm] = useState<any>({
    websiteName: 'Diyar Power Link LLP',
    logo: '',
    companyGst: '',
    companyTaxNo: '',
    footerText: 'Diyar Power Link LLP and Diyar Computers: Your One Shop for All IT Needs. Providing high-quality IT hardware, specialized paper products, medical supplies, and industrial packaging solutions across India.',
    footerDivisions: [
      'IT Solutions & Infrastructure',
      'Paper Products & Thermal Rolls',
      'Medical Supplies & Wristbands',
      'Packaging Materials & Tools',
      'Technical Services & Support'
    ],
    socialLinks: { facebook: '', instagram: '', linkedin: '', twitter: '' },
    socialVisibility: { facebook: true, instagram: true, linkedin: true, twitter: true },
    contactRecipient: '',
    posBarcodeCategories: 'Paper Products, Thermal Labels'
  });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [seedState, setSeedState] = useState<'idle' | 'seeding' | 'done' | 'error'>('idle');
  const [section, setSection] = useState<'Brand' | 'Social' | 'Contact' | 'Admin Users'>('Brand');

  useEffect(() => {
    api.list('settings')
      .then((data) => {
        if (data && data._id) {
          setForm((prev: any) => ({
            ...prev,
            ...data,
            socialLinks: { ...prev.socialLinks, ...(data.socialLinks || {}) },
            socialVisibility: { ...prev.socialVisibility, ...(data.socialVisibility || {}) },
            posBarcodeCategories: Array.isArray(data.posBarcodeCategories)
              ? data.posBarcodeCategories.join(', ')
              : (data.posBarcodeCategories || prev.posBarcodeCategories)
          }));
        }
      })
      .catch(() => null);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState('saving');
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('admin_token')
            ? { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            : {})
        },
        body: JSON.stringify({
          websiteName: form.websiteName,
          logo: form.logo,
          companyGst: form.companyGst || '',
          companyTaxNo: form.companyTaxNo || '',
          footerText: form.footerText,
          footerDivisions: form.footerDivisions,
          socialLinks: form.socialLinks,
          socialVisibility: form.socialVisibility,
          contactRecipient: form.contactRecipient,
          posBarcodeCategories: String(form.posBarcodeCategories || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        })
      });
      setSaveState(res.ok ? 'saved' : 'error');
    } catch {
      setSaveState('error');
    }
  };

  const clearSettings = () => {
    setForm({
      ...form,
      websiteName: '',
      logo: '',
      companyGst: '',
      companyTaxNo: '',
      socialLinks: { facebook: '', instagram: '', linkedin: '', twitter: '' },
      socialVisibility: { facebook: true, instagram: true, linkedin: true, twitter: true },
      contactRecipient: '',
      posBarcodeCategories: ''
    });
  };

  const seedDefaults = async () => {
    setSeedState('seeding');
    try {
      const res = await api.seedDefaults();
      setSeedState(res?.ok ? 'done' : 'error');
    } catch {
      setSeedState('error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      <div className="flex flex-wrap gap-2 mb-6">
      {(['Brand', 'Social', 'Contact', 'POS Barcode', 'Admin Users'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSection(item)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${section === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={seedDefaults}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm hover:bg-slate-100"
        >
          {seedState === 'seeding' ? 'Restoring Defaults...' : 'Restore Default Content'}
        </button>
        {seedState === 'done' && <span className="text-sm text-emerald-600">Defaults restored</span>}
        {seedState === 'error' && <span className="text-sm text-red-600">Restore failed</span>}
      </div>
      {section === 'Admin Users' ? (
        <AdminUsers />
      ) : (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          {section === 'Brand' && (
            <>
              <h2 className="text-lg font-semibold text-slate-800">Brand & Company Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Website / Company Name</label>
                  <input placeholder="Website Name" value={form.websiteName || ''} onChange={(e) => setForm({ ...form, websiteName: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Company GST Number</label>
                  <input placeholder="Company GST" value={form.companyGst || ''} onChange={(e) => setForm({ ...form, companyGst: e.target.value.toUpperCase() })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Company Tax/Registration No.</label>
                  <input placeholder="Company Tax No" value={form.companyTaxNo || ''} onChange={(e) => setForm({ ...form, companyTaxNo: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <UploadField label="Logo" value={form.logo || ''} onChange={(val) => setForm({ ...form, logo: val })} />
              </div>
            </>
          )}
          {section === 'Social' && (
            <>
              <h2 className="text-lg font-semibold text-slate-800">Social Links</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  { key: 'facebook', label: 'Facebook' },
                  { key: 'instagram', label: 'Instagram' },
                  { key: 'linkedin', label: 'LinkedIn' },
                  { key: 'twitter', label: 'Twitter' }
                ].map((item) => (
                  <div key={item.key} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={form.socialVisibility?.[item.key] ?? true}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              socialVisibility: { ...form.socialVisibility, [item.key]: e.target.checked }
                            })
                          }
                        />
                        Show on site
                      </label>
                    </div>
                    <input
                      placeholder={`${item.label} URL`}
                      value={form.socialLinks?.[item.key] || ''}
                      onChange={(e) =>
                        setForm({ ...form, socialLinks: { ...form.socialLinks, [item.key]: e.target.value } })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          {section === 'Contact' && (
            <>
              <h2 className="text-lg font-semibold text-slate-800">Contact Emails</h2>
              <p className="text-sm text-slate-500">Contact form submissions will be sent to this email.</p>
              <input
                placeholder="Recipient Email"
                value={form.contactRecipient || ''}
                onChange={(e) => setForm({ ...form, contactRecipient: e.target.value })}
                className="border border-slate-200 rounded-xl px-3 py-2"
              />
            </>
          )}
          {section === 'POS Barcode' && (
            <>
              <h2 className="text-lg font-semibold text-slate-800">POS Barcode Products</h2>
              <p className="text-sm text-slate-500">Comma-separated category names to show on /pos-barcode-products.</p>
              <input
                placeholder="e.g. Paper Products, Thermal Labels"
                value={form.posBarcodeCategories || ''}
                onChange={(e) => setForm({ ...form, posBarcodeCategories: e.target.value })}
                className="border border-slate-200 rounded-xl px-3 py-2"
              />
            </>
          )}
          <div className="flex items-center gap-3">
            <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold">
              {saveState === 'saving' ? 'Saving...' : 'Save Settings'}
            </button>
            <button type="button" onClick={clearSettings} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm">
              Clear Section
            </button>
            {saveState === 'saved' && <span className="text-sm text-emerald-600">Saved</span>}
            {saveState === 'error' && <span className="text-sm text-red-600">Save failed</span>}
          </div>
        </form>
      )}
    </div>
  );
};
