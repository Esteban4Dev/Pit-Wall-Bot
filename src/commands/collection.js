const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserCollection, cardCount } = require('../db/cards');
const { RARITY_META, RARITY_ORDER } = require('../config/rarity');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collection')
    .setDescription('Muestra tu colección de cartas (o la de otro usuario)')
    .addUserOption((option) => option.setName('usuario').setDescription('Ver la colección de otra persona').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') ?? interaction.user;
    const collection = getUserCollection(target.id);
    const totalCatalog = cardCount();

    if (!collection.length) {
      const msg =
        target.id === interaction.user.id
          ? 'Todavía no tienes ninguna carta. Usa `/daily` para conseguir la primera. 🃏'
          : `${target.username} todavía no tiene cartas.`;
      await interaction.reply({ content: msg, ephemeral: target.id === interaction.user.id });
      return;
    }

    const byRarity = { common: [], special: [], epic: [], legendary: [] };
    let totalCopies = 0;
    for (const card of collection) {
      byRarity[card.rarity]?.push(card);
      totalCopies += card.quantity;
    }

    const sections = RARITY_ORDER.filter((r) => byRarity[r].length).map((r) => {
      const meta = RARITY_META[r];
      const lines = byRarity[r]
        .map((c) => `${meta.emoji} \`#${c.id}\` ${c.name}${c.quantity > 1 ? ` \u00d7${c.quantity}` : ''}`)
        .join('\n');
      return `**${meta.label} (${byRarity[r].length})**\n${lines}`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`🃏 Colección de ${target.username}`)
      .setColor(0xe10600)
      .setDescription(sections.join('\n\n'))
      .setFooter({
        text: `${collection.length}/${totalCatalog} cartas distintas · ${totalCopies} copias en total · el número entre # es el ID para /trade`
      });

    await interaction.reply({ embeds: [embed] });
  }
};
