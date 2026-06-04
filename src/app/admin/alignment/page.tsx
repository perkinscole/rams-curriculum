'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Pair {
  subject: string;
  lowerGrade: string;
  higherGrade: string;
  lowerCount: number;
  higherCount: number;
}

interface Gap {
  topic: string;
  introduced_in: string;
  missing_in_lower: string;
  recommendation: string;
}
interface Redundancy {
  topic: string;
  explanation: string;
  recommendation: string;
}
interface Handoff {
  topic: string;
  lower_unit: string;
  higher_unit: string;
  explanation: string;
}
interface Result {
  summary: string;
  gaps: Gap[];
  redundancies: Redundancy[];
  smooth_handoffs: Handoff[];
}

export default function AlignmentPage() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [activePair, setActivePair] = useState<Pair | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/alignment')
      .then(r => r.json())
      .then(data => { setPairs(data.pairs || []); setLoading(false); });
  }, []);

  const analyze = async (pair: Pair) => {
    setActivePair(pair);
    setResult(null);
    setError('');
    setAnalyzing(true);
    try {
      const res = await fetch('/api/alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: pair.subject, lowerGrade: pair.lowerGrade, higherGrade: pair.higherGrade }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Analysis failed.');
        return;
      }
      setResult(data.result);
    } catch {
      setError('Network error.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Group pairs by subject for cleaner display
  const pairsBySubject: Record<string, Pair[]> = {};
  for (const p of pairs) {
    if (!pairsBySubject[p.subject]) pairsBySubject[p.subject] = [];
    pairsBySubject[p.subject].push(p);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-2 mb-2">Vertical Alignment</h1>
      <p className="text-slate-600 mb-6">
        AI-powered check for gaps, redundancies, and smooth handoffs between adjacent grade levels
        in your approved curriculum. Useful for K-12 articulation conversations and PLC planning.
      </p>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : pairs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-600 mb-1">Not enough approved curriculum to analyze yet.</p>
          <p className="text-sm text-slate-500">You need approved units in <strong>at least two adjacent grades</strong> of the same subject.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-1">Available grade pairs</h2>
          <p className="text-xs text-slate-500 mb-4">Pairs are auto-detected from your approved units. Click one to run the analysis.</p>
          <div className="space-y-4">
            {Object.entries(pairsBySubject).map(([subject, sp]) => (
              <div key={subject}>
                <p className="text-sm font-medium text-slate-700 mb-2">{subject}</p>
                <div className="flex flex-wrap gap-2">
                  {sp.map(p => {
                    const isActive = activePair && activePair.subject === p.subject && activePair.lowerGrade === p.lowerGrade && activePair.higherGrade === p.higherGrade;
                    return (
                      <button
                        key={`${p.subject}-${p.lowerGrade}-${p.higherGrade}`}
                        onClick={() => analyze(p)}
                        disabled={analyzing}
                        className={`text-sm px-3 py-2 rounded border transition disabled:opacity-50 ${
                          isActive ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40'
                        }`}>
                        Grade {p.lowerGrade} ({p.lowerCount}) → Grade {p.higherGrade} ({p.higherCount})
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analyzing && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Analyzing alignment between grades…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {result && activePair && !analyzing && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-bold text-slate-800 mb-2">
              {activePair.subject}: Grade {activePair.lowerGrade} → Grade {activePair.higherGrade}
            </h2>
            <p className="text-slate-700 leading-relaxed">{result.summary}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <h3 className="font-bold text-red-800 mb-3">
              Gaps <span className="text-slate-500 font-normal text-sm">({result.gaps.length})</span>
            </h3>
            {result.gaps.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No significant gaps identified. Great prerequisite alignment.</p>
            ) : (
              <div className="space-y-4">
                {result.gaps.map((g, i) => (
                  <div key={i} className="border-l-2 border-red-300 pl-3">
                    <p className="font-medium text-slate-800">{g.topic}</p>
                    <p className="text-sm text-slate-600 mt-1"><span className="font-medium">Introduced in:</span> {g.introduced_in}</p>
                    <p className="text-sm text-slate-600 mt-1"><span className="font-medium">Missing in Grade {activePair.lowerGrade}:</span> {g.missing_in_lower}</p>
                    <p className="text-sm text-indigo-700 mt-2"><span className="font-medium">Recommendation:</span> {g.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <h3 className="font-bold text-yellow-800 mb-3">
              Redundancies <span className="text-slate-500 font-normal text-sm">({result.redundancies.length})</span>
            </h3>
            {result.redundancies.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No notable redundancies. Each grade builds on the last.</p>
            ) : (
              <div className="space-y-4">
                {result.redundancies.map((r, i) => (
                  <div key={i} className="border-l-2 border-yellow-300 pl-3">
                    <p className="font-medium text-slate-800">{r.topic}</p>
                    <p className="text-sm text-slate-600 mt-1">{r.explanation}</p>
                    <p className="text-sm text-indigo-700 mt-2"><span className="font-medium">Recommendation:</span> {r.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="font-bold text-green-800 mb-3">
              Smooth Handoffs <span className="text-slate-500 font-normal text-sm">({result.smooth_handoffs.length})</span>
            </h3>
            {result.smooth_handoffs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No clear handoffs identified — opportunity to strengthen connections.</p>
            ) : (
              <div className="space-y-4">
                {result.smooth_handoffs.map((h, i) => (
                  <div key={i} className="border-l-2 border-green-300 pl-3">
                    <p className="font-medium text-slate-800">{h.topic}</p>
                    <p className="text-sm text-slate-600 mt-1"><span className="font-medium">From:</span> {h.lower_unit} <span className="text-slate-400">→</span> <span className="font-medium">To:</span> {h.higher_unit}</p>
                    <p className="text-sm text-slate-600 mt-1">{h.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 text-center pt-2">
            AI analysis &middot; review findings with your faculty before acting on them
          </p>
        </div>
      )}
    </div>
  );
}
