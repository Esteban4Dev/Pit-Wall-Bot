const { ergast, openf1 } = require('./api');

const POINTS = {
  exactPosition: 10,
  offByOne: 5,
  pole: 5,
  fastestLap: 3,
  safetyCar: 2
};

/**
 * Obtiene el "resultado real" de una ronda en el formato que necesitamos para
 * comparar contra las predicciones: top10 (códigos de piloto en orden P1->P10),
 * pole, vuelta rápida, y si hubo safety car (best-effort, puede ser null si
 * no hay datos).
 */
async function getActualResults(season, round) {
  const race = await ergast.raceResults(season, round);
  if (!race || !race.Results?.length) return null;

  const top10 = race.Results.slice(0, 10).map((r) => driverCode(r.Driver));

  const fastestLapResult = race.Results.find((r) => r.FastestLap?.rank === '1');
  const fastestLap = fastestLapResult ? driverCode(fastestLapResult.Driver) : null;

  let pole = null;
  const qualifying = await ergast.qualifyingResults(season, round);
  if (qualifying?.QualifyingResults?.length) {
    pole = driverCode(qualifying.QualifyingResults[0].Driver);
  }

  let safetyCar = null;
  try {
    const session = await openf1.findRaceSessionByDate(race.date);
    if (session) {
      safetyCar = await openf1.wasSafetyCarDeployed(session.session_key);
    }
  } catch (err) {
    console.warn(`⚠️  No se pudo determinar Safety Car para ${season} R${round}:`, err.message);
  }

  return { top10, pole, fastestLap, safetyCar, raceName: race.raceName };
}

function driverCode(driver) {
  // La mayoría de los pilotos actuales tienen "code" (3 letras). Fallback por si
  // algún piloto histórico no lo trae.
  return driver.code ?? driver.familyName.slice(0, 3).toUpperCase();
}

/**
 * Compara una predicción contra el resultado real. Devuelve tanto los
 * conteos crudos (aciertos exactos, off-by-one, etc. — útiles para que cada
 * liga aplique su propio sistema de puntos) como el total y desglose ya
 * ponderados con los pesos por defecto del bot.
 */
function scorePrediction(prediction, actual, weights = POINTS) {
  const counts = { exactCount: 0, offByOneCount: 0, poleCorrect: 0, fastestLapCorrect: 0, safetyCarCorrect: 0 };

  prediction.top10.forEach((code, predictedIdx) => {
    const actualIdx = actual.top10.indexOf(code);
    if (actualIdx === -1) return;

    if (actualIdx === predictedIdx) {
      counts.exactCount += 1;
    } else if (Math.abs(actualIdx - predictedIdx) === 1) {
      counts.offByOneCount += 1;
    }
  });

  if (prediction.pole && actual.pole && prediction.pole === actual.pole) {
    counts.poleCorrect = 1;
  }

  if (prediction.fastest_lap && actual.fastestLap && prediction.fastest_lap === actual.fastestLap) {
    counts.fastestLapCorrect = 1;
  }

  if (
    prediction.safetyCarBool !== null &&
    actual.safetyCar !== null &&
    prediction.safetyCarBool === actual.safetyCar
  ) {
    counts.safetyCarCorrect = 1;
  }

  const breakdown = {
    exact: counts.exactCount * weights.exactPosition,
    offByOne: counts.offByOneCount * weights.offByOne,
    pole: counts.poleCorrect * weights.pole,
    fastestLap: counts.fastestLapCorrect * weights.fastestLap,
    safetyCar: counts.safetyCarCorrect * weights.safetyCar
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total, breakdown, counts };
}

/**
 * Aplica un set de pesos custom (ej: los de una liga) sobre conteos ya
 * guardados en la base de datos, sin necesitar los resultados reales de nuevo.
 */
function applyWeights(counts, weights) {
  return (
    (counts.exact_count ?? 0) * weights.exactPosition +
    (counts.off_by_one_count ?? 0) * weights.offByOne +
    (counts.pole_correct ?? 0) * weights.pole +
    (counts.fastest_lap_correct ?? 0) * weights.fastestLap +
    (counts.safety_car_correct ?? 0) * weights.safetyCar
  );
}

module.exports = { getActualResults, scorePrediction, applyWeights, POINTS };
