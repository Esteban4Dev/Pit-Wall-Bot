const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { CATEGORIES } = require('../utils/helpContent');

function buildSelectRow(selected = 'overview') {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help_select')
    .setPlaceholder('Elige una categoría...')
    .addOptions(
      Object.entries(CATEGORIES).map(([value, cat]) => ({
        label: cat.label,
        value,
        default: value === selected
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
}

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Muestra todos los comandos del bot, por categoría'),

  async execute(interaction) {
    const embed = CATEGORIES.overview.build();
    const row = buildSelectRow('overview');

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  buildSelectRow // exportado para reutilizar en el handler del menú
};
