'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface InvitationInfo {
  email: string;
  name: string;
  role: 'teacher' | 'admin';
  department: string;
  districtName: string;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/invitations/accept?token=${encodeURIComponent(token)}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) setLoadError(data.error || 'Invitation not valid.');
        else setInfo(data.invitation);
      })
      .catch(() => setLoadError('Could not load invitation.'));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not accept invitation.');
        return;
      }
      window.location.href = data.user.role === 'admin' ? '/admin' : '/teacher';
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Invitation unavailable</h1>
          <p className="text-slate-600 text-sm">{loadError}</p>
          <p className="text-slate-500 text-sm mt-4">Ask your district admin for a new invite link.</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return <div className="p-12 text-center text-slate-500">Loading invitation...</div>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-indigo-500 text-white font-serif text-xl font-bold mb-3">C</span>
          <h1 className="text-2xl font-bold text-slate-800">You&rsquo;re invited</h1>
          <p className="text-slate-600 text-sm mt-2">
            Join <strong>{info.districtName}</strong> on Curriclio as a {info.role === 'admin' ? 'curriculum admin' : 'teacher'}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 rounded p-3 text-sm">
            <p><span className="text-slate-500">Name:</span> {info.name}</p>
            <p><span className="text-slate-500">Email:</span> {info.email}</p>
            {info.department && <p><span className="text-slate-500">Department:</span> {info.department}</p>}
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Choose a password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              minLength={8} required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="At least 8 characters" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-indigo-500 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-400 disabled:opacity-50">
            {submitting ? 'Creating account...' : 'Accept Invitation & Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
