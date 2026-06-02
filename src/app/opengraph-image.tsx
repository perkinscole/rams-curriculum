import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Curriclio — Curriculum management for school districts';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0f172a',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '12px',
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px',
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ color: 'white', fontSize: '56px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Curriclio
          </div>
        </div>
        <div style={{ color: 'white', fontSize: '64px', fontWeight: 700, lineHeight: 1.1, maxWidth: '900px' }}>
          Curriculum management without the headache.
        </div>
        <div style={{ color: '#94a3b8', fontSize: '28px', marginTop: '32px' }}>
          For school district curriculum coordinators.
        </div>
      </div>
    ),
    { ...size }
  );
}
