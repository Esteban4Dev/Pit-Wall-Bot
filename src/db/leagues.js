const db = require('./database');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0/I/1 para evitar confusiones

function generateCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function createLeague({ name, ownerId, weights }) {
  let code;
  // Reintenta si por rarísima casualidad el código ya existe.
  do {
    code = generateCode();
  } while (getLeagueByCode(code));

  const result = db
    .prepare(
      `INSERT INTO leagues (name, code, owner_id, weight_exact, weight_offbyone, weight_pole, weight_fastestlap, weight_safetycar)
       VALUES (@name, @code, @ownerId, @weightExact, @weightOffByOne, @weightPole, @weightFastestLap, @weightSafetyCar)`
    )
    .run({
      name,
      code,
      ownerId,
      weightExact: weights?.exactPosition ?? 10,
      weightOffByOne: weights?.offByOne ?? 5,
      weightPole: weights?.pole ?? 5,
      weightFastestLap: weights?.fastestLap ?? 3,
      weightSafetyCar: weights?.safetyCar ?? 2
    });

  const league = getLeagueById(result.lastInsertRowid);
  joinLeague(league.id, ownerId);
  return league;
}

function getLeagueById(id) {
  return db.prepare(`SELECT * FROM leagues WHERE id = ?`).get(id);
}

function getLeagueByCode(code) {
  return db.prepare(`SELECT * FROM leagues WHERE code = ?`).get(code.toUpperCase());
}

function joinLeague(leagueId, userId) {
  db.prepare(`INSERT INTO league_members (league_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING`).run(
    leagueId,
    userId
  );
}

function getLeaguesForUser(userId) {
  return db
    .prepare(
      `SELECT l.* FROM leagues l
       JOIN league_members lm ON lm.league_id = l.id
       WHERE lm.user_id = ?
       ORDER BY l.created_at ASC`
    )
    .all(userId);
}

function getMemberCount(leagueId) {
  return db.prepare(`SELECT COUNT(*) as c FROM league_members WHERE league_id = ?`).get(leagueId).c;
}

function leagueWeights(league) {
  return {
    exactPosition: league.weight_exact,
    offByOne: league.weight_offbyone,
    pole: league.weight_pole,
    fastestLap: league.weight_fastestlap,
    safetyCar: league.weight_safetycar
  };
}

/**
 * Suma de conteos crudos (no puntos) de todas las predicciones puntuadas de
 * cada miembro de la liga. El total en puntos según el sistema propio de la
 * liga se calcula después, en JS, aplicando los pesos.
 */
function getLeagueRawScores(leagueId) {
  return db
    .prepare(
      `SELECT
         p.user_id,
         SUM(p.exact_count) as exact_count,
         SUM(p.off_by_one_count) as off_by_one_count,
         SUM(p.pole_correct) as pole_correct,
         SUM(p.fastest_lap_correct) as fastest_lap_correct,
         SUM(p.safety_car_correct) as safety_car_correct,
         COUNT(*) as races_scored
       FROM predictions p
       JOIN league_members lm ON lm.user_id = p.user_id
       WHERE lm.league_id = ? AND p.scored = 1
       GROUP BY p.user_id`
    )
    .all(leagueId);
}

function crownChampion({ leagueId, season, userId, points }) {
  db.prepare(
    `INSERT INTO league_champions (league_id, season, user_id, points)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(league_id, season) DO UPDATE SET user_id = excluded.user_id, points = excluded.points, crowned_at = datetime('now')`
  ).run(leagueId, season, userId, points);
}

function getHallOfFame(leagueId) {
  return db
    .prepare(`SELECT * FROM league_champions WHERE league_id = ? ORDER BY season DESC`)
    .all(leagueId);
}

module.exports = {
  createLeague,
  getLeagueById,
  getLeagueByCode,
  joinLeague,
  getLeaguesForUser,
  getMemberCount,
  leagueWeights,
  getLeagueRawScores,
  crownChampion,
  getHallOfFame
};
