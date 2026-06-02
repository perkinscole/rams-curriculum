import { Pool, QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _curriclioPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _curriclioSchemaReady: Promise<void> | undefined;
}

function getPool(): Pool {
  if (!global._curriclioPgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set. Add it to .env.local (Neon Postgres connection string).');
    }
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
    global._curriclioPgPool = new Pool({
      connectionString,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
  }
  return global._curriclioPgPool;
}

async function ensureSchema(): Promise<void> {
  if (!global._curriclioSchemaReady) {
    global._curriclioSchemaReady = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS districts (
          id BIGSERIAL PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
          grades JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('teacher', 'admin')),
          department TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (district_id, email)
        );
        CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

        CREATE TABLE IF NOT EXISTS curriculum_docs (
          id BIGSERIAL PRIMARY KEY,
          district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
          teacher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subject_area TEXT NOT NULL,
          course TEXT NOT NULL DEFAULT '',
          unit_title TEXT NOT NULL,
          grade TEXT NOT NULL,
          start_date TEXT NOT NULL DEFAULT '',
          end_date TEXT NOT NULL DEFAULT '',
          unit_summary TEXT NOT NULL DEFAULT '',
          stage1 JSONB NOT NULL DEFAULT '{}'::jsonb,
          stage2 JSONB NOT NULL DEFAULT '{}'::jsonb,
          stage3 JSONB NOT NULL DEFAULT '{}'::jsonb,
          stage1_complete BOOLEAN NOT NULL DEFAULT false,
          stage2_complete BOOLEAN NOT NULL DEFAULT false,
          stage3_complete BOOLEAN NOT NULL DEFAULT false,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'revision_requested', 'approved')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS curriculum_docs_district_idx ON curriculum_docs (district_id);

        CREATE TABLE IF NOT EXISTS doc_history (
          id BIGSERIAL PRIMARY KEY,
          district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
          doc_id BIGINT NOT NULL REFERENCES curriculum_docs(id) ON DELETE CASCADE,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          action TEXT NOT NULL,
          changes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS notes (
          id BIGSERIAL PRIMARY KEY,
          district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
          doc_id BIGINT NOT NULL REFERENCES curriculum_docs(id) ON DELETE CASCADE,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
    })().catch((err) => {
      global._curriclioSchemaReady = undefined;
      throw err;
    });
  }
  await global._curriclioSchemaReady;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  await ensureSchema();
  const result = await getPool().query<T>(text, params as never[]);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

export const DEFAULT_SUBJECTS = [
  'English Language Arts',
  'Mathematics',
  'Science',
  'Social Studies',
  'Art',
  'Computer Science',
  'Music',
  'Health & Wellness',
  'World Language',
];

export const DEFAULT_GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
