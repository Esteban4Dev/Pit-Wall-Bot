const cron = require('node-cron');
const { postRaceChannelUpdate, DEFAULT_CHANNEL_ID } = require('./raceUpdatePost');
const { announceTriviaChampion } = require('./triviaChampionJob');
const { previousPeriod } = require('../db/triviaLeague');

function startScheduler(client) {
  const schedule = process.env.RACE_UPDATE_CRON || '0 9 * * *'; // todos los días a las 9:00
  const channelId = process.env.RACE_UPDATES_CHANNEL_ID || DEFAULT_CHANNEL_ID;

  if (!cron.validate(schedule)) {
    console.warn(`⚠️  RACE_UPDATE_CRON="${schedule}" no es una expresión cron válida, usando default "0 9 * * *".`);
  }

  cron.schedule(cron.validate(schedule) ? schedule : '0 9 * * *', () => {
    postRaceChannelUpdate(client).catch((err) => console.error('Error publicando actualización F1:', err.message));
  });

  console.log(`🕒 Actualizaciones automáticas de F1 activas (cron "${schedule}") → canal ${channelId}`);

  // Corona automáticamente al campeón de trivia del mes que acaba de
  // terminar, el día 1 de cada mes a las 00:05 (hora del servidor donde
  // corra el bot). Ya no depende de que un admin corra /admin crowntrivia.
  const triviaSchedule = process.env.TRIVIA_CROWN_CRON || '5 0 1 * *';

  if (!cron.validate(triviaSchedule)) {
    console.warn(`⚠️  TRIVIA_CROWN_CRON="${triviaSchedule}" no es válido, usando default "5 0 1 * *".`);
  }

  cron.schedule(cron.validate(triviaSchedule) ? triviaSchedule : '5 0 1 * *', () => {
    announceTriviaChampion(client, previousPeriod()).catch((err) =>
      console.error('Error coronando campeón de trivia automáticamente:', err.message)
    );
  });

  console.log(`🏆 Coronación automática de campeón de trivia activa (cron "${triviaSchedule}", día 1 de cada mes)`);
}

module.exports = { startScheduler };
