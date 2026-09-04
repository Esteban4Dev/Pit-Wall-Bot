const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'pitwall.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    season TEXT NOT NULL,
    round INTEGER NOT NULL,
    race_name TEXT,
    top10 TEXT NOT NULL,        -- JSON array de 10 códigos de piloto, ordenados P1->P10
    pole TEXT,                  -- código de piloto o NULL
    fastest_lap TEXT,           -- código de piloto o NULL
    safety_car INTEGER,         -- 1 = sí, 0 = no, NULL = sin predecir
    points INTEGER,             -- NULL hasta que se puntúe
    scored INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, season, round)
  );

  CREATE INDEX IF NOT EXISTS idx_predictions_round ON predictions(season, round);
  CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_key TEXT NOT NULL UNIQUE, -- evita duplicados al re-sembrar (ej: 'driver:2026:max_verstappen')
    name TEXT NOT NULL,
    type TEXT NOT NULL,                -- 'driver' | 'constructor' | 'legend'
    subtitle TEXT,                     -- equipo, o nacionalidad/era para leyendas
    rarity TEXT NOT NULL,              -- common | special | epic | legendary
    season TEXT                        -- temporada que representa, NULL para leyendas
  );

  CREATE TABLE IF NOT EXISTS user_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    obtained_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, card_id)
  );

  CREATE TABLE IF NOT EXISTS daily_claims (
    user_id TEXT PRIMARY KEY,
    last_claim_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trivia_claims (
    user_id TEXT PRIMARY KEY,
    last_claim_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quicktrivia_claims (
    user_id TEXT PRIMARY KEY,
    last_claim_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wallets (
    user_id TEXT PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user TEXT NOT NULL,
    to_user TEXT NOT NULL,
    offer_card_id INTEGER NOT NULL,
    request_card_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined | failed
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leagues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,       -- código corto para /joinleague
    owner_id TEXT NOT NULL,
    weight_exact INTEGER NOT NULL DEFAULT 10,
    weight_offbyone INTEGER NOT NULL DEFAULT 5,
    weight_pole INTEGER NOT NULL DEFAULT 5,
    weight_fastestlap INTEGER NOT NULL DEFAULT 3,
    weight_safetycar INTEGER NOT NULL DEFAULT 2,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS league_members (
    league_id INTEGER NOT NULL REFERENCES leagues(id),
    user_id TEXT NOT NULL,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (league_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS league_champions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    league_id INTEGER NOT NULL REFERENCES leagues(id),
    season TEXT NOT NULL,
    user_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    crowned_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(league_id, season)
  );

  CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);

  CREATE TABLE IF NOT EXISTS trivia_scores (
    user_id TEXT NOT NULL,
    period TEXT NOT NULL,           -- 'YYYY-MM'
    points INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, period)
  );

  CREATE TABLE IF NOT EXISTS trivia_champions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT NOT NULL UNIQUE,    -- un solo campeón por mes
    user_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    claimed_card_id INTEGER,        -- NULL hasta que elija su carta con /choosecard
    crowned_at TEXT NOT NULL DEFAULT (datetime('now')),
    claimed_at TEXT
  );
`);

// --- Migración: recordar la última pregunta de trivia mostrada a cada
// usuario, para no repetirla dos veces seguidas por pura casualidad del azar.
for (const table of ['trivia_claims', 'quicktrivia_claims']) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!columns.includes('last_question_id')) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN last_question_id TEXT`);
  }
}

// Tope diario de /quicktrivia (además de su cooldown de 10 min)
{
  const columns = db.prepare(`PRAGMA table_info(quicktrivia_claims)`).all().map((c) => c.name);
  if (!columns.includes('uses_today')) {
    db.exec(`ALTER TABLE quicktrivia_claims ADD COLUMN uses_today INTEGER NOT NULL DEFAULT 0`);
  }
  if (!columns.includes('day')) {
    db.exec(`ALTER TABLE quicktrivia_claims ADD COLUMN day TEXT`);
  }
}
// --- Migración ligera: agrega a `predictions` las columnas de desglose que
// necesitan las ligas para poder aplicar su propio sistema de puntos sobre
// los mismos aciertos, sin tener que re-consultar resultados históricos.
// Usamos PRAGMA + ALTER TABLE en vez de solo CREATE TABLE IF NOT EXISTS para
// no romper bases de datos ya creadas con una versión anterior del bot.
const predictionColumns = db.prepare(`PRAGMA table_info(predictions)`).all().map((c) => c.name);
const breakdownColumns = {
  exact_count: 'INTEGER',
  off_by_one_count: 'INTEGER',
  pole_correct: 'INTEGER',
  fastest_lap_correct: 'INTEGER',
  safety_car_correct: 'INTEGER'
};
for (const [column, type] of Object.entries(breakdownColumns)) {
  if (!predictionColumns.includes(column)) {
    db.exec(`ALTER TABLE predictions ADD COLUMN ${column} ${type}`);
  }
}

module.exports = db;
