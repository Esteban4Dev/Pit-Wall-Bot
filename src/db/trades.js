const db = require('./database');

function createTrade({ fromUser, toUser, offerCardId, requestCardId }) {
  const result = db
    .prepare(
      `INSERT INTO trades (from_user, to_user, offer_card_id, request_card_id)
       VALUES (?, ?, ?, ?)`
    )
    .run(fromUser, toUser, offerCardId, requestCardId);
  return getTrade(result.lastInsertRowid);
}

function getTrade(id) {
  return db.prepare(`SELECT * FROM trades WHERE id = ?`).get(id);
}

function updateTradeStatus(id, status) {
  db.prepare(`UPDATE trades SET status = ? WHERE id = ?`).run(status, id);
}

module.exports = { createTrade, getTrade, updateTradeStatus };
