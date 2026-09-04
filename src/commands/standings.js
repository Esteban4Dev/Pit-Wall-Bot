const { SlashCommandBuilder } = require('discord.js');
const { ergast } = require('../utils/api');
const { baseEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('standings')
    .setDescription('Clasificación actual de pilotos o constructores')
    .addStringOption((option) =>
      option
        .setName('tipo')
        .setDescription('Qué clasificación quieres ver')
        .setRequired(false)
        .addChoices(
          { name: 'Pilotos', value: 'drivers' },
          { name: 'Constructores', value: 'constructors' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const type = interaction.options.getString('tipo') ?? 'drivers';

    if (type === 'constructors') {
      const standings = await ergast.constructorStandings();

      if (!standings.length) {
        await interaction.editReply('No hay datos de clasificación de constructores disponibles todavía.');
        return;
      }

      const lines = standings
        .slice(0, 10)
        .map(
          (s) =>
            `**${s.position}.** ${s.Constructor.name} — ${s.points} pts (${s.wins} victorias)`
        )
        .join('\n');

      const embed = baseEmbed({
        title: '🏆 Clasificación de Constructores',
        description: lines
      });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const standings = await ergast.driverStandings();

    if (!standings.length) {
      await interaction.editReply('No hay datos de clasificación de pilotos disponibles todavía.');
      return;
    }

    const lines = standings
      .slice(0, 10)
      .map((s) => {
        const team = s.Constructors?.[0]?.name ?? 'N/A';
        return `**${s.position}.** ${s.Driver.givenName} ${s.Driver.familyName} (${team}) — ${s.points} pts`;
      })
      .join('\n');

    const embed = baseEmbed({
      title: '🏆 Clasificación de Pilotos',
      description: lines
    });

    await interaction.editReply({ embeds: [embed] });
  }
};
