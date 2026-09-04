const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const predictionsRepo = require('../db/predictions');
const walletRepo = require('../db/wallet');
const triviaLeagueRepo = require('../db/triviaLeague');

const MEDALS = ['🥇', '🥈', '🥉'];

async function resolveScopeUserIds(interaction, scope) {
  if (scope !== 'server') return { userIds: null, warning: null };

  if (!interaction.guild) {
    return { error: 'Este alcance solo funciona dentro de un servidor. Prueba con `alcance: Global`.' };
  }

  try {
    const members = await interaction.guild.members.fetch();
    return { userIds: [...members.keys()], warning: null };
  } catch (err) {
    console.warn('⚠️  No se pudo obtener la lista de miembros (¿falta el intent GuildMembers?):', err.message);
    return {
      userIds: null,
      warning:
        '⚠️ No pude leer la lista de miembros del servidor (falta habilitar el "Server Members Intent" en el Developer Portal). Muestro el ranking global en su lugar.\n\n'
    };
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Ranking de predicciones o de saldo')
    .addStringOption((option) =>
      option
        .setName('tipo')
        .setDescription('Qué ranking ver')
        .setRequired(false)
        .addChoices(
          { name: 'Predicciones (default)', value: 'predictions' },
          { name: 'Saldo de puntos', value: 'balance' },
          { name: 'Trivia (mes actual)', value: 'trivia' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('alcance')
        .setDescription('Ranking global o solo de este servidor')
        .setRequired(false)
        .addChoices({ name: 'Este servidor', value: 'server' }, { name: 'Global', value: 'global' })
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const type = interaction.options.getString('tipo') ?? 'predictions';
    const scope = interaction.options.getString('alcance') ?? (interaction.guild ? 'server' : 'global');

    const { userIds, warning, error } = await resolveScopeUserIds(interaction, scope);
    if (error) {
      await interaction.editReply(error);
      return;
    }

    if (type === 'trivia') {
      const period = triviaLeagueRepo.currentPeriod();
      const allRows = triviaLeagueRepo.getTriviaLeaderboard(period, 100);
      const rows = userIds ? allRows.filter((r) => userIds.includes(r.user_id)).slice(0, 10) : allRows.slice(0, 10);

      if (!rows.length) {
        await interaction.editReply((warning ?? '') + `Todavía nadie respondió trivia este mes (${period}). ¡Usa \`/trivia\`!`);
        return;
      }

      const lines = await Promise.all(
        rows.map(async (row, i) => {
          const medal = MEDALS[i] ?? `**${i + 1}.**`;
          const user = await interaction.client.users.fetch(row.user_id).catch(() => null);
          const name = user ? user.username : `Usuario ${row.user_id}`;
          return `${medal} ${name} — **${row.points}** pts`;
        })
      );

      const embed = new EmbedBuilder()
        .setTitle(`🧠 Liga de Trivia — ${period}`)
        .setColor(0x9b59b6)
        .setDescription((warning ?? '') + lines.join('\n'))
        .setFooter({ text: 'El líder de fin de mes elige cualquier carta con /choosecard' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (type === 'balance') {
      const rows = walletRepo.getLeaderboard({ userIds, limit: 10 });

      if (!rows.length) {
        await interaction.editReply((warning ?? '') + 'Todavía nadie tiene saldo acumulado. Gana puntos con `/predict` o `/trivia`.');
        return;
      }

      const lines = await Promise.all(
        rows.map(async (row, i) => {
          const medal = MEDALS[i] ?? `**${i + 1}.**`;
          const user = await interaction.client.users.fetch(row.user_id).catch(() => null);
          const name = user ? user.username : `Usuario ${row.user_id}`;
          return `${medal} ${name} — **${row.balance}** pts`;
        })
      );

      const embed = new EmbedBuilder()
        .setTitle(scope === 'server' ? `💰 Saldo — ${interaction.guild.name}` : '💰 Saldo Global')
        .setColor(0x2ecc71)
        .setDescription((warning ?? '') + lines.join('\n'))
        .setFooter({ text: 'Saldo gastable en /packs · distinto del ranking de predicciones' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const rows = predictionsRepo.getLeaderboard({ userIds, limit: 10 });

    if (!rows.length) {
      await interaction.editReply(
        (warning ?? '') + 'Todavía no hay predicciones puntuadas. ¡Usa `/predict` antes de que cierre la próxima carrera!'
      );
      return;
    }

    const lines = await Promise.all(
      rows.map(async (row, i) => {
        const medal = MEDALS[i] ?? `**${i + 1}.**`;
        const user = await interaction.client.users.fetch(row.user_id).catch(() => null);
        const name = user ? user.username : `Usuario ${row.user_id}`;
        return `${medal} ${name} — **${row.total_points}** pts (${row.races_scored} carreras)`;
      })
    );

    const embed = new EmbedBuilder()
      .setTitle(scope === 'server' ? `🏆 Ranking — ${interaction.guild.name}` : '🏆 Ranking Global')
      .setColor(0xffd700)
      .setDescription((warning ?? '') + lines.join('\n'))
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
