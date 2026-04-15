import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'curriculum.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher', 'admin')),
      department TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS curriculum_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      subject_area TEXT NOT NULL,
      course TEXT DEFAULT '',
      unit_title TEXT NOT NULL,
      grade TEXT NOT NULL CHECK(grade IN ('6', '7', '8')),
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      unit_summary TEXT DEFAULT '',
      stage1 TEXT DEFAULT '{}',
      stage2 TEXT DEFAULT '{}',
      stage3 TEXT DEFAULT '{}',
      stage1_complete INTEGER DEFAULT 0,
      stage2_complete INTEGER DEFAULT 0,
      stage3_complete INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'revision_requested', 'approved')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS doc_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      changes_json TEXT DEFAULT '{}',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (doc_id) REFERENCES curriculum_docs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (doc_id) REFERENCES curriculum_docs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed default admin if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const teacherHash = bcrypt.hashSync('teacher123', 10);

    db.prepare(`INSERT INTO users (email, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?)`)
      .run('admin@holliston.k12.ma.us', adminHash, 'Admin User', 'admin', 'Administration');

    db.prepare(`INSERT INTO users (email, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?)`)
      .run('teacher@holliston.k12.ma.us', teacherHash, 'Jane Smith', 'teacher', 'Science');

    db.prepare(`INSERT INTO users (email, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?)`)
      .run('teacher2@holliston.k12.ma.us', teacherHash, 'John Doe', 'teacher', 'ELA');

    console.log('Database seeded with default users');
  }
}

export default getDb;
