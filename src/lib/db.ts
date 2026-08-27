import type BetterSqlite3 from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

let dbInstance: BetterSqlite3.Database | null = null;
let dbError: Error | null = null;

function initDb(): BetterSqlite3.Database {
  const Database = require('better-sqlite3') as typeof BetterSqlite3;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'pdfs'), { recursive: true });

  const d = new Database(path.join(DATA_DIR, 'cv.db'));
  d.pragma('journal_mode = WAL');
  d.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data_json TEXT NOT NULL,
      raw_linkedin_json TEXT,
      raw_cv_text TEXT,
      free_text TEXT,
      links_json TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      source_url TEXT,
      raw_text TEXT NOT NULL,
      company_name TEXT,
      role_title TEXT,
      research_json TEXT,
      requirements_json TEXT,
      language TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cvs (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      cv_json TEXT NOT NULL,
      pdf_path TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
  `);
  return d;
}

export function getDb(): BetterSqlite3.Database {
  if (dbInstance) return dbInstance;
  if (dbError) throw dbError;
  try {
    dbInstance = initDb();
    return dbInstance;
  } catch (e) {
    dbError = e as Error;
    throw dbError;
  }
}

export function tryGetDb(): BetterSqlite3.Database | null {
  try { return getDb(); } catch { return null; }
}

export { DATA_DIR };
