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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DistrictUser[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher', department: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not add user.');
        return;
      }
      setMessage(`Added ${form.name}. Share their password with them so they can sign in.`);
      setForm({ name: '', email: '', password: '', role: 'teacher', department: '' });
      fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-2 mb-6">Manage Teachers</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="font-bold text-slate-800 mb-4">Add a teacher or admin</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
            <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              minLength={8}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="At least 8 characters" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2">
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Department (optional)</label>
            <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="e.g. Science, ELA" />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={submitting}
              className="bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-400 disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add User'}
            </button>
            {message && <span className="text-green-600 text-sm">{message}</span>}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Department</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">No users yet.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-700 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600 capitalize">{u.role}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{u.department || '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
