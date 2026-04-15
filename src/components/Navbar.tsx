'use client';

import Link from 'next/link';
import Image from 'next/image';
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

  return (
    <nav className="bg-[#8B1A1A] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="RAMS" width={40} height={40} className="rounded-full" />
            <div>
              <span className="font-bold text-lg">RAMS Curriculum</span>
              <span className="hidden sm:inline text-xs text-red-200 ml-2">Robert Adams Middle School</span>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/curriculum"
              className={`px-3 py-2 rounded text-sm hover:bg-[#a52525] transition ${pathname.startsWith('/curriculum') ? 'bg-[#a52525]' : ''}`}
            >
              Curriculum
            </Link>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={`px-3 py-2 rounded text-sm hover:bg-[#a52525] transition ${pathname.startsWith('/admin') ? 'bg-[#a52525]' : ''}`}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/teacher"
                  className={`px-3 py-2 rounded text-sm hover:bg-[#a52525] transition ${pathname.startsWith('/teacher') ? 'bg-[#a52525]' : ''}`}
                >
                  {user.role === 'admin' ? 'Docs' : 'My Docs'}
                </Link>
                <span className="text-red-200 text-xs hidden sm:inline px-2">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded text-sm hover:bg-[#a52525] transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={`px-3 py-2 rounded text-sm hover:bg-[#a52525] transition ${pathname === '/login' ? 'bg-[#a52525]' : ''}`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
