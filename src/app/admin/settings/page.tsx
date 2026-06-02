'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { District } from '@/lib/types';

const SUGGESTED_SUBJECTS = [
  'English Language Arts',
  'Mathematics',
  'Science',
  'Social Studies',
  'World History',
  'US History',
  'Biology',
  'Chemistry',
  'Physics',
  'Algebra',
  'Geometry',
  'Pre-Calculus',
  'Calculus',
  'Computer Science',
  'Art',
  'Music',
  'Drama',
  'Physical Education',
  'Health & Wellness',
  'World Language',
  'Spanish',
  'French',
  'Latin',
  'Mandarin',
];

const ALL_GRADES = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const GRADE_PRESETS: Array<{ label: string; grades: string[] }> = [
  { label: 'Elementary (K–5)', grades: ['K', '1', '2', '3', '4', '5'] },
  { label: 'Middle (6–8)', grades: ['6', '7', '8'] },
  { label: 'High (9–12)', grades: ['9', '10', '11', '12'] },
  { label: 'K–12', grades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
];

export default function AdminSettingsPage() {
  const [district, setDistrict] = useState<District | null>(null);
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/district')
      .then(r => r.json())
      .then(data => {
        if (data.district) {
          setDistrict(data.district);
          setName(data.district.name);
          setSubjects(data.district.subjects || []);
          setGrades(data.district.grades || []);
        }
      });
  }, []);

  const addSubject = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed || subjects.includes(trimmed)) return;
    setSubjects([...subjects, trimmed]);
  };

  const removeSubject = (s: string) => setSubjects(subjects.filter(x => x !== s));

  const toggleGrade = (g: string) => {
    setGrades(grades.includes(g) ? grades.filter(x => x !== g) : [...grades, g]);
  };

  const applyGradePreset = (preset: string[]) => setGrades(preset);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    // Sort grades into the canonical ALL_GRADES order
    const sortedGrades = ALL_GRADES.filter(g => grades.includes(g));
    const res = await fetch('/api/district', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subjects, grades: sortedGrades }),
    });
    setSaving(false);
    if (res.ok) {
      setGrades(sortedGrades);
      setMessage('Saved.');
      setTimeout(() => setMessage(''), 2500);
    } else {
      setMessage('Could not save.');
    }
  };

  if (!district) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  const unusedSuggestions = SUGGESTED_SUBJECTS.filter(s => !subjects.includes(s));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-2 mb-6">District Settings</h1>

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">District Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Subjects</label>
          <p className="text-xs text-slate-500 mb-3">These appear in the subject dropdown when teachers create units.</p>

          {/* Current subjects as chips */}
          <div className="flex flex-wrap gap-2 mb-3 min-h-[2.5rem] p-2 border border-slate-200 rounded-lg bg-slate-50">
            {subjects.length === 0 ? (
              <span className="text-sm text-slate-400 self-center px-2">No subjects yet. Add one below.</span>
            ) : subjects.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-sm px-3 py-1 rounded-full">
                {s}
                <button type="button" onClick={() => removeSubject(s)}
                  className="text-indigo-500 hover:text-indigo-800 ml-1 leading-none" aria-label="Remove">
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Add custom */}
          <div className="flex gap-2 mb-3">
            <input
              value={subjectInput}
              onChange={e => setSubjectInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSubject(subjectInput);
                  setSubjectInput('');
                }
              }}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Add a custom subject and press Enter"
            />
            <button type="button"
              onClick={() => { addSubject(subjectInput); setSubjectInput(''); }}
              className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300">
              Add
            </button>
          </div>

          {/* Quick add suggestions */}
          {unusedSuggestions.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Quick add common subjects:</p>
              <div className="flex flex-wrap gap-1.5">
                {unusedSuggestions.map(s => (
                  <button key={s} type="button" onClick={() => addSubject(s)}
                    className="text-xs bg-white border border-slate-300 text-slate-600 px-2.5 py-1 rounded-full hover:bg-slate-100 hover:border-indigo-400 hover:text-indigo-700">
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Grade Levels</label>
          <p className="text-xs text-slate-500 mb-3">Pick the grade levels your district covers.</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {GRADE_PRESETS.map(p => (
              <button key={p.label} type="button" onClick={() => applyGradePreset(p.grades)}
                className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-100 hover:border-indigo-400 hover:text-indigo-700">
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {ALL_GRADES.map(g => {
              const checked = grades.includes(g);
              return (
                <button key={g} type="button" onClick={() => toggleGrade(g)}
                  className={`px-2 py-3 text-sm font-medium rounded border transition ${
                    checked
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-indigo-400'
                  }`}>
                  {g === 'Pre-K' || g === 'K' ? g : `Grade ${g}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t flex items-center gap-3">
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
