const { EmbedBuilder } = require('discord.js');
const { ergast } = require('../utils/api');
const { formatCountdown } = require('../utils/embeds');

const DEFAULT_CHANNEL_ID = '1539839510140035102';

async function buildRaceUpdateEmbed() {
  const race = await ergast.nextRace();

  if (!race) {
    return new EmbedBuilder()
      .setTitle('📅 Actualización F1')
      .setColor(0xe10600)
      .setDescription('No hay ninguna carrera próxima en el calendario por ahora.')
      .setTimestamp();
  }

  const raceDateTime = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
  const countdown = formatCountdown(raceDateTime);

  const sections = [
    `🏁 **${race.raceName}**\n${race.Circuit.circuitName} — ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}\n⏳ Faltan **${countdown}** · <t:${Math.floor(raceDateTime.getTime() / 1000)}:F>`
  ];

  // Historia del circuito (best-effort, no debe tumbar el post si falla)
  try {
    const history = await ergast.circuitHistory(race.Circuit.circuitId);
    if (history.total) {
      sections.push(
        `📜 **Historia:** este trazado ha sido sede de **${history.total}** Grandes Premios de F1${
          history.firstYear ? ` desde **${history.firstYear}**` : ''
        }.`
      );
    }
  } catch (err) {
    console.warn('⚠️  No pude obtener historia del circuito:', err.message);
  }

  // Último ganador (última carrera corrida de la temporada)
  try {
    const lastRace = await ergast.raceResults('current', 'last');
    const winner = lastRace?.Results?.[0];
    if (winner) {
      sections.push(
        `🏆 **Último ganador:** ${winner.Driver.givenName} ${winner.Driver.familyName} (${winner.Constructor.name}) en el ${lastRace.raceName}.`
      );
    }
  } catch (err) {
    console.warn('⚠️  No pude obtener el último ganador:', err.message);
  }

  // Líder actual del campeonato (el "bonus" extra)
  try {
    const standings = await ergast.driverStandings();
    const leader = standings[0];
    if (leader) {
      sections.push(
        `👑 **Líder del campeonato:** ${leader.Driver.givenName} ${leader.Driver.familyName} — **${leader.points}** pts (${leader.wins} victorias).`
      );
    }
  } catch (err) {
    console.warn('⚠️  No pude obtener la clasificación de pilotos:', err.message);
  }

  return new EmbedBuilder()
    .setTitle('📅 Actualización F1')
    .setColor(0xe10600)
    .setDescription(sections.join('\n\n'))
    .setFooter({ text: 'Pit Wall Bot 🏎️ · Datos: Jolpica-F1 / OpenF1' })
    .setTimestamp();
}

async function postRaceChannelUpdate(client) {
  const channelId = process.env.RACE_UPDATES_CHANNEL_ID || DEFAULT_CHANNEL_ID;
  const channel = await client.channels.fetch(channelId).catch(() => null);

  if (!channel) {
    throw new Error(`No encontré el canal ${channelId} (¿el bot está en ese servidor y tiene permiso de verlo?).`);
  }

  const embed = await buildRaceUpdateEmbed();
  await channel.send({ embeds: [embed] });
}

module.exports = { buildRaceUpdateEmbed, postRaceChannelUpdate, DEFAULT_CHANNEL_ID };
