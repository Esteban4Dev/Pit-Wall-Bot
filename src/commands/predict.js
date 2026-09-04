const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { ergast } = require('../utils/api');
const { getPrediction } = require('../db/predictions');

const CLOSE_BEFORE_MS = 60 * 60 * 1000; // 1 hora antes de la carrera

module.exports = {
  data: new SlashCommandBuilder()
    .setName('predict')
    .setDescription('Envía o edita tu predicción para la próxima carrera'),

  async execute(interaction) {
    const race = await ergast.nextRace();

    if (!race) {
      await interaction.reply({ content: 'No hay ninguna carrera próxima en el calendario. 🏁', ephemeral: true });
      return;
    }

    const raceDateTime = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
    const deadline = new Date(raceDateTime.getTime() - CLOSE_BEFORE_MS);

    if (Date.now() > deadline.getTime()) {
      await interaction.reply({
        content: `🔒 Las predicciones para **${race.raceName}** ya están cerradas (se cierran 1 hora antes de la carrera).`,
        ephemeral: true
      });
      return;
    }

    const existing = getPrediction(interaction.user.id, race.season, Number(race.round));

    const modal = new ModalBuilder()
      // Codificamos season y round en el customId para no depender de estado en memoria
      .setCustomId(`predict_modal:${race.season}:${race.round}`)
      .setTitle(`Predicción: ${race.raceName}`.slice(0, 45));

    const top10Input = new TextInputBuilder()
      .setCustomId('top10')
      .setLabel('Top 10 (P1→P10), separados por coma')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('VER,NOR,LEC,PIA,RUS,HAM,ALO,SAI,GAS,ANT')
      .setRequired(true)
      .setValue(existing ? existing.top10.join(',') : '');

    const poleInput = new TextInputBuilder()
      .setCustomId('pole')
      .setLabel('Pole position (código de 3 letras)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('VER')
      .setRequired(false)
      .setValue(existing?.pole ?? '');

    const fastestLapInput = new TextInputBuilder()
      .setCustomId('fastestlap')
      .setLabel('Vuelta rápida (código de 3 letras)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('NOR')
      .setRequired(false)
      .setValue(existing?.fastest_lap ?? '');

    const safetyCarInput = new TextInputBuilder()
      .setCustomId('safetycar')
      .setLabel('¿Habrá Safety Car? (si/no)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('si')
      .setRequired(false)
      .setValue(existing?.safetyCarBool === null || existing?.safetyCarBool === undefined
        ? ''
        : existing.safetyCarBool
        ? 'si'
        : 'no');

    modal.addComponents(
      new ActionRowBuilder().addComponents(top10Input),
      new ActionRowBuilder().addComponents(poleInput),
      new ActionRowBuilder().addComponents(fastestLapInput),
      new ActionRowBuilder().addComponents(safetyCarInput)
    );

    await interaction.showModal(modal);
  }
};
