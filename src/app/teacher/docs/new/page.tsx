'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDistrict } from '@/lib/useDistrict';
import DocumentUploader from '@/components/DocumentUploader';

export default function NewDocPage() {
  const router = useRouter();
  const district = useDistrict();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject_area: '',
    course: '',
    unit_title: '',
    grade: '',
    start_date: '',
    end_date: '',
    unit_summary: '',
  });

  useEffect(() => {
    if (district && !form.grade && district.grades.length > 0) {
      setForm(prev => ({ ...prev, grade: district.grades[0] }));
    }
  }, [district, form.grade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/teacher/docs/${data.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyParsedFields = (fields: Record<string, unknown>) => {
    if (!district) return;
    const f = fields as Record<string, string>;
    setForm(prev => ({
      ...prev,
      ...(f.subject_area && district.subjects.includes(f.subject_area) ? { subject_area: f.subject_area } : {}),
      ...(f.course ? { course: f.course } : {}),
      ...(f.unit_title ? { unit_title: f.unit_title } : {}),
      ...(f.grade && district.grades.includes(f.grade) ? { grade: f.grade } : {}),
      ...(f.start_date ? { start_date: f.start_date } : {}),
      ...(f.end_date ? { end_date: f.end_date } : {}),
      ...(f.unit_summary ? { unit_summary: f.unit_summary } : {}),
    }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">New Curriculum Document</h1>

      <div className="mb-6">
        <DocumentUploader onParsed={fields => applyParsedFields(fields)} />
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject Area *</label>
          <select
            value={form.subject_area}
            onChange={e => setForm({ ...form, subject_area: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            required
          >
            <option value="">Select subject...</option>
            {(district?.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
          <input
            type="text"
            value={form.course}
            onChange={e => setForm({ ...form, course: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            placeholder="e.g., Algebra 1, French Immersion"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unit Title *</label>
          <input
            type="text"
            value={form.unit_title}
            onChange={e => setForm({ ...form, unit_title: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Grade *</label>
            <select
              value={form.grade}
              onChange={e => setForm({ ...form, grade: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select...</option>
              {(district?.grades || []).map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unit Summary</label>
          <textarea
            value={form.unit_summary}
            onChange={e => setForm({ ...form, unit_summary: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-400 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Document'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-slate-300 px-6 py-2 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
