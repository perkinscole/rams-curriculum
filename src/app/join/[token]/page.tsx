'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/join?token=${encodeURIComponent(token)}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) setLoadError(data.error || 'Join link not valid.');
        else setDistrictName(data.district.name);
      })
      .catch(() => setLoadError('Could not load join link.'));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not join.');
        return;
      }
      window.location.href = '/teacher';
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Join link unavailable</h1>
          <p className="text-slate-600 text-sm">{loadError}</p>
          <p className="text-slate-500 text-sm mt-4">Ask your curriculum coordinator for an updated link.</p>
        </div>
      </div>
    );
  }

  if (!districtName) {
    return <div className="p-12 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-indigo-500 text-white font-serif text-xl font-bold mb-3">C</span>
          <h1 className="text-2xl font-bold text-slate-800">Join {districtName}</h1>
          <p className="text-slate-500 text-sm mt-1">Create your teacher account in Curriclio.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Work Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="you@yourdistrict.org" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department (optional)</label>
            <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Science, ELA, etc." />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              minLength={8} required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="At least 8 characters" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-indigo-500 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-400 disabled:opacity-50">
            {submitting ? 'Creating account...' : `Join ${districtName}`}
          </button>
        </form>
      </div>
    </div>
  );
}
