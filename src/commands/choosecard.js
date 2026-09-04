const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCardById, addCardToUser } = require('../db/cards');
const { getUnclaimedChampionship, claimChampionCard } = require('../db/triviaLeague');
const { RARITY_META } = require('../config/rarity');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('choosecard')
    .setDescription('Si eres el campeón del mes de trivia, elige cualquier carta del catálogo (ver /collection para IDs)')
    .addIntegerOption((option) => option.setName('carta_id').setDescription('ID de la carta que quieres').setRequired(true)),

  async execute(interaction) {
    const championship = getUnclaimedChampionship(interaction.user.id);

    if (!championship) {
      await interaction.reply({
        content: 'No tienes ningún título de campeón de trivia sin reclamar. Este premio lo otorga un admin al líder del mes con `/admin crowntrivia`.',
        ephemeral: true
      });
      return;
    }

    const cardId = interaction.options.getInteger('carta_id');
    const card = getCardById(cardId);

    if (!card) {
      await interaction.reply({ content: `No encontré ninguna carta con el ID \`${cardId}\`.`, ephemeral: true });
      return;
    }

    addCardToUser(interaction.user.id, cardId, 1);
    claimChampionCard(championship.id, cardId);

    const meta = RARITY_META[card.rarity];

    const embed = new EmbedBuilder()
      .setTitle('🧠 ¡Premio de campeón reclamado!')
      .setColor(meta.color)
      .setDescription(
        `Como campeón de la Liga de Trivia de **${championship.period}** (${championship.points} pts), elegiste:\n\n` +
          `${meta.emoji} **${card.name}** — ${meta.label}`
      );

    await interaction.reply({ embeds: [embed] });
  }
};
