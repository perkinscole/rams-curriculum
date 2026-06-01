'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { District } from '@/lib/types';

export default function AdminSettingsPage() {
  const [district, setDistrict] = useState<District | null>(null);
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState('');
  const [grades, setGrades] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/district')
      .then(r => r.json())
      .then(data => {
        if (data.district) {
          setDistrict(data.district);
          setName(data.district.name);
          setSubjects((data.district.subjects || []).join('\n'));
          setGrades((data.district.grades || []).join(', '));
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const res = await fetch('/api/district', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        subjects: subjects.split('\n').map(s => s.trim()).filter(Boolean),
        grades: grades.split(',').map(g => g.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage('Saved.');
      setTimeout(() => setMessage(''), 2500);
    } else {
      setMessage('Could not save.');
    }
  };

  if (!district) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-2 mb-6">District Settings</h1>

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">District Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subjects</label>
          <p className="text-xs text-slate-500 mb-2">One subject per line. These appear in dropdowns when teachers create units.</p>
          <textarea value={subjects} onChange={e => setSubjects(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 h-48 font-mono text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Grade Levels</label>
          <p className="text-xs text-slate-500 mb-2">Comma-separated, e.g. <code>K, 1, 2, 3</code> or <code>9, 10, 11, 12</code>.</p>
          <input value={grades} onChange={e => setGrades(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm" />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-400 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {message && <span className="text-green-600 text-sm">{message}</span>}
        </div>

        <p className="text-xs text-slate-400 pt-2 border-t">
          Public curriculum URL: <code>/curriculum?district={district.slug}</code>
        </p>
      </form>
    </div>
  );
}
