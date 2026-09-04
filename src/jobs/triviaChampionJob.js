const { EmbedBuilder } = require('discord.js');
const { crownTriviaChampion } = require('../db/triviaLeague');
const { DEFAULT_CHANNEL_ID } = require('./raceUpdatePost');

/**
 * Corona al líder de un período (por defecto, el actual — pasa previousPeriod()
 * para coronar "el mes que acaba de terminar") y publica el anuncio en el
 * canal de actualizaciones. Devuelve el registro del campeón, o null si nadie
 * tiene puntos ese mes.
 */
async function announceTriviaChampion(client, period) {
  const champion = crownTriviaChampion(period);
  if (!champion) return null;

  const channelId = process.env.RACE_UPDATES_CHANNEL_ID || DEFAULT_CHANNEL_ID;
  const channel = await client.channels.fetch(channelId).catch(() => null);

  const embed = new EmbedBuilder()
    .setTitle('🧠 ¡Nuevo campeón de la Liga de Trivia!')
    .setColor(0x9b59b6)
    .setDescription(
      `<@${champion.user_id}> es el campeón de **${champion.period}** con **${champion.points}** pts.\n\n` +
        'Puede usar `/choosecard carta_id:<ID>` para reclamar **cualquier carta** del catálogo (usa `/cards` para ver los IDs).'
    );

  if (channel) {
    await channel.send({ embeds: [embed] });
  } else {
    console.warn(`⚠️  No pude anunciar al campeón de trivia: no encontré el canal ${channelId}`);
  }

  return champion;
}

module.exports = { announceTriviaChampion };
