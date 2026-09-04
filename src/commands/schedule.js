const { SlashCommandBuilder } = require('discord.js');
const { ergast } = require('../utils/api');
const { baseEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Calendario completo de la temporada actual'),

  async execute(interaction) {
    await interaction.deferReply();

    const races = await ergast.currentSeasonSchedule();

    if (!races.length) {
      await interaction.editReply('No pude cargar el calendario de la temporada.');
      return;
    }

    const now = new Date();

    const lines = races.map((r) => {
      const raceDate = new Date(`${r.date}T${r.time || '00:00:00Z'}`);
      const isPast = raceDate < now;
      const marker = isPast ? '✅' : '🔜';
      return `${marker} **R${r.round}** ${r.raceName} — <t:${Math.floor(raceDate.getTime() / 1000)}:D>`;
    });

    // Discord limita los embeds a 4096 caracteres en description; dividimos si hace falta.
    const chunks = [];
    let current = '';
    for (const line of lines) {
      if ((current + '\n' + line).length > 3800) {
        chunks.push(current);
        current = line;
      } else {
        current = current ? `${current}\n${line}` : line;
      }
    }
    if (current) chunks.push(current);

    const embeds = chunks.map((desc, i) =>
      baseEmbed({
        title: i === 0 ? `📅 Calendario ${races[0].season}` : '📅 Calendario (continuación)',
        description: desc
      })
    );

    await interaction.editReply({ embeds });
  }
};
