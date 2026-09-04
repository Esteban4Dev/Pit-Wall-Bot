const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance } = require('../db/wallet');

module.exports = {
  data: new SlashCommandBuilder().setName('balance').setDescription('Ve tu saldo de puntos gastables (para /packs)'),

  async execute(interaction) {
    const balance = getBalance(interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle('💰 Tu saldo')
      .setColor(0xe10600)
      .setDescription(
        `Tienes **${balance}** pts disponibles para gastar en \`/packs\`.\n\n` +
          '_Ganas puntos acertando predicciones (`/predict` + puntuación de un admin) y respondiendo trivia (`/trivia`)._\n\n' +
          '⚠️ Es distinto del ranking de `/leaderboard` para predicciones — usa `/leaderboard tipo:Saldo` para ver el ranking de esto mismo, comparado con todos.'
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
