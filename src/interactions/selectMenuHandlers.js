const { CATEGORIES } = require('../utils/helpContent');
const helpCommand = require('../commands/help');

async function handleHelpSelect(interaction) {
  const category = interaction.values[0];
  const entry = CATEGORIES[category];

  if (!entry) {
    await interaction.reply({ content: 'Categoría no encontrada.', ephemeral: true });
    return;
  }

  const embed = entry.build();
  const row = helpCommand.buildSelectRow(category);

  await interaction.update({ embeds: [embed], components: [row] });
}

module.exports = { handleHelpSelect };
