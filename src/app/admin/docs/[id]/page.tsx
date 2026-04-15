'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CurriculumDoc, Stage1, Stage2, Stage3, Note, DocHistory, DocStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import StageProgress from '@/components/StageProgress';

export default function AdminDocReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<CurriculumDoc | null>(null);
  const [stage1, setStage1] = useState<Stage1 | null>(null);
  const [stage2, setStage2] = useState<Stage2 | null>(null);
  const [stage3, setStage3] = useState<Stage3 | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<DocHistory[]>([]);
  const [newNote, setNewNote] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'review' | 'notes' | 'history'>('review');

  const fetchAll = useCallback(async () => {
    const [docRes, notesRes, histRes] = await Promise.all([
      fetch(`/api/docs/${id}`),
      fetch(`/api/docs/${id}/notes`),
      fetch(`/api/docs/${id}/history`),
    ]);
    const [docData, notesData, histData] = await Promise.all([docRes.json(), notesRes.json(), histRes.json()]);

    if (docData.doc) {
      setDoc(docData.doc);
      setStage1(JSON.parse(docData.doc.stage1 || '{}'));
      setStage2(JSON.parse(docData.doc.stage2 || '{}'));
      setStage3(JSON.parse(docData.doc.stage3 || '{}'));
    }
    setNotes(notesData.notes || []);
    setHistory(histData.history || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApprove = async () => {
    await fetch(`/api/docs/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Document approved' }),
    });
    fetchAll();
  };

  const handleRevision = async () => {
    if (!revisionNote.trim()) return;
    await fetch(`/api/docs/${id}/revision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: revisionNote }),
    });
    setRevisionNote('');
    fetchAll();
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    await fetch(`/api/docs/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNote }),
    });
    setNewNote('');
    fetchAll();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!doc) return <div className="p-8 text-center text-red-500">Document not found</div>;

  const renderField = (label: string, value: string | undefined) => (
    <div className="mb-3">
      <h4 className="text-sm font-medium text-gray-500">{label}</h4>
      <p className="text-gray-800 whitespace-pre-wrap mt-1">{value || <span className="text-gray-300 italic">Not provided</span>}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push('/admin')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">&larr; Back to Dashboard</button>
          <h1 className="text-2xl font-bold text-gray-800">{doc.unit_title}</h1>
          <p className="text-gray-500">
            {doc.subject_area} &middot; Grade {doc.grade} &middot; {doc.teacher_name}
          </p>
          {doc.course && <p className="text-gray-400 text-sm">{doc.course}</p>}
        </div>
        <div className="flex items-center gap-3">
          <StageProgress stage1={!!doc.stage1_complete} stage2={!!doc.stage2_complete} stage3={!!doc.stage3_complete} />
          <StatusBadge status={doc.status as DocStatus} />
        </div>
      </div>

      {/* Action Buttons */}
      {doc.status === 'submitted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-medium mb-3">This document is awaiting your review.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleApprove}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">
              Approve
            </button>
            <div className="flex gap-2 flex-1">
              <input
                value={revisionNote}
                onChange={e => setRevisionNote(e.target.value)}
                placeholder="Reason for revision request..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={handleRevision} disabled={!revisionNote.trim()}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition disabled:opacity-50">
                Request Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {[
          { key: 'review', label: 'Document Review' },
          { key: 'notes', label: `Notes (${notes.length})` },
          { key: 'history', label: 'History' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key as typeof activeSection)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeSection === tab.key ? 'border-[#8B1A1A] text-[#8B1A1A]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'review' && (
        <div className="space-y-6">
          {/* Unit Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-800 mb-3">Unit Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Subject:</span> <span className="ml-1">{doc.subject_area}</span></div>
              <div><span className="text-gray-500">Course:</span> <span className="ml-1">{doc.course || 'N/A'}</span></div>
              <div><span className="text-gray-500">Grade:</span> <span className="ml-1">{doc.grade}</span></div>
              <div><span className="text-gray-500">Dates:</span> <span className="ml-1">{doc.start_date || '?'} to {doc.end_date || '?'}</span></div>
            </div>
            {doc.unit_summary && (
              <div className="mt-3">
                <span className="text-sm text-gray-500">Summary:</span>
                <p className="text-sm text-gray-700 mt-1">{doc.unit_summary}</p>
              </div>
            )}
          </div>

          {/* Stage 1 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#8B1A1A]">Stage 1: Desired Results</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded ${doc.stage1_complete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {doc.stage1_complete ? 'Complete' : 'In Progress'}
              </span>
            </div>
            {renderField('Massachusetts Learning Standards', stage1?.learning_standards)}
            {renderField('Vision of a Graduate Performance Outcome(s)', stage1?.vog_outcomes)}
            {renderField('Transfer', stage1?.transfer)}
            {renderField('Enduring Understandings', stage1?.enduring_understandings)}
            {renderField('Essential Questions', stage1?.essential_questions)}
            {renderField('Knowledge', stage1?.knowledge)}
            {renderField('Skills', stage1?.skills)}
          </div>

          {/* Stage 2 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#8B1A1A]">Stage 2: Evidence of Learning</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded ${doc.stage2_complete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {doc.stage2_complete ? 'Complete' : 'In Progress'}
              </span>
            </div>
            {renderField('Transfer/Performance Task(s)', stage2?.transfer_tasks)}
            {renderField('Formative Assessment(s)', stage2?.formative_assessments)}
            {renderField('Summative Assessment(s)', stage2?.summative_assessments)}
            {renderField('Other Evidence', stage2?.other_evidence)}
          </div>

          {/* Stage 3 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#8B1A1A]">Stage 3: Learning Plan</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded ${doc.stage3_complete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {doc.stage3_complete ? 'Complete' : 'In Progress'}
              </span>
            </div>
            {renderField('Learning Events & Instruction', stage3?.learning_events)}
            {renderField('Resources & Materials', stage3?.resources_materials)}
            {renderField('Differentiation / Social Emotional Access', stage3?.differentiation)}
          </div>
        </div>
      )}

      {activeSection === 'notes' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Notes</h2>
          <div className="flex gap-2">
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
              placeholder="Add a note..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 h-20" />
            <button onClick={addNote} className="bg-[#8B1A1A] text-white px-4 rounded-lg self-end hover:bg-[#a52525]">Add</button>
          </div>
          <div className="space-y-3">
            {notes.map(note => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium">{note.user_name} ({note.user_role})</span>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-gray-400 text-sm">No notes yet.</p>}
          </div>
        </div>
      )}

      {activeSection === 'history' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Document History</h2>
          {history.map(h => (
            <div key={h.id} className="flex items-start gap-3 text-sm border-l-2 border-gray-200 pl-3 py-1">
              <div className="flex-1">
                <span className="font-medium text-gray-700">{h.user_name}</span>
                <span className="text-gray-500"> &middot; {h.action.replace('_', ' ')}</span>
                {h.note && <p className="text-gray-500 text-xs mt-0.5">{h.note}</p>}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(h.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
