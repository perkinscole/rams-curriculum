'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SUBJECTS } from '@/lib/types';

export default function NewDocPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [form, setForm] = useState({
    subject_area: '',
    course: '',
    unit_title: '',
    grade: '6',
    start_date: '',
    end_date: '',
    unit_summary: '',
  });

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMessage('Extracting and parsing document...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/docs/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadMessage(data.error || 'Upload failed');
        return;
      }
      const f = data.fields;
      setForm(prev => ({
        ...prev,
        ...(f.subject_area && SUBJECTS.includes(f.subject_area as typeof SUBJECTS[number]) ? { subject_area: f.subject_area } : {}),
        ...(f.course ? { course: f.course } : {}),
        ...(f.unit_title ? { unit_title: f.unit_title } : {}),
        ...(f.grade && ['6', '7', '8'].includes(f.grade) ? { grade: f.grade } : {}),
        ...(f.start_date ? { start_date: f.start_date } : {}),
        ...(f.end_date ? { end_date: f.end_date } : {}),
        ...(f.unit_summary ? { unit_summary: f.unit_summary } : {}),
      }));
      setUploadMessage('Fields populated! Review and create the document, then edit stages.');
      setTimeout(() => setUploadMessage(''), 5000);
    } catch {
      setUploadMessage('Failed to process file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Curriculum Document</h1>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Import from Document</p>
          <p className="text-xs text-gray-400">Upload a .docx or .pdf to auto-fill fields</p>
        </div>
        <input ref={fileInputRef} type="file" accept=".docx,.pdf" onChange={handleFileUpload} className="hidden" id="file-upload-new" />
        <label htmlFor="file-upload-new"
          className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition ${uploading ? 'bg-gray-300 text-gray-500' : 'bg-[#8B1A1A] text-white hover:bg-[#a52525]'}`}>
          {uploading ? 'Processing...' : 'Upload File'}
        </label>
        {uploadMessage && <span className="text-sm text-green-600">{uploadMessage}</span>}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject Area *</label>
          <select
            value={form.subject_area}
            onChange={e => setForm({ ...form, subject_area: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          >
            <option value="">Select subject...</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <input
            type="text"
            value={form.course}
            onChange={e => setForm({ ...form, course: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g., Algebra 1, French Immersion"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Title *</label>
          <input
            type="text"
            value={form.unit_title}
            onChange={e => setForm({ ...form, unit_title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
            <select
              value={form.grade}
              onChange={e => setForm({ ...form, grade: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="6">Grade 6</option>
              <option value="7">Grade 7</option>
              <option value="8">Grade 8</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Summary</label>
          <textarea
            value={form.unit_summary}
            onChange={e => setForm({ ...form, unit_summary: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#8B1A1A] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#a52525] transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Document'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
