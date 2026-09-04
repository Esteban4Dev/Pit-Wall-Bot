const { ergast } = require('../utils/api');
const { LEGENDARY_CARDS } = require('../data/legendaryCards');
const { insertCardIfNotExists, hasCardsForSeason } = require('./cards');

function seedLegendaryCards() {
  for (const card of LEGENDARY_CARDS) {
    insertCardIfNotExists(card);
  }
}

/**
 * Genera cartas de pilotos y constructores a partir de la clasificación
 * actual de la API (en vez de hardcodear una alineación que puede quedar
 * desactualizada). La rareza depende de la posición en el campeonato.
 * Es idempotente por temporada gracias al external_key + ON CONFLICT DO NOTHING.
 */
async function seedCurrentSeasonCards() {
  const schedule = await ergast.currentSeasonSchedule();
  const season = schedule[0]?.season;
  if (!season) return;

  if (hasCardsForSeason(season)) return; // ya sembrado, no repetir llamadas a la API

  const [driverStandings, constructorStandings] = await Promise.all([
    ergast.driverStandings(),
    ergast.constructorStandings()
  ]);

  driverStandings.forEach((d, i) => {
    const rarity = i < 3 ? 'epic' : i < 10 ? 'special' : 'common';
    insertCardIfNotExists({
      external_key: `driver:${season}:${d.Driver.driverId}`,
      name: `${d.Driver.givenName} ${d.Driver.familyName}`,
      type: 'driver',
      subtitle: d.Constructors?.[0]?.name ?? null,
      rarity,
      season
    });
  });

  constructorStandings.forEach((c, i) => {
    const rarity = i < 3 ? 'epic' : 'special';
    insertCardIfNotExists({
      external_key: `constructor:${season}:${c.Constructor.constructorId}`,
      name: c.Constructor.name,
      type: 'constructor',
      subtitle: `Temporada ${season}`,
      rarity,
      season
    });
  });

  console.log(`🃏 Catálogo de cartas sembrado para la temporada ${season} (${driverStandings.length} pilotos, ${constructorStandings.length} constructores).`);
}

async function seedCards() {
  seedLegendaryCards();
  try {
    await seedCurrentSeasonCards();
  } catch (err) {
    console.warn('⚠️  No pude sembrar las cartas de la temporada actual (¿sin conexión a la API?):', err.message);
  }
}

module.exports = { seedCards, seedLegendaryCards, seedCurrentSeasonCards };
