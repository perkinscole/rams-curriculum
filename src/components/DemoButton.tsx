'use client';

import { useState } from 'react';

export default function DemoButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start demo.');
        return;
      }
      window.location.href = data.redirect || '/admin';
    } catch {
      setError('Could not start demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button onClick={startDemo} disabled={loading} className={className}>
        {loading ? 'Setting up demo…' : 'Try Demo District'}
      </button>
      {error && <span className="text-red-300 text-xs">{error}</span>}
    </div>
  );
}
