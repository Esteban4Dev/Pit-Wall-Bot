const { SlashCommandBuilder } = require('discord.js');
const { ergast } = require('../utils/api');
const { baseEmbed, getTeamColor } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('results')
    .setDescription('Resultados de una carrera')
    .addIntegerOption((option) =>
      option
        .setName('ronda')
        .setDescription('Número de ronda de la temporada actual (déjalo vacío para la última carrera)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(30)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const round = interaction.options.getInteger('ronda');
    const race = await ergast.raceResults('current', round ?? 'last');

    if (!race || !race.Results?.length) {
      await interaction.editReply('No encontré resultados para esa carrera. ¿Seguro que ya se corrió?');
      return;
    }

    const winnerConstructorId = race.Results[0]?.Constructor?.constructorId;

    const lines = race.Results.slice(0, 10)
      .map((r) => {
        const time = r.Time?.time ?? (r.status === 'Finished' ? '' : r.status);
        return `**P${r.position}** ${r.Driver.givenName[0]}. ${r.Driver.familyName} — ${r.Constructor.name} ${time ? `(${time})` : ''}`.trim();
      })
      .join('\n');

    const embed = baseEmbed({
      title: `🏁 Resultados: ${race.raceName} ${race.season}`,
      description: `${race.Circuit.circuitName}, ${race.Circuit.Location.country}\n\n${lines}`,
      color: getTeamColor(winnerConstructorId)
    });

    await interaction.editReply({ embeds: [embed] });
  }
};
