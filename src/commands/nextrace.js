const { SlashCommandBuilder } = require('discord.js');
const { ergast } = require('../utils/api');
const { baseEmbed, formatCountdown } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nextrace')
    .setDescription('Muestra la próxima carrera y su cuenta regresiva'),

  async execute(interaction) {
    await interaction.deferReply();

    const race = await ergast.nextRace();

    if (!race) {
      await interaction.editReply('No encontré ninguna carrera próxima en el calendario actual. 🏁');
      return;
    }

    const raceDateTime = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
    const countdown = formatCountdown(raceDateTime);

    const sessions = [
      ['Práctica Libre 1', race.FirstPractice],
      ['Práctica Libre 2', race.SecondPractice],
      ['Práctica Libre 3', race.ThirdPractice],
      ['Clasificación', race.Qualifying],
      ['Sprint', race.Sprint]
    ].filter(([, session]) => session);

    let sessionsText = sessions
      .map(([label, session]) => {
        const dt = new Date(`${session.date}T${session.time}`);
        return `**${label}:** <t:${Math.floor(dt.getTime() / 1000)}:f>`;
      })
      .join('\n');

    if (!sessionsText) sessionsText = '_Horarios de sesiones no disponibles todavía._';

    const embed = baseEmbed({
      title: `🏁 Próxima carrera: ${race.raceName}`,
      description: `**${race.Circuit.circuitName}** — ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}\n\n⏳ **Cuenta regresiva a la carrera:** ${countdown}\n🕒 **Hora de carrera:** <t:${Math.floor(raceDateTime.getTime() / 1000)}:F>\n\n${sessionsText}`
    });

    await interaction.editReply({ embeds: [embed] });
  }
};
