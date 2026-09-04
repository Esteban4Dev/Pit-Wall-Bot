const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeagueByCode, joinLeague, getMemberCount } = require('../db/leagues');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joinleague')
    .setDescription('Únete a una liga privada con su código')
    .addStringOption((option) => option.setName('codigo').setDescription('Código de la liga').setRequired(true)),

  async execute(interaction) {
    const code = interaction.options.getString('codigo').trim();
    const league = getLeagueByCode(code);

    if (!league) {
      await interaction.reply({ content: `No encontré ninguna liga con el código \`${code}\`.`, ephemeral: true });
      return;
    }

    joinLeague(league.id, interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle(`✅ Te uniste a: ${league.name}`)
      .setColor(0x2ecc71)
      .setDescription(`Ahora son **${getMemberCount(league.id)}** en esta liga. Usa \`/league standings codigo:${league.code}\` para ver la tabla.`);

    await interaction.reply({ embeds: [embed] });
  }
};
