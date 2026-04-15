'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CurriculumDoc, DocStatus, SUBJECTS } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import StageProgress from '@/components/StageProgress';

export default function TeacherDashboard() {
  const [docs, setDocs] = useState<CurriculumDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [user, setUser] = useState<{ userId: number; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user));
  }, []);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (user.role === 'teacher') params.set('teacher_id', String(user.userId));
    if (filterStatus) params.set('status', filterStatus);
    if (filterSubject) params.set('subject', filterSubject);
    if (filterGrade) params.set('grade', filterGrade);

    fetch(`/api/docs?${params}`)
      .then(r => r.json())
      .then(data => setDocs(data.docs || []))
      .finally(() => setLoading(false));
  }, [user, filterStatus, filterSubject, filterGrade]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Curriculum Documents</h1>
        <Link
          href="/teacher/docs/new"
          className="bg-[#8B1A1A] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#a52525] transition"
        >
          + New Document
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="revision_requested">Revision Requested</option>
          <option value="approved">Approved</option>
        </select>
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterGrade}
          onChange={e => setFilterGrade(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Grades</option>
          <option value="6">Grade 6</option>
          <option value="7">Grade 7</option>
          <option value="8">Grade 8</option>
        </select>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No curriculum documents yet.</p>
          <Link
            href="/teacher/docs/new"
            className="text-[#8B1A1A] font-medium hover:underline"
          >
            Create your first document
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Unit Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stages</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/teacher/docs/${doc.id}`} className="text-[#8B1A1A] font-medium hover:underline">
                      {doc.unit_title}
                    </Link>
                    {doc.course && <p className="text-xs text-gray-400">{doc.course}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.subject_area}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.grade}</td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status as DocStatus} /></td>
                  <td className="px-4 py-3">
                    <StageProgress
                      stage1={!!doc.stage1_complete}
                      stage2={!!doc.stage2_complete}
                      stage3={!!doc.stage3_complete}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
