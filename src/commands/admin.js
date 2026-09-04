const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { ergast } = require('../utils/api');
const { getActualResults, scorePrediction } = require('../utils/scoring');
const { getPredictionsForRound, markScored } = require('../db/predictions');
const { credit } = require('../db/wallet');
const { awardRandomLegendary } = require('../db/cards');
const { postRaceChannelUpdate, DEFAULT_CHANNEL_ID } = require('../jobs/raceUpdatePost');
const { announceTriviaChampion } = require('../jobs/triviaChampionJob');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Comandos de administración del bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('score')
        .setDescription('Puntúa todas las predicciones pendientes de una carrera ya corrida')
        .addIntegerOption((option) =>
          option.setName('ronda').setDescription('Número de ronda a puntuar').setRequired(true).setMinValue(1).setMaxValue(30)
        )
        .addStringOption((option) => option.setName('temporada').setDescription('Temporada (por defecto: actual)').setRequired(false))
    )
    .addSubcommand((sub) => sub.setName('postupdate').setDescription('Publica manualmente la actualización de F1 en el canal configurado'))
    .addSubcommand((sub) =>
      sub
        .setName('crowntrivia')
        .setDescription('[Respaldo manual] Corona al líder del mes de trivia — esto ya ocurre solo el día 1 de cada mes')
        .addStringOption((option) =>
          option.setName('periodo').setDescription('Período YYYY-MM (por defecto: mes actual)').setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'crowntrivia') {
      await interaction.deferReply();

      const period = interaction.options.getString('periodo') ?? undefined;
      const champion = await announceTriviaChampion(interaction.client, period);

      if (!champion) {
        await interaction.editReply('Nadie tiene puntos de trivia registrados para ese período todavía.');
        return;
      }

      const channelId = process.env.RACE_UPDATES_CHANNEL_ID || DEFAULT_CHANNEL_ID;
      await interaction.editReply(
        `✅ Campeón coronado y anunciado en <#${channelId}>: <@${champion.user_id}> con ${champion.points} pts.`
      );
      return;
    }

    if (sub === 'postupdate') {
      await interaction.deferReply({ ephemeral: true });
      const channelId = process.env.RACE_UPDATES_CHANNEL_ID || DEFAULT_CHANNEL_ID;
      try {
        await postRaceChannelUpdate(interaction.client);
        await interaction.editReply(`✅ Actualización publicada en <#${channelId}>.`);
      } catch (err) {
        console.error('Error en /admin postupdate:', err);
        await interaction.editReply(`❌ No pude publicar la actualización: ${err.message}`);
      }
      return;
    }

    if (sub !== 'score') return;

    await interaction.deferReply();

    const round = interaction.options.getInteger('ronda');
    const season = interaction.options.getString('temporada') ?? 'current';

    const actual = await getActualResults(season, round);
    if (!actual) {
      await interaction.editReply(`No encontré resultados para la ronda ${round}. ¿Ya se corrió esa carrera?`);
      return;
    }

    // Necesitamos la temporada real (si pidieron "current") para guardar/leer coherente con /predict.
    const resolvedSeason = season === 'current' ? (await ergast.raceInfo('current', round))?.season ?? season : season;

    const pending = getPredictionsForRound(resolvedSeason, round, { onlyUnscored: true });

    if (!pending.length) {
      await interaction.editReply(`No hay predicciones pendientes de puntuar para la ronda ${round}.`);
      return;
    }

    const results = pending.map((prediction) => {
      const { total, breakdown, counts } = scorePrediction(prediction, actual);
      markScored(prediction.id, total, counts);
      credit(prediction.user_id, total);

      let achievement = null;
      if (breakdown.exact === 100) {
        // Top 10 perfecto (los 10 en su posición exacta) -> premio especial
        achievement = awardRandomLegendary(prediction.user_id);
      }

      return { userId: prediction.user_id, total, breakdown, achievement };
    });

    results.sort((a, b) => b.total - a.total);

    const lines = results
      .slice(0, 20)
      .map((r) => `<@${r.userId}> — **${r.total}** pts${r.achievement ? ` · 🏆 ¡Top 10 perfecto! Carta legendaria: **${r.achievement.name}**` : ''}`)
      .join('\n');

    const safetyCarNote =
      actual.safetyCar === null
        ? '\n\n⚠️ No pude determinar si hubo Safety Car (sin datos de OpenF1 para esta sesión), esa parte no se puntuó para nadie.'
        : '';

    const embed = new EmbedBuilder()
      .setTitle(`🏁 Puntuación: ${actual.raceName}`)
      .setColor(0xe10600)
      .setDescription(
        `Resultado real → Pole: **${actual.pole ?? '?'}** · Vuelta rápida: **${actual.fastestLap ?? '?'}** · Safety Car: **${
          actual.safetyCar === null ? '?' : actual.safetyCar ? 'Sí' : 'No'
        }**\n\n${lines}${safetyCarNote}`
      )
      .setFooter({ text: `${results.length} predicción(es) puntuada(s)` });

    await interaction.editReply({ embeds: [embed] });
  }
};
