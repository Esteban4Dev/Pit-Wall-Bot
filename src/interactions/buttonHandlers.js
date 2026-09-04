const { EmbedBuilder } = require('discord.js');
const { getCardById, transferCard } = require('../db/cards');
const { getTrade, updateTradeStatus } = require('../db/trades');

async function handleTradeButton(interaction) {
  const [action, idStr] = interaction.customId.split(':');
  const tradeId = Number(idStr);
  const trade = getTrade(tradeId);

  if (!trade) {
    await interaction.reply({ content: 'No encontré ese intercambio.', ephemeral: true });
    return;
  }

  if (trade.status !== 'pending') {
    await interaction.reply({ content: 'Este intercambio ya no está disponible.', ephemeral: true });
    return;
  }

  if (interaction.user.id !== trade.to_user) {
    await interaction.reply({ content: 'Solo la persona invitada puede responder este intercambio.', ephemeral: true });
    return;
  }

  const offerCard = getCardById(trade.offer_card_id);
  const requestCard = getCardById(trade.request_card_id);

  if (action === 'trade_decline') {
    updateTradeStatus(tradeId, 'declined');
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x95a5a6)
      .setFooter({ text: `Trade #${tradeId} · Rechazado` });
    await interaction.update({ embeds: [embed], components: [] });
    return;
  }

  // action === 'trade_accept'
  try {
    transferCard(trade.from_user, trade.to_user, trade.offer_card_id, 1);
    transferCard(trade.to_user, trade.from_user, trade.request_card_id, 1);
    updateTradeStatus(tradeId, 'accepted');

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x2ecc71)
      .setDescription(
        `✅ Intercambio completado: <@${trade.from_user}> recibió **${requestCard.name}** y <@${trade.to_user}> recibió **${offerCard.name}**.`
      )
      .setFooter({ text: `Trade #${tradeId} · Completado` });

    await interaction.update({ embeds: [embed], components: [] });
  } catch (err) {
    updateTradeStatus(tradeId, 'failed');
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0xe74c3c)
      .setFooter({ text: `Trade #${tradeId} · Falló: ${err.message}` });
    await interaction.update({ embeds: [embed], components: [] });
  }
}

module.exports = { handleTradeButton };
