const db = require('./database');

function getBalance(userId) {
  const row = db.prepare(`SELECT balance FROM wallets WHERE user_id = ?`).get(userId);
  return row?.balance ?? 0;
}

function credit(userId, amount) {
  if (amount <= 0) return;
  db.prepare(
    `INSERT INTO wallets (user_id, balance) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET balance = balance + excluded.balance`
  ).run(userId, amount);
}

const debit = db.transaction((userId, amount) => {
  const balance = getBalance(userId);
  if (balance < amount) {
    throw new Error(`Saldo insuficiente: tienes ${balance} pts, necesitas ${amount}.`);
  }
  db.prepare(`UPDATE wallets SET balance = balance - ? WHERE user_id = ?`).run(amount, userId);
});

/**
 * Ranking de saldo de billetera (puntos gastables en /packs), opcionalmente
 * filtrado a un subconjunto de user IDs (para el alcance "servidor").
 */
function getLeaderboard({ userIds = null, limit = 10 } = {}) {
  if (userIds && userIds.length === 0) return [];

  if (userIds) {
    const placeholders = userIds.map(() => '?').join(',');
    return db
      .prepare(
        `SELECT user_id, balance FROM wallets
         WHERE balance > 0 AND user_id IN (${placeholders})
         ORDER BY balance DESC
         LIMIT ?`
      )
      .all(...userIds, limit);
  }

  return db.prepare(`SELECT user_id, balance FROM wallets WHERE balance > 0 ORDER BY balance DESC LIMIT ?`).all(limit);
}

module.exports = { getBalance, credit, debit, getLeaderboard };
