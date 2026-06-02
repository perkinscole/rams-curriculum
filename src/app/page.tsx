import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-500/20 text-indigo-200 text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full mb-6">
            For curriculum coordinators
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Curriculum management without the headache.
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Curriculo gives your district one place to write, review, and approve unit plans.
            Built for the way curriculum offices actually work &mdash; not the way software companies imagine they do.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Start Your District&rsquo;s Free Trial
            </Link>
            <Link
              href="/login"
              className="border border-slate-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
          </div>
          <p className="text-slate-400 text-sm mt-6">No credit card required &middot; Free during pilot</p>
        </div>
      </section>

      {/* Mock dashboard preview */}
      <section className="w-full bg-gradient-to-b from-slate-900 to-slate-50 px-4 pb-16">
        <div className="max-w-5xl mx-auto -mt-10">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 flex items-center gap-1.5 border-b border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
              <span className="ml-3 text-xs text-slate-500">curriculo.app / admin</span>
            </div>
            <div className="p-6 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Admin Dashboard</h3>
                  <p className="text-xs text-slate-500">Holliston Public Schools</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3 mb-4">
                {[
                  { v: 47, l: 'Total', c: 'bg-slate-100 text-slate-700' },
                  { v: 12, l: 'Drafts', c: 'bg-slate-50 text-slate-600' },
                  { v: 6, l: 'Pending', c: 'bg-blue-50 text-blue-700' },
                  { v: 3, l: 'Revisions', c: 'bg-yellow-50 text-yellow-700' },
                  { v: 26, l: 'Approved', c: 'bg-green-50 text-green-700' },
                ].map(s => (
                  <div key={s.l} className={`rounded p-2 text-center ${s.c}`}>
                    <p className="text-lg font-bold">{s.v}</p>
                    <p className="text-[10px] uppercase tracking-wide">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <tr><th className="text-left px-3 py-2">Unit</th><th className="text-left px-3 py-2">Teacher</th><th className="text-left px-3 py-2">Subject</th><th className="text-left px-3 py-2">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="px-3 py-2 text-indigo-600 font-medium">Forces & Motion</td><td className="px-3 py-2 text-slate-600">J. Smith</td><td className="px-3 py-2 text-slate-600">Science</td><td className="px-3 py-2"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Submitted</span></td></tr>
                    <tr><td className="px-3 py-2 text-indigo-600 font-medium">The American Revolution</td><td className="px-3 py-2 text-slate-600">M. Garcia</td><td className="px-3 py-2 text-slate-600">Social Studies</td><td className="px-3 py-2"><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Approved</span></td></tr>
                    <tr><td className="px-3 py-2 text-indigo-600 font-medium">Ratios & Proportions</td><td className="px-3 py-2 text-slate-600">R. Patel</td><td className="px-3 py-2 text-slate-600">Mathematics</td><td className="px-3 py-2"><span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Revision Requested</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6 w-full">
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500">
          <h3 className="font-bold text-lg mb-2 text-slate-800">Understanding by Design</h3>
          <p className="text-slate-600 text-sm">
            Built around the UBD framework: Desired Results, Evidence of Learning, and Learning Plan.
            Teachers fill in what they already know how to write.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500">
          <h3 className="font-bold text-lg mb-2 text-slate-800">Submit, review, approve</h3>
          <p className="text-slate-600 text-sm">
            Teachers draft, you review, you approve. Comment threads, revision requests, and full
            history on every document.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500">
          <h3 className="font-bold text-lg mb-2 text-slate-800">Cross-curricular connections</h3>
          <p className="text-slate-600 text-sm">
            Optional AI analysis surfaces interdisciplinary opportunities across approved units &mdash;
            so your teachers can plan together instead of in silos.
          </p>
        </div>
      </section>

      {/* How it works strip */}
      <section className="w-full bg-white border-t border-slate-200 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: 1, t: 'Create your district', d: 'Sign up, name your district, pick subjects and grades.' },
              { n: 2, t: 'Invite your teachers', d: 'Add teachers from one screen. No IT ticket required.' },
              { n: 3, t: 'Collect unit plans', d: 'Teachers draft UBD units stage-by-stage and submit when ready.' },
              { n: 4, t: 'Review and approve', d: 'Approve, request revisions, or leave notes &mdash; all in one place.' },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center mx-auto mb-3">{step.n}</div>
                <h3 className="font-semibold text-slate-800 mb-1">{step.t}</h3>
                <p className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: step.d }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 w-full text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Ready in five minutes</h2>
        <p className="text-slate-600 mb-6">
          Create your district account, invite your teachers, and start collecting unit plans today.
          No IT ticket required.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
        >
          Create Your District Account
        </Link>
      </section>
    </div>
  );
}
