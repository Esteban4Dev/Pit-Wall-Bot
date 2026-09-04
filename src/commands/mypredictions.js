const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ergast } = require('../utils/api');
const { getPrediction } = require('../db/predictions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mypredictions')
    .setDescription('Muestra tu predicción para la próxima carrera'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const race = await ergast.nextRace();
    if (!race) {
      await interaction.editReply('No hay ninguna carrera próxima en el calendario. 🏁');
      return;
    }

    const prediction = getPrediction(interaction.user.id, race.season, Number(race.round));

    if (!prediction) {
      await interaction.editReply(
        `Todavía no tienes una predicción para **${race.raceName}**. Usa \`/predict\` para enviarla.`
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 Tu predicción: ${race.raceName}`)
      .setColor(0x1e90ff)
      .setDescription(
        `**Top 10:**\n${prediction.top10.map((c, i) => `P${i + 1}. ${c}`).join('  ·  ')}\n\n` +
          `**Pole:** ${prediction.pole ?? '_sin predecir_'}\n` +
          `**Vuelta rápida:** ${prediction.fastest_lap ?? '_sin predecir_'}\n` +
          `**Safety Car:** ${
            prediction.safetyCarBool === null ? '_sin predecir_' : prediction.safetyCarBool ? 'Sí' : 'No'
          }\n\n` +
          (prediction.scored
            ? `🏁 **Puntos obtenidos:** ${prediction.points}`
            : '_Aún no se ha corrido / puntuado esta carrera._')
      )
      .setFooter({ text: 'Usa /predict de nuevo para editarla mientras esté abierta.' });

    await interaction.editReply({ embeds: [embed] });
  }
};
