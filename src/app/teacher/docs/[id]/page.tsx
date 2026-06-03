'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CurriculumDoc, Stage1, Stage2, Stage3, Note, DocHistory, DocStatus, parseStage } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import StageProgress from '@/components/StageProgress';
import DocumentUploader from '@/components/DocumentUploader';
import Link from 'next/link';
import { useDistrict } from '@/lib/useDistrict';

const emptyStage1: Stage1 = { learning_standards: '', vog_outcomes: '', transfer: '', enduring_understandings: '', essential_questions: '', knowledge: '', skills: '' };
const emptyStage2: Stage2 = { transfer_tasks: '', formative_assessments: '', summative_assessments: '', other_evidence: '' };
const emptyStage3: Stage3 = { learning_events: '', resources_materials: '', differentiation: '' };

export default function DocEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const district = useDistrict();
  const [doc, setDoc] = useState<CurriculumDoc | null>(null);
  const [stage1, setStage1] = useState<Stage1>(emptyStage1);
  const [stage2, setStage2] = useState<Stage2>(emptyStage2);
  const [stage3, setStage3] = useState<Stage3>(emptyStage3);
  const [activeTab, setActiveTab] = useState<'info' | 's1' | 's2' | 's3' | 'notes' | 'history'>('info');
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<DocHistory[]>([]);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDoc = useCallback(async () => {
    const res = await fetch(`/api/docs/${id}`);
    const data = await res.json();
    if (data.doc) {
      setDoc(data.doc);
      setStage1({ ...emptyStage1, ...parseStage<Stage1>(data.doc.stage1, emptyStage1) });
      setStage2({ ...emptyStage2, ...parseStage<Stage2>(data.doc.stage2, emptyStage2) });
      setStage3({ ...emptyStage3, ...parseStage<Stage3>(data.doc.stage3, emptyStage3) });
    }
    setLoading(false);
  }, [id]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch(`/api/docs/${id}/notes`);
    const data = await res.json();
    setNotes(data.notes || []);
  }, [id]);

  const fetchHistory = useCallback(async () => {
    const res = await fetch(`/api/docs/${id}/history`);
    const data = await res.json();
    setHistory(data.history || []);
  }, [id]);

  useEffect(() => { fetchDoc(); fetchNotes(); fetchHistory(); }, [fetchDoc, fetchNotes, fetchHistory]);

  const save = async (extraFields?: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/docs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...extraFields,
        stage1,
        stage2,
        stage3,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchDoc();
    fetchHistory();
  };

  const handleSubmit = async () => {
    await save();
    await fetch(`/api/docs/${id}/submit`, { method: 'POST' });
    fetchDoc();
    fetchHistory();
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    await fetch(`/api/docs/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNote }),
    });
    setNewNote('');
    fetchNotes();
  };

  const toggleStage = async (stage: 1 | 2 | 3) => {
    if (!doc) return;
    const field = `stage${stage}_complete` as const;
    const current = doc[field];
    await save({ [field]: !current });
  };

  const applyParsedFields = async (fieldsIn: Record<string, unknown>, documentType: string) => {
    if (!district) return;
    const f = fieldsIn as {
      subject_area?: string; course?: string; unit_title?: string; grade?: string;
      start_date?: string; end_date?: string; unit_summary?: string;
      stage1?: Partial<Stage1>; stage2?: Partial<Stage2>; stage3?: Partial<Stage3>;
    };
    if (f.stage1) setStage1(prev => ({ ...prev, ...Object.fromEntries(Object.entries(f.stage1!).filter(([, v]) => v)) as Partial<Stage1> }));
    if (f.stage2) setStage2(prev => ({ ...prev, ...Object.fromEntries(Object.entries(f.stage2!).filter(([, v]) => v)) as Partial<Stage2> }));
    if (f.stage3) setStage3(prev => ({ ...prev, ...Object.fromEntries(Object.entries(f.stage3!).filter(([, v]) => v)) as Partial<Stage3> }));

    const updateBody: Record<string, unknown> = {
      stage1: { ...stage1, ...(f.stage1 || {}) },
      stage2: { ...stage2, ...(f.stage2 || {}) },
      stage3: { ...stage3, ...(f.stage3 || {}) },
      _note: `Populated from uploaded ${documentType.replace('_', ' ')} document`,
    };
    if (f.unit_title) updateBody.unit_title = f.unit_title;
    if (f.subject_area && district.subjects.includes(f.subject_area)) updateBody.subject_area = f.subject_area;
    if (f.course) updateBody.course = f.course;
    if (f.grade && district.grades.includes(f.grade)) updateBody.grade = f.grade;
    if (f.unit_summary) updateBody.unit_summary = f.unit_summary;
    if (f.start_date) updateBody.start_date = f.start_date;
    if (f.end_date) updateBody.end_date = f.end_date;

    await fetch(`/api/docs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBody),
    });
    fetchDoc();
    fetchHistory();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!doc) return <div className="p-8 text-center text-red-500">Document not found</div>;

  const isEditable = doc.status === 'draft' || doc.status === 'revision_requested';

  const tabs = [
    { key: 'info', label: 'Unit Info' },
    { key: 's1', label: 'Stage 1: Desired Results' },
    { key: 's2', label: 'Stage 2: Evidence' },
    { key: 's3', label: 'Stage 3: Learning Plan' },
    { key: 'notes', label: `Notes (${notes.length})` },
    { key: 'history', label: 'History' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push('/teacher')} className="text-sm text-slate-500 hover:text-slate-700 mb-2 block">&larr; Back to Documents</button>
          <h1 className="text-2xl font-bold text-slate-800">{doc.unit_title}</h1>
          <p className="text-slate-500">{doc.subject_area} &middot; Grade {doc.grade}</p>
        </div>
        <div className="flex items-center gap-3">
          <StageProgress stage1={!!doc.stage1_complete} stage2={!!doc.stage2_complete} stage3={!!doc.stage3_complete} />
          <StatusBadge status={doc.status as DocStatus} />
          <Link href={`/docs/${doc.id}/print`} target="_blank" rel="noopener"
            className="border border-slate-300 px-3 py-1.5 rounded text-sm hover:bg-slate-50">
            Print / Save as PDF
          </Link>
        </div>
      </div>

      {isEditable && (
        <div className="mb-6">
          <DocumentUploader
            onParsed={(fields, docType) => applyParsedFields(fields, docType)}
            hintLine="Have an existing curriculum? We&rsquo;ll convert it to UBD."
          />
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject Area</label>
                <select disabled={!isEditable} value={doc.subject_area}
                  onChange={e => save({ subject_area: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-50">
                  {(district?.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
                <input disabled={!isEditable} value={doc.course}
                  onChange={e => save({ course: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Title</label>
              <input disabled={!isEditable} value={doc.unit_title}
                onChange={e => save({ unit_title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-50" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                <select disabled={!isEditable} value={doc.grade}
                  onChange={e => save({ grade: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-50">
                  {(district?.grades || []).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                <input type="date" disabled={!isEditable} value={doc.start_date}
                  onChange={e => save({ start_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                <input type="date" disabled={!isEditable} value={doc.end_date}
                  onChange={e => save({ end_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Summary</label>
              <textarea disabled={!isEditable} value={doc.unit_summary}
                onChange={e => save({ unit_summary: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24 disabled:bg-slate-50" />
            </div>
          </div>
        )}

        {activeTab === 's1' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-indigo-700">Stage 1: Desired Results</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!doc.stage1_complete} onChange={() => toggleStage(1)}
                  className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                Mark Complete
              </label>
            </div>
            {[
              { key: 'learning_standards', label: 'Learning Standards' },
              { key: 'vog_outcomes', label: 'Vision of a Graduate Performance Outcome(s)' },
              { key: 'transfer', label: 'Transfer - Students will be able to independently use their learning to...' },
              { key: 'enduring_understandings', label: 'Enduring Understandings - Students will understand that...' },
              { key: 'essential_questions', label: 'Essential Questions - Students will consider...' },
              { key: 'knowledge', label: 'Knowledge - Students will know...' },
              { key: 'skills', label: 'Skills - Students will be skilled at...' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                <textarea
                  disabled={!isEditable}
                  value={stage1[field.key as keyof Stage1] || ''}
                  onChange={e => setStage1({ ...stage1, [field.key]: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24 disabled:bg-slate-50"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 's2' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-indigo-700">Stage 2: Evidence of Learning</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!doc.stage2_complete} onChange={() => toggleStage(2)}
                  className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                Mark Complete
              </label>
            </div>
            {[
              { key: 'transfer_tasks', label: 'Transfer/Performance Task(s)' },
              { key: 'formative_assessments', label: 'Formative Assessment(s)' },
              { key: 'summative_assessments', label: 'Summative Assessment(s)' },
              { key: 'other_evidence', label: 'Other Evidence' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                <textarea
                  disabled={!isEditable}
                  value={stage2[field.key as keyof Stage2] || ''}
                  onChange={e => setStage2({ ...stage2, [field.key]: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24 disabled:bg-slate-50"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 's3' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-indigo-700">Stage 3: Learning Plan</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!doc.stage3_complete} onChange={() => toggleStage(3)}
                  className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                Mark Complete
              </label>
            </div>
            {[
              { key: 'learning_events', label: 'Learning Events & Instruction' },
              { key: 'resources_materials', label: 'Resources & Materials' },
              { key: 'differentiation', label: 'Differentiation / Social Emotional Access' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                <textarea
                  disabled={!isEditable}
                  value={stage3[field.key as keyof Stage3] || ''}
                  onChange={e => setStage3({ ...stage3, [field.key]: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 h-32 disabled:bg-slate-50"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Notes</h2>
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 h-20"
              />
              <button onClick={addNote} className="bg-indigo-500 text-white px-4 rounded-lg self-end hover:bg-indigo-400">
                Add
              </button>
            </div>
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium">{note.user_name} ({note.user_role})</span>
                    <span>{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {notes.length === 0 && <p className="text-slate-400 text-sm">No notes yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Document History</h2>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-start gap-3 text-sm border-l-2 border-slate-200 pl-3 py-1">
                  <div className="flex-1">
                    <span className="font-medium text-slate-700">{h.user_name}</span>
                    <span className="text-slate-500"> &middot; {h.action.replace('_', ' ')}</span>
                    {h.note && <p className="text-slate-500 text-xs mt-0.5">{h.note}</p>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 's1' || activeTab === 's2' || activeTab === 's3') && isEditable && (
          <div className="flex items-center gap-3 mt-6 pt-4 border-t">
            <button onClick={() => save()} disabled={saving}
              className="bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-400 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saved && <span className="text-green-600 text-sm">Saved!</span>}
          </div>
        )}
      </div>

      {isEditable && (
        <div className="mt-6 bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-800">Ready for review?</h3>
            <p className="text-sm text-slate-500">Submit this document for admin approval.</p>
          </div>
          <button onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            Submit for Review
          </button>
        </div>
      )}
    </div>
  );
}
