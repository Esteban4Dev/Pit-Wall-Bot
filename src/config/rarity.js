const RARITY_META = {
  common: { emoji: '⚪', label: 'Común', color: 0xb0b0b0 },
  special: { emoji: '🔵', label: 'Especial', color: 0x3498db },
  epic: { emoji: '🟣', label: 'Épica', color: 0x9b59b6 },
  legendary: { emoji: '🟡', label: 'Legendaria', color: 0xf1c40f }
};

const RARITY_ORDER = ['legendary', 'epic', 'special', 'common'];

// Probabilidades relativas para /daily
const DAILY_WEIGHTS = { common: 60, special: 27, epic: 10, legendary: 3 };

// Probabilidades relativas para /packs (ligeramente mejores, es lo que pagas)
const PACK_WEIGHTS = { common: 45, special: 32, epic: 18, legendary: 5 };

module.exports = { RARITY_META, RARITY_ORDER, DAILY_WEIGHTS, PACK_WEIGHTS };
