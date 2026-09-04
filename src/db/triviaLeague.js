const db = require('./database');

/**
 * Período actual en formato 'YYYY-MM'. Como todo queda agrupado por este
 * string, el mes "reinicia" solo — no hace falta borrar nada a mano cuando
 * empieza un mes nuevo, simplemente empieza a acumularse bajo una key nueva.
 */
function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * El período del mes recién terminado (para coronar automáticamente el
 * día 1 de cada mes, cuando ya "current" apunta al mes nuevo).
 */
function previousPeriod() {
  const d = new Date();
  d.setDate(1); // evita saltos raros de días al restar un mes
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addTriviaPoints(userId, points, period = currentPeriod()) {
  db.prepare(
    `INSERT INTO trivia_scores (user_id, period, points) VALUES (?, ?, ?)
     ON CONFLICT(user_id, period) DO UPDATE SET points = points + excluded.points`
  ).run(userId, period, points);
}

function getTriviaLeaderboard(period = currentPeriod(), limit = 10) {
  return db
    .prepare(`SELECT user_id, points FROM trivia_scores WHERE period = ? ORDER BY points DESC LIMIT ?`)
    .all(period, limit);
}

/**
 * Corona al líder de un período como campeón (crea o actualiza el registro
 * de ese mes). Devuelve null si nadie tiene puntos ese mes todavía.
 */
function crownTriviaChampion(period = currentPeriod()) {
  const top = getTriviaLeaderboard(period, 1)[0];
  if (!top) return null;

  db.prepare(
    `INSERT INTO trivia_champions (period, user_id, points)
     VALUES (?, ?, ?)
     ON CONFLICT(period) DO UPDATE SET
       user_id = excluded.user_id, points = excluded.points,
       crowned_at = datetime('now'), claimed_card_id = NULL, claimed_at = NULL`
  ).run(period, top.user_id, top.points);

  return getUnclaimedChampionship(top.user_id) ?? db.prepare(`SELECT * FROM trivia_champions WHERE period = ?`).get(period);
}

/**
 * El título de campeón "sin reclamar" más reciente de un usuario (si tiene
 * uno pendiente de elegir su carta con /choosecard).
 */
function getUnclaimedChampionship(userId) {
  return db
    .prepare(`SELECT * FROM trivia_champions WHERE user_id = ? AND claimed_card_id IS NULL ORDER BY crowned_at DESC LIMIT 1`)
    .get(userId);
}

function claimChampionCard(championshipId, cardId) {
  db.prepare(`UPDATE trivia_champions SET claimed_card_id = ?, claimed_at = datetime('now') WHERE id = ?`).run(
    cardId,
    championshipId
  );
}

module.exports = {
  currentPeriod,
  previousPeriod,
  addTriviaPoints,
  getTriviaLeaderboard,
  crownTriviaChampion,
  getUnclaimedChampionship,
  claimChampionCard
};
