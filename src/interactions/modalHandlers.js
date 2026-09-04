const { EmbedBuilder } = require('discord.js');
const { ergast } = require('../utils/api');
const { parseTop10, parseDriverCode, parseSafetyCar } = require('../utils/validation');
const { upsertPrediction } = require('../db/predictions');

const CLOSE_BEFORE_MS = 60 * 60 * 1000;

async function handlePredictModal(interaction) {
  const [, season, roundStr] = interaction.customId.split(':');
  const round = Number(roundStr);

  // Re-validamos el deadline por si pasó tiempo entre abrir el modal y enviarlo.
  const race = await ergast.raceInfo(season, round);
  if (!race) {
    await interaction.reply({ content: '⚠️ No pude encontrar esa carrera, intenta con /predict de nuevo.', ephemeral: true });
    return;
  }

  const raceDateTime = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
  const deadline = new Date(raceDateTime.getTime() - CLOSE_BEFORE_MS);

  if (Date.now() > deadline.getTime()) {
    await interaction.reply({
      content: `🔒 Las predicciones para **${race.raceName}** se cerraron mientras completabas el formulario.`,
      ephemeral: true
    });
    return;
  }

  let top10, pole, fastestLap, safetyCar;
  try {
    top10 = parseTop10(interaction.fields.getTextInputValue('top10'));
    pole = parseDriverCode(interaction.fields.getTextInputValue('pole'));
    fastestLap = parseDriverCode(interaction.fields.getTextInputValue('fastestlap'));
    safetyCar = parseSafetyCar(interaction.fields.getTextInputValue('safetycar'));
  } catch (err) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
    return;
  }

  const prediction = upsertPrediction({
    userId: interaction.user.id,
    season,
    round,
    raceName: race.raceName,
    top10,
    pole,
    fastestLap,
    safetyCar
  });

  const embed = new EmbedBuilder()
    .setTitle(`✅ Predicción guardada: ${race.raceName}`)
    .setColor(0x2ecc71)
    .setDescription(
      `**Top 10:**\n${top10.map((c, i) => `P${i + 1}. ${c}`).join('  ·  ')}\n\n` +
        `**Pole:** ${pole ?? '_sin predecir_'}\n` +
        `**Vuelta rápida:** ${fastestLap ?? '_sin predecir_'}\n` +
        `**Safety Car:** ${safetyCar === null ? '_sin predecir_' : safetyCar ? 'Sí' : 'No'}`
    )
    .setFooter({ text: 'Puedes volver a usar /predict para editarla hasta que cierre.' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = { handlePredictModal };
