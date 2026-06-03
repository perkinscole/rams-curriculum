'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Snapshot {
  districtName: string;
  totalUnits: number;
  approvedUnits: number;
  pendingUnits: number;
  draftUnits: number;
  teacherCount: number;
  adminCount: number;
  subjectsCovered: number;
  framworksEnabled: number;
}

export default function AccreditationConfigPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [audienceName, setAudienceName] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [missionStatement, setMissionStatement] = useState('');

  useEffect(() => {
    fetch('/api/accreditation/snapshot')
      .then(r => r.json())
      .then(data => setSnapshot(data.snapshot || null));
  }, []);

  const params = new URLSearchParams();
  if (audienceName) params.set('audience', audienceName);
  if (reviewerName) params.set('reviewer', reviewerName);
  if (missionStatement) params.set('mission', missionStatement);
  const reportUrl = `/admin/accreditation/report${params.toString() ? `?${params}` : ''}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-2 mb-2">Accreditation Report</h1>
      <p className="text-slate-600 mb-6">
        Generate a printable report summarizing your district&rsquo;s curriculum for accreditation
        bodies (NEASC, Cognia/AdvancED, state DESE) or board presentations.
      </p>

      {snapshot && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-3">Your report will include</h2>
          <ul className="text-sm text-slate-700 space-y-2">
            <li className="flex items-baseline gap-3">
              <span className="text-indigo-600 font-bold w-12 text-right">{snapshot.approvedUnits}</span>
              <span>approved curriculum units across {snapshot.subjectsCovered} subject{snapshot.subjectsCovered !== 1 ? 's' : ''}</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="text-indigo-600 font-bold w-12 text-right">{snapshot.teacherCount}</span>
              <span>teacher{snapshot.teacherCount !== 1 ? 's' : ''} on the faculty roster</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="text-indigo-600 font-bold w-12 text-right">{snapshot.framworksEnabled}</span>
              <span>standards framework{snapshot.framworksEnabled !== 1 ? 's' : ''} (coverage analysis where you&rsquo;ve run it)</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="text-indigo-600 font-bold w-12 text-right">3</span>
              <span>sample units printed in full as evidence appendix</span>
            </li>
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-bold text-slate-800 mb-3">Optional report header info</h2>
        <p className="text-xs text-slate-500 mb-4">All optional &mdash; skip if you don&rsquo;t need them.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prepared for</label>
            <input value={audienceName} onChange={e => setAudienceName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="e.g., NEASC Visiting Committee, March 2026" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prepared by</label>
            <input value={reviewerName} onChange={e => setReviewerName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="e.g., Director of Curriculum and Instruction" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">District mission statement</label>
            <textarea value={missionStatement} onChange={e => setMissionStatement(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24"
              placeholder="Optional — appears under the cover page." />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href={reportUrl} target="_blank" rel="noopener"
          className="bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-400">
          Generate Report
        </Link>
        <Link href="/admin" className="border border-slate-300 px-6 py-2.5 rounded-lg font-medium hover:bg-slate-50">
          Cancel
        </Link>
      </div>

      <p className="text-xs text-slate-400 mt-6">
        The report opens in a new tab and the browser print dialog appears automatically &mdash; save as PDF
        or print directly. Re-run anytime to reflect new approved units.
      </p>
    </div>
  );
}
