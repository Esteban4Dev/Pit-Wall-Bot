const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { drawRandomCard, addCardToUser } = require('../db/cards');
const { getBalance, debit } = require('../db/wallet');
const { RARITY_META, PACK_WEIGHTS } = require('../config/rarity');

const PACK_COST = 30; // puntos de predicción
const PACK_SIZE = 3;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('packs')
    .setDescription(`Compra un sobre de ${PACK_SIZE} cartas por ${PACK_COST} puntos de predicción`),

  async execute(interaction) {
    const userId = interaction.user.id;
    const balance = getBalance(userId);

    if (balance < PACK_COST) {
      await interaction.reply({
        content: `💸 Necesitas ${PACK_COST} pts para un sobre y tienes **${balance}**. Gana puntos acertando predicciones con \`/predict\`.`,
        ephemeral: true
      });
      return;
    }

    try {
      debit(userId, PACK_COST);
    } catch (err) {
      await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
      return;
    }

    const pulled = [];
    for (let i = 0; i < PACK_SIZE; i++) {
      const card = drawRandomCard(PACK_WEIGHTS);
      if (!card) break;
      addCardToUser(userId, card.id, 1);
      pulled.push(card);
    }

    const lines = pulled.map((c) => {
      const meta = RARITY_META[c.rarity];
      return `${meta.emoji} **${c.name}** — ${meta.label}`;
    });

    const embed = new EmbedBuilder()
      .setTitle('📦 ¡Sobre abierto!')
      .setColor(0xe10600)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `-${PACK_COST} pts · Saldo restante: ${getBalance(userId)} pts` });

    await interaction.reply({ embeds: [embed] });
  }
};
