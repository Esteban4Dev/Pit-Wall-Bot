const db = require('./database');

/**
 * Crea o actualiza (upsert) la predicción de un usuario para una ronda dada.
 * Si el usuario ya tenía predicción para ese season+round, la reemplaza y
 * marca updated_at. No se puede editar una predicción ya puntuada (scored=1).
 */
function upsertPrediction({ userId, season, round, raceName, top10, pole, fastestLap, safetyCar }) {
  const existing = getPrediction(userId, season, round);

  if (existing?.scored) {
    throw new Error('Esta carrera ya fue puntuada, no se puede modificar la predicción.');
  }

  const stmt = db.prepare(`
    INSERT INTO predictions (user_id, season, round, race_name, top10, pole, fastest_lap, safety_car, updated_at)
    VALUES (@userId, @season, @round, @raceName, @top10, @pole, @fastestLap, @safetyCar, datetime('now'))
    ON CONFLICT(user_id, season, round) DO UPDATE SET
      race_name = excluded.race_name,
      top10 = excluded.top10,
      pole = excluded.pole,
      fastest_lap = excluded.fastest_lap,
      safety_car = excluded.safety_car,
      updated_at = datetime('now')
  `);

  stmt.run({
    userId,
    season,
    round,
    raceName: raceName ?? null,
    top10: JSON.stringify(top10),
    pole: pole ?? null,
    fastestLap: fastestLap ?? null,
    safetyCar: safetyCar === null || safetyCar === undefined ? null : safetyCar ? 1 : 0
  });

  return getPrediction(userId, season, round);
}

function getPrediction(userId, season, round) {
  const row = db
    .prepare(`SELECT * FROM predictions WHERE user_id = ? AND season = ? AND round = ?`)
    .get(userId, season, round);

  return row ? deserialize(row) : null;
}

function getPredictionsForRound(season, round, { onlyUnscored = false } = {}) {
  const query = onlyUnscored
    ? `SELECT * FROM predictions WHERE season = ? AND round = ? AND scored = 0`
    : `SELECT * FROM predictions WHERE season = ? AND round = ?`;

  return db.prepare(query).all(season, round).map(deserialize);
}

function markScored(id, points, counts = {}) {
  db.prepare(
    `UPDATE predictions
     SET points = ?, scored = 1, updated_at = datetime('now'),
         exact_count = ?, off_by_one_count = ?, pole_correct = ?, fastest_lap_correct = ?, safety_car_correct = ?
     WHERE id = ?`
  ).run(
    points,
    counts.exactCount ?? 0,
    counts.offByOneCount ?? 0,
    counts.poleCorrect ?? 0,
    counts.fastestLapCorrect ?? 0,
    counts.safetyCarCorrect ?? 0,
    id
  );
}

/**
 * Suma de puntos por usuario, opcionalmente filtrado a un subconjunto de user IDs
 * (usado para el leaderboard "por servidor").
 */
function getLeaderboard({ userIds = null, limit = 10 } = {}) {
  if (userIds && userIds.length === 0) return [];

  if (userIds) {
    const placeholders = userIds.map(() => '?').join(',');
    return db
      .prepare(
        `SELECT user_id, SUM(points) as total_points, COUNT(*) as races_scored
         FROM predictions
         WHERE scored = 1 AND user_id IN (${placeholders})
         GROUP BY user_id
         ORDER BY total_points DESC
         LIMIT ?`
      )
      .all(...userIds, limit);
  }

  return db
    .prepare(
      `SELECT user_id, SUM(points) as total_points, COUNT(*) as races_scored
       FROM predictions
       WHERE scored = 1
       GROUP BY user_id
       ORDER BY total_points DESC
       LIMIT ?`
    )
    .all(limit);
}

function deserialize(row) {
  return {
    ...row,
    top10: JSON.parse(row.top10),
    safetyCarBool: row.safety_car === null ? null : Boolean(row.safety_car)
  };
}

module.exports = {
  upsertPrediction,
  getPrediction,
  getPredictionsForRound,
  markScored,
  getLeaderboard
};
