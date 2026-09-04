const db = require('./database');
const { DAILY_WEIGHTS } = require('../config/rarity');

function getAllCards() {
  return db.prepare(`SELECT * FROM cards`).all();
}

function getCardById(id) {
  return db.prepare(`SELECT * FROM cards WHERE id = ?`).get(id);
}

function cardCount() {
  return db.prepare(`SELECT COUNT(*) as c FROM cards`).get().c;
}

function hasCardsForSeason(season) {
  return db.prepare(`SELECT COUNT(*) as c FROM cards WHERE season = ?`).get(season).c > 0;
}

function insertCardIfNotExists(card) {
  db.prepare(
    `INSERT INTO cards (external_key, name, type, subtitle, rarity, season)
     VALUES (@external_key, @name, @type, @subtitle, @rarity, @season)
     ON CONFLICT(external_key) DO NOTHING`
  ).run(card);
}

function getUserCollection(userId) {
  return db
    .prepare(
      `SELECT c.*, uc.quantity, uc.obtained_at
       FROM user_cards uc
       JOIN cards c ON c.id = uc.card_id
       WHERE uc.user_id = ?
       ORDER BY c.rarity, c.name`
    )
    .all(userId);
}

function getUserCardQuantity(userId, cardId) {
  const row = db.prepare(`SELECT quantity FROM user_cards WHERE user_id = ? AND card_id = ?`).get(userId, cardId);
  return row?.quantity ?? 0;
}

function addCardToUser(userId, cardId, qty = 1) {
  db.prepare(
    `INSERT INTO user_cards (user_id, card_id, quantity)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, card_id) DO UPDATE SET quantity = quantity + excluded.quantity`
  ).run(userId, cardId, qty);
}

/**
 * Transfiere `qty` copias de una carta entre dos usuarios de forma atómica.
 * Lanza error si el origen no tiene suficientes copias.
 */
const transferCard = db.transaction((fromUser, toUser, cardId, qty = 1) => {
  const have = getUserCardQuantity(fromUser, cardId);
  if (have < qty) {
    throw new Error('El usuario ya no tiene suficientes copias de esa carta.');
  }
  db.prepare(`UPDATE user_cards SET quantity = quantity - ? WHERE user_id = ? AND card_id = ?`).run(qty, fromUser, cardId);
  db.prepare(`DELETE FROM user_cards WHERE user_id = ? AND card_id = ? AND quantity <= 0`).run(fromUser, cardId);
  addCardToUser(toUser, cardId, qty);
});

/**
 * Sortea una carta al azar respetando pesos por rareza. Si una rareza no tiene
 * cartas disponibles en el catálogo, se excluye del sorteo (no rompe nada).
 */
function drawRandomCard(weights = DAILY_WEIGHTS) {
  const cards = getAllCards();
  if (!cards.length) return null;

  const buckets = { common: [], special: [], epic: [], legendary: [] };
  for (const card of cards) {
    buckets[card.rarity]?.push(card);
  }

  const availableWeights = Object.entries(weights).filter(([rarity]) => buckets[rarity]?.length);
  const totalWeight = availableWeights.reduce((sum, [, w]) => sum + w, 0);

  if (totalWeight === 0) {
    return cards[Math.floor(Math.random() * cards.length)];
  }

  let roll = Math.random() * totalWeight;
  for (const [rarity, w] of availableWeights) {
    if (roll < w) {
      const pool = buckets[rarity];
      return pool[Math.floor(Math.random() * pool.length)];
    }
    roll -= w;
  }

  return cards[Math.floor(Math.random() * cards.length)];
}

function awardRandomLegendary(userId) {
  const legends = getAllCards().filter((c) => c.rarity === 'legendary');
  if (!legends.length) return null;
  const card = legends[Math.floor(Math.random() * legends.length)];
  addCardToUser(userId, card.id, 1);
  return card;
}

module.exports = {
  getAllCards,
  getCardById,
  cardCount,
  hasCardsForSeason,
  insertCardIfNotExists,
  getUserCollection,
  getUserCardQuantity,
  addCardToUser,
  transferCard,
  drawRandomCard,
  awardRandomLegendary
};
