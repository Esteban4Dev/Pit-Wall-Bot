const { ergast } = require('./api');
const { shuffle } = require('./shuffle');

function driverName(driver) {
  return `${driver.givenName} ${driver.familyName}`;
}

/**
 * Genera preguntas "frescas" a partir de la API en vivo (líder actual del
 * campeonato, ganador de la última carrera). Best-effort: si la API falla o
 * no hay suficientes datos, devuelve un array vacío y /trivia simplemente
 * usa solo el banco estático.
 */
async function generateDynamicQuestions() {
  const questions = [];

  try {
    const standings = await ergast.driverStandings();
    if (standings.length >= 4) {
      const leader = standings[0];
      const correct = driverName(leader.Driver);
      const distractors = standings.slice(1, 4).map((s) => driverName(s.Driver));
      const options = shuffle([correct, ...distractors]);
      questions.push({
        id: 'dyn_leader',
        question: '¿Quién lidera actualmente el campeonato de pilotos?',
        options,
        correctIndex: options.indexOf(correct)
      });
    }
  } catch (err) {
    console.warn('⚠️  No pude generar trivia del líder del campeonato:', err.message);
  }

  try {
    const lastRace = await ergast.raceResults('current', 'last');
    if (lastRace?.Results?.length >= 4) {
      const correct = driverName(lastRace.Results[0].Driver);
      const distractors = lastRace.Results.slice(1, 4).map((r) => driverName(r.Driver));
      const options = shuffle([correct, ...distractors]);
      questions.push({
        id: 'dyn_lastwinner',
        question: `¿Quién ganó el ${lastRace.raceName}?`,
        options,
        correctIndex: options.indexOf(correct)
      });
    }
  } catch (err) {
    console.warn('⚠️  No pude generar trivia del último ganador:', err.message);
  }

  return questions;
}

module.exports = { generateDynamicQuestions };
