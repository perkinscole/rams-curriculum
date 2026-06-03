import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-slate-200 text-slate-500 text-xl mb-4">🔒</span>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Admin access required</h1>
        <p className="text-slate-600 mb-6">
          You&rsquo;re signed in as a teacher. The admin section is for curriculum coordinators only.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/teacher" className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-400">
            Go to My Documents
          </Link>
          <Link href="/" className="border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50">
            Home
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-8">
          If you should have admin access, ask your curriculum coordinator to promote your account in <strong>Manage Teachers</strong>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
