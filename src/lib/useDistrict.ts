'use client';

import { useEffect, useState } from 'react';
import { District } from './types';

export function useDistrict() {
  const [district, setDistrict] = useState<District | null>(null);

  useEffect(() => {
    fetch('/api/district')
      .then(r => r.json())
      .then(data => setDistrict(data.district || null))
      .catch(() => setDistrict(null));
  }, []);

  return district;
}
