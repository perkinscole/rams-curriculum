'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CurriculumDoc, DocStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import StageProgress from '@/components/StageProgress';
import { useDistrict } from '@/lib/useDistrict';

export default function AdminDashboard() {
  const district = useDistrict();
  const [docs, setDocs] = useState<CurriculumDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterSubject) params.set('subject', filterSubject);
    if (filterGrade) params.set('grade', filterGrade);

    fetch(`/api/docs?${params}`)
      .then(r => r.json())
      .then(data => setDocs(data.docs || []))
      .finally(() => setLoading(false));
  }, [filterStatus, filterSubject, filterGrade]);

  const stats = {
    total: docs.length,
    draft: docs.filter(d => d.status === 'draft').length,
    submitted: docs.filter(d => d.status === 'submitted').length,
    revision: docs.filter(d => d.status === 'revision_requested').length,
    approved: docs.filter(d => d.status === 'approved').length,
  };

  const bySubject: Record<string, number> = {};
  docs.forEach(d => { bySubject[d.subject_area] = (bySubject[d.subject_area] || 0) + 1; });

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          {district && <p className="text-slate-500 text-sm mt-1">{district.name}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users" className="border border-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition">
            Manage Teachers
          </Link>
          <Link href="/admin/settings" className="border border-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition">
            District Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Docs', value: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Drafts', value: stats.draft, color: 'bg-slate-50 text-slate-600' },
          { label: 'Pending Review', value: stats.submitted, color: 'bg-blue-50 text-blue-700' },
          { label: 'Revision Requested', value: stats.revision, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Approved', value: stats.approved, color: 'bg-green-50 text-green-700' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-lg p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="font-bold text-slate-800 mb-3">Documents by Subject</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {(district?.subjects || []).map(subject => (
            <div key={subject} className="text-center p-2 rounded bg-slate-50">
              <p className="text-lg font-bold text-indigo-600">{bySubject[subject] || 0}</p>
              <p className="text-xs text-slate-500">{subject}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="font-bold text-slate-800 mb-3">Stage Completion Progress</h2>
        <div className="grid grid-cols-3 gap-4">
          {['Stage 1: Desired Results', 'Stage 2: Evidence', 'Stage 3: Learning Plan'].map((label, i) => {
            const field = `stage${i + 1}_complete` as keyof CurriculumDoc;
            const complete = docs.filter(d => d[field]).length;
            const pct = docs.length > 0 ? Math.round((complete / docs.length) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className="text-slate-500">{complete}/{docs.length}</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="revision_requested">Revision Requested</option>
          <option value="approved">Approved</option>
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Subjects</option>
          {(district?.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Grades</option>
          {(district?.grades || []).map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Unit Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Teacher</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Subject</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Gr</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Stages</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/docs/${doc.id}`} className="text-indigo-600 font-medium hover:underline">
                    {doc.unit_title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{doc.teacher_name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{doc.subject_area}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{doc.grade}</td>
                <td className="px-4 py-3"><StatusBadge status={doc.status as DocStatus} /></td>
                <td className="px-4 py-3">
                  <StageProgress stage1={!!doc.stage1_complete} stage2={!!doc.stage2_complete} stage3={!!doc.stage3_complete} size="sm" />
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(doc.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {docs.length === 0 && (
          <p className="text-center text-slate-400 py-8">No documents found.</p>
        )}
      </div>
    </div>
  );
}
