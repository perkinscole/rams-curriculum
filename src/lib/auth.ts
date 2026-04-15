import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { SessionPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'rams-curriculum-secret-change-in-production';
const COOKIE_NAME = 'rams_session';

export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(role?: 'teacher' | 'admin'): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  if (role && session.role !== role && session.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return session;
}

export { COOKIE_NAME };
