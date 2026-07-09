import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';

mkdirSync(dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Esquema portable: SQL estándar fácil de migrar a PostgreSQL (RDS).
 * Los repositorios encapsulan todo el SQL — para migrar a AWS solo
 * se reemplaza esta capa (o se cambia el driver) sin tocar servicios.
 */
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('empleado', 'aprobador', 'gestor')),
  must_change_password INTEGER NOT NULL DEFAULT 0,
  temp_password TEXT
);

CREATE TABLE IF NOT EXISTS requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  area TEXT NOT NULL,
  type TEXT NOT NULL,
  requester_position TEXT NOT NULL DEFAULT '',
  impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 3),
  urgency INTEGER NOT NULL CHECK (urgency BETWEEN 1 AND 3),
  priority_score INTEGER NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('alta', 'media', 'baja')),
  status TEXT NOT NULL DEFAULT 'creado',
  requested_date TEXT NOT NULL,
  attachments TEXT NOT NULL DEFAULT '[]',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS requirement_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_req_status ON requirements(status);

CREATE INDEX IF NOT EXISTS idx_req_area ON requirements(area);
CREATE INDEX IF NOT EXISTS idx_events_req ON requirement_events(requirement_id);
`);

/** Migraciones ligeras para bases creadas con versiones anteriores */
const requirementColumns = (
  db.prepare(`PRAGMA table_info(requirements)`).all() as Array<{ name: string }>
).map((c) => c.name);

if (!requirementColumns.includes('requester_position')) {
  db.exec(`ALTER TABLE requirements ADD COLUMN requester_position TEXT NOT NULL DEFAULT ''`);
}

if (!requirementColumns.includes('assigned_to')) {
  db.exec(`ALTER TABLE requirements ADD COLUMN assigned_to INTEGER REFERENCES users(id)`);
}

// Responsable externo (persona que no es usuario del sistema)
if (!requirementColumns.includes('assigned_external')) {
  db.exec(`ALTER TABLE requirements ADD COLUMN assigned_external TEXT`);
}

const userColumns = (db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>).map(
  (c) => c.name,
);

if (!userColumns.includes('must_change_password')) {
  db.exec(`ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0`);
}

// Contraseña temporal visible para el aprobador SOLO mientras esté pendiente el cambio
if (!userColumns.includes('temp_password')) {
  db.exec(`ALTER TABLE users ADD COLUMN temp_password TEXT`);
}

// Migración: bases creadas antes del rol 'gestor' tienen un CHECK que lo rechaza.
// SQLite no permite modificar CHECKs: se reconstruye la tabla conservando los datos.
const usersTableSql = (
  db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`).get() as
    | { sql: string }
    | undefined
)?.sql;

if (usersTableSql && !usersTableSql.includes("'gestor'")) {
  db.pragma('foreign_keys = OFF');
  db.exec(`
    BEGIN;
    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('empleado', 'aprobador', 'gestor')),
      must_change_password INTEGER NOT NULL DEFAULT 0,
      temp_password TEXT
    );
    INSERT INTO users_new (id, email, name, password_hash, role, must_change_password, temp_password)
      SELECT id, email, name, password_hash, role, must_change_password, temp_password FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
    COMMIT;
  `);
  db.pragma('foreign_keys = ON');
}
