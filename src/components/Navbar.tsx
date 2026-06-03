'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SessionPayload } from '@/lib/types';

export default function Navbar() {
  const [user, setUser] = useState<SessionPayload | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setUser(data.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  const browseHref = user ? `/curriculum?district=${user.districtSlug}` : '/curriculum';

  return (
    <nav className="bg-slate-900 text-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-indigo-500 text-white font-serif text-lg font-bold">C</span>
            <div>
              <span className="font-semibold text-lg tracking-tight">Curriclio</span>
              {user && (
                <span className="hidden sm:inline text-xs text-slate-300 ml-2">{user.districtName}</span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href={browseHref}
              className={`px-3 py-2 rounded text-sm hover:bg-slate-800 transition ${pathname.startsWith('/curriculum') ? 'bg-slate-800' : ''}`}
            >
              Curriculum
            </Link>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={`px-3 py-2 rounded text-sm hover:bg-slate-800 transition ${pathname.startsWith('/admin') ? 'bg-slate-800' : ''}`}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/teacher"
                  className={`px-3 py-2 rounded text-sm hover:bg-slate-800 transition ${pathname.startsWith('/teacher') ? 'bg-slate-800' : ''}`}
                >
                  {user.role === 'admin' ? 'Docs' : 'My Docs'}
                </Link>
                <span className="text-slate-300 text-xs hidden sm:inline px-2">
                  {user.name}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${user.role === 'admin' ? 'bg-indigo-500/30 text-indigo-100' : 'bg-slate-700 text-slate-300'}`}>
                    {user.role}
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded text-sm hover:bg-slate-800 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-3 py-2 rounded text-sm hover:bg-slate-800 transition ${pathname === '/login' ? 'bg-slate-800' : ''}`}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-2 rounded text-sm bg-indigo-500 hover:bg-indigo-400 transition"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
