const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCardById, getUserCardQuantity } = require('../db/cards');
const { createTrade } = require('../db/trades');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Propón un intercambio de cartas con otro usuario')
    .addUserOption((option) => option.setName('usuario').setDescription('Con quién quieres intercambiar').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('mi_carta').setDescription('ID de tu carta que ofreces (ver /collection)').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('su_carta').setDescription('ID de la carta que pides (ver /collection de esa persona)').setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const offerCardId = interaction.options.getInteger('mi_carta');
    const requestCardId = interaction.options.getInteger('su_carta');

    if (target.id === interaction.user.id) {
      await interaction.reply({ content: 'No puedes intercambiar contigo mismo. 😅', ephemeral: true });
      return;
    }

    if (target.bot) {
      await interaction.reply({ content: 'No puedes intercambiar con un bot.', ephemeral: true });
      return;
    }

    const offerCard = getCardById(offerCardId);
    const requestCard = getCardById(requestCardId);

    if (!offerCard || !requestCard) {
      await interaction.reply({ content: 'Uno de los IDs de carta no existe. Revisa con `/collection`.', ephemeral: true });
      return;
    }

    if (getUserCardQuantity(interaction.user.id, offerCardId) < 1) {
      await interaction.reply({ content: `No tienes **${offerCard.name}** para ofrecer.`, ephemeral: true });
      return;
    }

    if (getUserCardQuantity(target.id, requestCardId) < 1) {
      await interaction.reply({ content: `${target.username} no tiene **${requestCard.name}**.`, ephemeral: true });
      return;
    }

    const trade = createTrade({
      fromUser: interaction.user.id,
      toUser: target.id,
      offerCardId,
      requestCardId
    });

    const embed = new EmbedBuilder()
      .setTitle('🔄 Propuesta de intercambio')
      .setColor(0xf39c12)
      .setDescription(
        `${interaction.user} ofrece **${offerCard.name}**\na cambio de **${requestCard.name}** de ${target}.`
      )
      .setFooter({ text: `Trade #${trade.id} · ${target.username}, decide abajo` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`trade_accept:${trade.id}`).setLabel('Aceptar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`trade_decline:${trade.id}`).setLabel('Rechazar').setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ content: `${target}`, embeds: [embed], components: [row] });
  }
};
