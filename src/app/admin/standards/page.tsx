'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

interface Framework {
  id: number;
  slug: string;
  name: string;
  state: string | null;
  subject: string;
  grade_band: string;
  description: string;
  standards_count: number;
  enabled: boolean;
}

interface Standard {
  id: number;
  code: string;
  description: string;
  grade: string;
  domain: string;
}

interface CoverageRow {
  standard_id: number;
  depth: 0 | 1 | 2 | 3;
  rationale: string;
  doc_id: number;
  unit_title: string;
  subject_area: string;
  doc_grade: string;
  teacher_name: string;
  analyzed_at: string;
}

const DEPTH_LABEL: Record<number, string> = {
  0: 'Not addressed',
  1: 'Mentioned',
  2: 'Addressed',
  3: 'Mastered',
};

const DEPTH_COLOR: Record<number, string> = {
  0: 'bg-slate-200 text-slate-500',
  1: 'bg-yellow-100 text-yellow-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-green-100 text-green-800',
};

export default function StandardsPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedStandard, setExpandedStandard] = useState<number | null>(null);
  const [teacherFilter, setTeacherFilter] = useState('');
  const [actionError, setActionError] = useState('');

  const refreshFrameworks = useCallback(async () => {
    try {
      const res = await fetch('/api/standards/frameworks');
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || `Could not load frameworks (HTTP ${res.status})`);
      } else {
        setFrameworks(data.frameworks || []);
      }
    } catch (err) {
      setActionError(`Network error loading frameworks: ${err instanceof Error ? err.message : 'unknown'}`);
    }
    setLoading(false);
  }, []);

  const loadCoverage = useCallback(async (frameworkId: number) => {
    setStandards([]);
    setCoverage([]);
    const res = await fetch(`/api/standards/coverage?framework=${frameworkId}`);
    const data = await res.json();
    setStandards(data.standards || []);
    setCoverage(data.coverage || []);
  }, []);

  useEffect(() => { refreshFrameworks(); }, [refreshFrameworks]);

  useEffect(() => {
    if (activeId) loadCoverage(activeId);
  }, [activeId, loadCoverage]);

  const toggleFramework = async (fw: Framework) => {
    setActionError('');
    try {
      const res = await fetch('/api/standards/frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameworkId: fw.id, enabled: !fw.enabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || `Toggle failed (HTTP ${res.status})`);
        return;
      }
      refreshFrameworks();
    } catch (err) {
      setActionError(`Network error: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  };

  const runAnalysis = async () => {
    if (!activeId) return;
    setAnalyzing(true);
    setMessage('');
    try {
      const res = await fetch('/api/standards/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameworkId: activeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Analysis failed.');
      } else if (data.message) {
        setMessage(data.message);
      } else {
        setMessage(`Analyzed ${data.analyzed} of ${data.total} approved units.`);
        loadCoverage(activeId);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const teachers = useMemo(() => {
    const set = new Set<string>();
    coverage.forEach(c => set.add(c.teacher_name));
    return Array.from(set).sort();
  }, [coverage]);

  const filteredCoverage = useMemo(
    () => teacherFilter ? coverage.filter(c => c.teacher_name === teacherFilter) : coverage,
    [coverage, teacherFilter]
  );

  // Roll up per-standard max depth
  const perStandard = useMemo(() => {
    const map: Record<number, { maxDepth: number; rows: CoverageRow[] }> = {};
    for (const s of standards) map[s.id] = { maxDepth: 0, rows: [] };
    for (const c of filteredCoverage) {
      const entry = map[c.standard_id];
      if (!entry) continue;
      entry.rows.push(c);
      if (c.depth > entry.maxDepth) entry.maxDepth = c.depth;
    }
    return map;
  }, [standards, filteredCoverage]);

  const summary = useMemo(() => {
    const total = standards.length;
    let covered = 0, partial = 0, missing = 0;
    for (const s of standards) {
      const d = perStandard[s.id]?.maxDepth || 0;
      if (d >= 2) covered += 1;
      else if (d === 1) partial += 1;
      else missing += 1;
    }
    return { total, covered, partial, missing, pct: total ? Math.round((covered / total) * 100) : 0 };
  }, [standards, perStandard]);

  // Group standards by grade/domain for display
  const groupedStandards = useMemo(() => {
    const groups: Record<string, Standard[]> = {};
    for (const s of standards) {
      const key = `Grade ${s.grade}${s.domain ? ' · ' + s.domain : ''}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return Object.entries(groups);
  }, [standards]);

  const activeFramework = frameworks.find(f => f.id === activeId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-2 mb-2">Standards Coverage</h1>
      <p className="text-sm text-slate-500 mb-6">
        AI-powered analysis of how your approved curriculum maps to learning standards.
      </p>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-800">Available frameworks</h2>
              <button onClick={refreshFrameworks} className="text-xs text-indigo-600 hover:underline">Refresh</button>
            </div>
            {actionError && (
              <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-3">{actionError}</div>
            )}
            <p className="text-xs text-slate-500 mb-4">Enable the frameworks your district uses. Each contains a starter set of standards &mdash; admins can request more be added.</p>
            {frameworks.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded">
                <p className="text-slate-600 mb-1">No frameworks loaded.</p>
                <p className="text-xs text-slate-500">
                  This usually means the seed data hasn&rsquo;t run yet on your database.
                  Try a hard refresh, or contact support.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {frameworks.map(fw => (
                  <div key={fw.id} className={`border rounded-lg p-3 flex items-start justify-between gap-3 ${fw.enabled ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 text-sm">{fw.name}</p>
                        {fw.state && <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{fw.state}</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{fw.subject} &middot; Grades {fw.grade_band} &middot; {fw.standards_count} standards</p>
                    </div>
                    <button onClick={() => toggleFramework(fw)}
                      className={`text-xs px-3 py-1.5 rounded font-medium whitespace-nowrap ${
                        fw.enabled ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-indigo-500 text-white hover:bg-indigo-400'
                      }`}>
                      {fw.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {frameworks.some(f => f.enabled) ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1">View coverage for</label>
                  <select value={activeId || ''} onChange={e => setActiveId(Number(e.target.value) || null)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2">
                    <option value="">Select a framework...</option>
                    {frameworks.filter(f => f.enabled).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                {teachers.length > 0 && (
                  <div className="min-w-[180px]">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Filter by teacher</label>
                    <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2">
                      <option value="">All teachers</option>
                      {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
                {activeId && (
                  <button onClick={runAnalysis} disabled={analyzing}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-400 disabled:opacity-50 whitespace-nowrap">
                    {analyzing ? 'Analyzing...' : coverage.length === 0 ? 'Run Analysis' : 'Re-run Analysis'}
                  </button>
                )}
              </div>

              {message && (
                <div className="bg-slate-100 text-slate-700 p-3 rounded text-sm mb-4">{message}</div>
              )}

              {activeFramework && (
                <>
                  {coverage.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      <div className="rounded-lg p-3 bg-green-50">
                        <p className="text-2xl font-bold text-green-700">{summary.pct}%</p>
                        <p className="text-xs text-green-700">Coverage</p>
                      </div>
                      <div className="rounded-lg p-3 bg-green-50">
                        <p className="text-2xl font-bold text-green-700">{summary.covered}</p>
                        <p className="text-xs text-green-700">Covered (depth ≥ 2)</p>
                      </div>
                      <div className="rounded-lg p-3 bg-yellow-50">
                        <p className="text-2xl font-bold text-yellow-700">{summary.partial}</p>
                        <p className="text-xs text-yellow-700">Partial (mentioned only)</p>
                      </div>
                      <div className="rounded-lg p-3 bg-slate-100">
                        <p className="text-2xl font-bold text-slate-700">{summary.missing}</p>
                        <p className="text-xs text-slate-700">Not covered</p>
                      </div>
                    </div>
                  )}

                  {coverage.length === 0 && !analyzing && (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg">
                      <p className="mb-1">No analysis run yet for {activeFramework.name}.</p>
                      <p className="text-xs">Click <strong>Run Analysis</strong> to map your approved {activeFramework.subject} units against these standards.</p>
                    </div>
                  )}

                  {groupedStandards.map(([group, items]) => (
                    <div key={group} className="mb-6">
                      <h3 className="text-sm font-bold text-slate-800 mb-2 border-b pb-1">{group}</h3>
                      <div className="space-y-1">
                        {items.map(s => {
                          const entry = perStandard[s.id];
                          const maxDepth = entry?.maxDepth ?? 0;
                          const isExpanded = expandedStandard === s.id;
                          const rows = entry?.rows || [];
                          return (
                            <div key={s.id} className="border border-slate-200 rounded">
                              <button
                                onClick={() => setExpandedStandard(isExpanded ? null : s.id)}
                                className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-slate-50"
                              >
                                <span className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${DEPTH_COLOR[maxDepth]}`}>
                                  {DEPTH_LABEL[maxDepth]}
                                </span>
                                <span className="font-mono text-xs text-slate-600 whitespace-nowrap">{s.code}</span>
                                <span className="text-sm text-slate-700 flex-1 truncate">{s.description}</span>
                                {rows.length > 0 && (
                                  <span className="text-xs text-slate-400">{rows.length} unit{rows.length !== 1 ? 's' : ''}</span>
                                )}
                                <span className="text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                              </button>
                              {isExpanded && (
                                <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50">
                                  <p className="text-sm text-slate-700 mb-3">{s.description}</p>
                                  {rows.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No unit addresses this standard.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {rows.sort((a, b) => b.depth - a.depth).map(r => (
                                        <div key={r.doc_id} className="bg-white rounded p-2 border border-slate-200">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${DEPTH_COLOR[r.depth]}`}>
                                              {DEPTH_LABEL[r.depth]}
                                            </span>
                                            <Link href={`/admin/docs/${r.doc_id}`}
                                              className="text-sm text-indigo-600 hover:underline font-medium">
                                              {r.unit_title}
                                            </Link>
                                            <span className="text-xs text-slate-500">&middot; {r.teacher_name} &middot; Grade {r.doc_grade}</span>
                                          </div>
                                          {r.rationale && <p className="text-xs text-slate-600">{r.rationale}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-slate-600 mb-1">Enable at least one framework above to start tracking coverage.</p>
              <p className="text-sm text-slate-400">If you&rsquo;re in Massachusetts, the MA Science & Technology/Engineering framework is a good place to start.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
