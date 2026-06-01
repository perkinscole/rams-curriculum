import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-500/20 text-indigo-200 text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full mb-6">
            For curriculum directors
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Curriculum management without the headache.
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Curriculo gives your district one place to write, review, and approve unit plans.
            Built for the way curriculum offices actually work — not the way software companies imagine they do.
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

      <section className="max-w-4xl mx-auto px-4 pb-16 w-full text-center">
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
