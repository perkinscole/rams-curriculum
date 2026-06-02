'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface DistrictUser {
  id: number;
  email: string;
  name: string;
  role: 'teacher' | 'admin';
  department: string;
  created_at: string;
}

interface Invitation {
  id: number;
  token: string;
  email: string;
  name: string;
  role: 'teacher' | 'admin';
  department: string;
  created_at: string;
  accepted_at: string | null;
  expires_at: string;
}

interface CreatedInvite {
  id: number;
  email: string;
  name: string;
  joinUrl: string;
  error?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DistrictUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'single' | 'csv'>('single');

  // single invite form
  const [form, setForm] = useState({ name: '', email: '', role: 'teacher' as 'teacher' | 'admin', department: '' });

  // csv paste
  const [csv, setCsv] = useState('');

  const [created, setCreated] = useState<CreatedInvite[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [u, i, j] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/invitations').then(r => r.json()),
      fetch('/api/district/join-link').then(r => r.json()),
    ]);
    setUsers(u.users || []);
    setInvitations(i.invitations || []);
    setJoinToken(j.joinToken || null);
    setLoading(false);
  }, []);

  const generateJoinLink = async () => {
    setJoinBusy(true);
    const res = await fetch('/api/district/join-link', { method: 'POST' });
    const data = await res.json();
    setJoinToken(data.joinToken);
    setJoinBusy(false);
  };

  const disableJoinLink = async () => {
    if (!confirm('Disable the join link? Anyone with the current link will no longer be able to join. You can generate a new one anytime.')) return;
    setJoinBusy(true);
    await fetch('/api/district/join-link', { method: 'DELETE' });
    setJoinToken(null);
    setJoinBusy(false);
  };

  useEffect(() => { refresh(); }, [refresh]);

  const sendInvites = async (invites: Array<{ name: string; email: string; role?: string; department?: string }>) => {
    setSubmitting(true);
    setError('');
    setCreated([]);
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invites }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not create invitations.');
        return;
      }
      setCreated(data.invitations || []);
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendInvites([form]);
    setForm({ name: '', email: '', role: 'teacher', department: '' });
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // Detect header
    const headerLine = lines[0].toLowerCase();
    const hasHeader = headerLine.includes('email') || headerLine.includes('name');
    const rows = hasHeader ? lines.slice(1) : lines;

    const invites = rows.map(row => {
      const cells = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        name: cells[0] || '',
        email: cells[1] || '',
        role: (cells[2] === 'admin' ? 'admin' : 'teacher'),
        department: cells[3] || '',
      };
    }).filter(r => r.name && r.email);

    if (invites.length === 0) {
      setError('No valid rows found. Expected columns: name, email, role (optional), department (optional)');
      return;
    }
    await sendInvites(invites);
    setCsv('');
  };

  const revoke = async (id: number) => {
    if (!confirm('Revoke this invitation?')) return;
    await fetch(`/api/invitations/${id}`, { method: 'DELETE' });
    refresh();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const pending = invitations.filter(i => !i.accepted_at && new Date(i.expires_at).getTime() > Date.now());

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-2 mb-6">Manage Teachers</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-indigo-500">
        <h2 className="font-bold text-slate-800 mb-1">District join link</h2>
        <p className="text-sm text-slate-500 mb-4">
          Share one link with all your teachers. Anyone who has it can self-register as a teacher
          in your district &mdash; like a Google Classroom code. Generate a new link anytime to revoke the old one.
        </p>

        {joinToken ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <input
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/join/${joinToken}` : `/join/${joinToken}`}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono bg-slate-50"
                onFocus={e => e.target.select()}
              />
              <button onClick={() => copyToClipboard(`${window.location.origin}/join/${joinToken}`)}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-400 whitespace-nowrap">
                Copy Link
              </button>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={generateJoinLink} disabled={joinBusy}
                className="text-indigo-600 hover:underline disabled:opacity-50">
                Generate a new link (invalidates this one)
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={disableJoinLink} disabled={joinBusy}
                className="text-red-600 hover:underline disabled:opacity-50">
                Disable join link
              </button>
            </div>
          </div>
        ) : (
          <button onClick={generateJoinLink} disabled={joinBusy}
            className="bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-400 disabled:opacity-50">
            {joinBusy ? 'Creating link...' : 'Create District Join Link'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="font-bold text-slate-800 mb-1">Or invite specific people</h2>
        <p className="text-sm text-slate-500 mb-4">
          We&rsquo;ll generate a secure join link for each person. Email it to them &mdash; they pick their own password
          and are signed in instantly. Links expire after 14 days.
        </p>

        <div className="flex gap-1 mb-4 border-b">
          <button onClick={() => setTab('single')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === 'single' ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>One at a time</button>
          <button onClick={() => setTab('csv')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === 'csv' ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>Bulk paste (CSV)</button>
        </div>

        {tab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'teacher' | 'admin' })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2">
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department (optional)</label>
              <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Science, ELA, etc." />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting}
                className="bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-400 disabled:opacity-50">
                {submitting ? 'Creating link...' : 'Create Invite Link'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCsvSubmit}>
            <p className="text-xs text-slate-500 mb-2">
              One person per line. Columns: <code>name, email, role, department</code> (role and department optional).
              A header row is optional &mdash; we detect it.
            </p>
            <textarea
              value={csv}
              onChange={e => setCsv(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 h-40 font-mono text-sm"
              placeholder={`Jane Smith, jane@yourschool.org, teacher, Science\nMarcus Garcia, marcus@yourschool.org, teacher, Social Studies`}
            />
            <button type="submit" disabled={submitting}
              className="mt-3 bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-400 disabled:opacity-50">
              {submitting ? 'Creating links...' : 'Create Invite Links'}
            </button>
          </form>
        )}

        {error && <div className="mt-4 bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

        {created.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-slate-800 mb-2">{created.length} invite{created.length !== 1 ? 's' : ''} created</h3>
            <p className="text-xs text-slate-500 mb-3">Email these links to each person. Each link is single-use and expires in 14 days.</p>
            <div className="space-y-2">
              {created.map((c, i) => (
                <div key={i} className={`p-3 rounded border ${c.error ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">{c.name} <span className="text-slate-500 font-normal">&middot; {c.email}</span></p>
                      {c.error ? (
                        <p className="text-sm text-red-600 mt-1">{c.error}</p>
                      ) : (
                        <p className="text-xs font-mono text-slate-600 mt-1 truncate">{c.joinUrl}</p>
                      )}
                    </div>
                    {!c.error && (
                      <button onClick={() => copyToClipboard(c.joinUrl)}
                        className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">
                        Copy Link
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-800">Pending invitations ({pending.length})</h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase">
              <tr><th className="text-left px-4 py-2">Name</th><th className="text-left px-4 py-2">Email</th><th className="text-left px-4 py-2">Role</th><th className="text-left px-4 py-2">Expires</th><th className="px-4 py-2"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-sm font-medium text-slate-700">{inv.name}</td>
                  <td className="px-4 py-2 text-sm text-slate-600">{inv.email}</td>
                  <td className="px-4 py-2 text-sm text-slate-600 capitalize">{inv.role}</td>
                  <td className="px-4 py-2 text-xs text-slate-400">{new Date(inv.expires_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => copyToClipboard(`${window.location.origin}/invite/${inv.token}`)}
                      className="text-xs text-indigo-600 hover:underline mr-3">Copy Link</button>
                    <button onClick={() => revoke(inv.id)}
                      className="text-xs text-red-600 hover:underline">Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">Active users ({users.length})</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase">
            <tr><th className="text-left px-4 py-2">Name</th><th className="text-left px-4 py-2">Email</th><th className="text-left px-4 py-2">Role</th><th className="text-left px-4 py-2">Department</th><th className="text-left px-4 py-2">Joined</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">No users yet.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-sm text-slate-700 font-medium">{u.name}</td>
                <td className="px-4 py-2 text-sm text-slate-600">{u.email}</td>
                <td className="px-4 py-2 text-sm text-slate-600 capitalize">{u.role}</td>
                <td className="px-4 py-2 text-sm text-slate-600">{u.department || '—'}</td>
                <td className="px-4 py-2 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
