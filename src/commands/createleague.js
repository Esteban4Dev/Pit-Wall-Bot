const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createLeague } = require('../db/leagues');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createleague')
    .setDescription('Crea una liga privada de predicciones')
    .addStringOption((option) => option.setName('nombre').setDescription('Nombre de la liga').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('puntos_exacta').setDescription('Puntos por posición exacta (default: 10)').setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName('puntos_offbyone').setDescription('Puntos por posición desviada 1 lugar (default: 5)').setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName('puntos_pole').setDescription('Puntos por pole acertada (default: 5)').setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName('puntos_vuelta_rapida').setDescription('Puntos por vuelta rápida acertada (default: 3)').setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName('puntos_safety_car').setDescription('Puntos por Safety Car acertado (default: 2)').setRequired(false)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('nombre').slice(0, 60);

    const weights = {
      exactPosition: interaction.options.getInteger('puntos_exacta') ?? 10,
      offByOne: interaction.options.getInteger('puntos_offbyone') ?? 5,
      pole: interaction.options.getInteger('puntos_pole') ?? 5,
      fastestLap: interaction.options.getInteger('puntos_vuelta_rapida') ?? 3,
      safetyCar: interaction.options.getInteger('puntos_safety_car') ?? 2
    };

    const league = createLeague({ name, ownerId: interaction.user.id, weights });

    const embed = new EmbedBuilder()
      .setTitle(`👑 Liga creada: ${league.name}`)
      .setColor(0xffd700)
      .setDescription(
        `Comparte este código para que se unan con \`/joinleague\`:\n\n` +
          `## \`${league.code}\`\n\n` +
          `**Sistema de puntos de esta liga:**\n` +
          `Posición exacta: ${weights.exactPosition} · Off-by-one: ${weights.offByOne} · Pole: ${weights.pole} · Vuelta rápida: ${weights.fastestLap} · Safety Car: ${weights.safetyCar}`
      )
      .setFooter({ text: 'Ya quedaste dentro como dueño de la liga.' });

    await interaction.reply({ embeds: [embed] });
  }
};
