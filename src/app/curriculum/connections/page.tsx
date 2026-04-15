'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SUBJECTS } from '@/lib/types';

interface Connection {
  subjects: string[];
  units: string[];
  doc_ids: number[];
  theme: string;
  details: string;
  collaboration_idea: string;
  timing_aligned: boolean;
}

export default function ConnectionsPage() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [grade, setGrade] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [summary, setSummary] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const analyze = async () => {
    setLoading(true);
    setMessage('');
    setConnections([]);
    setSummary('');

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
          grade: grade || undefined,
        }),
      });

      const data = await res.json();
      setConnections(data.connections || []);
      setSummary(data.summary || '');
      setMessage(data.message || '');
      setAnalyzed(true);
    } catch {
      setMessage('Failed to analyze connections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/curriculum" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Curriculum</Link>
        <h1 className="text-3xl font-bold text-gray-800 mt-2">Curriculum Connections</h1>
        <p className="text-gray-500 mt-1">
          AI-powered analysis to find interdisciplinary opportunities across subjects.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="font-bold text-gray-800 mb-3">Select Subjects to Analyze</h2>
        <p className="text-sm text-gray-500 mb-4">Choose specific subjects or leave all unselected to analyze everything.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {SUBJECTS.map(subject => (
            <button
              key={subject}
              onClick={() => toggleSubject(subject)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                selectedSubjects.includes(subject)
                  ? 'bg-[#8B1A1A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <select value={grade} onChange={e => setGrade(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Grades</option>
            <option value="6">Grade 6</option>
            <option value="7">Grade 7</option>
            <option value="8">Grade 8</option>
          </select>

          <button onClick={analyze} disabled={loading}
            className="bg-[#8B1A1A] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#a52525] transition disabled:opacity-50">
            {loading ? 'Analyzing...' : 'Find Connections'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A] mx-auto mb-4"></div>
          <p className="text-gray-500">Analyzing curriculum documents for interdisciplinary connections...</p>
        </div>
      )}

      {/* Message */}
      {message && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg mb-6">
          {message}
        </div>
      )}

      {/* Results */}
      {analyzed && !loading && connections.length > 0 && (
        <div className="space-y-6">
          {summary && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-bold text-gray-800 mb-2">Summary</h2>
              <p className="text-gray-700">{summary}</p>
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-800">{connections.length} Connection{connections.length !== 1 ? 's' : ''} Found</h2>

          {connections.map((conn, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 border-l-4 border-[#8B1A1A]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {conn.subjects.map(s => (
                      <span key={s} className="bg-red-50 text-[#8B1A1A] px-2 py-0.5 rounded text-sm font-medium">{s}</span>
                    ))}
                  </div>
                  <h3 className="font-bold text-gray-800">{conn.theme}</h3>
                </div>
                {conn.timing_aligned && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                    Timing Aligned
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-500 mb-2">
                Units: {conn.units.join(' & ')}
              </div>

              <p className="text-gray-700 mb-3">{conn.details}</p>

              <div className="bg-gray-50 rounded p-3">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Collaboration Idea</h4>
                <p className="text-sm text-gray-700">{conn.collaboration_idea}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {analyzed && !loading && connections.length === 0 && !message && (
        <div className="text-center py-12 text-gray-400">
          No connections found. Try selecting different subjects or grades.
        </div>
      )}
    </div>
  );
}
