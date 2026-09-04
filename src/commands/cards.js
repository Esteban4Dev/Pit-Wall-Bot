const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllCards } = require('../db/cards');
const { RARITY_META, RARITY_ORDER } = require('../config/rarity');

module.exports = {
  data: new SlashCommandBuilder().setName('cards').setDescription('Catálogo completo de cartas con sus IDs'),

  async execute(interaction) {
    const cards = getAllCards();

    if (!cards.length) {
      await interaction.reply({ content: 'El catálogo todavía no está listo, intenta en unos minutos.', ephemeral: true });
      return;
    }

    const byRarity = { common: [], special: [], epic: [], legendary: [] };
    for (const card of cards) byRarity[card.rarity]?.push(card);

    const sections = RARITY_ORDER.filter((r) => byRarity[r].length).map((r) => {
      const meta = RARITY_META[r];
      const lines = byRarity[r].map((c) => `\`#${c.id}\` ${c.name}`).join('\n');
      return `**${meta.label} (${byRarity[r].length})**\n${lines}`;
    });

    // Por si el catálogo crece mucho con las temporadas, partimos en varios
    // embeds respetando el límite de 4096 caracteres por descripción.
    const chunks = [];
    let current = '';
    for (const section of sections) {
      if ((current + '\n\n' + section).length > 3800) {
        chunks.push(current);
        current = section;
      } else {
        current = current ? `${current}\n\n${section}` : section;
      }
    }
    if (current) chunks.push(current);

    const embeds = chunks.map((desc, i) =>
      new EmbedBuilder()
        .setTitle(i === 0 ? `🃏 Catálogo de cartas (${cards.length})` : '🃏 Catálogo (continuación)')
        .setColor(0xe10600)
        .setDescription(desc)
        .setFooter({ text: 'Usa el # como ID en /trade o /choosecard' })
    );

    await interaction.reply({ embeds });
  }
};
