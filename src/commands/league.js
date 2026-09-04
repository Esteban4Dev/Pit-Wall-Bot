const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { ergast } = require('../utils/api');
const { applyWeights } = require('../utils/scoring');
const { renderLeagueStandingsImage } = require('../utils/leagueImage');
const {
  getLeagueByCode,
  getLeaguesForUser,
  getMemberCount,
  leagueWeights,
  getLeagueRawScores,
  crownChampion,
  getHallOfFame
} = require('../db/leagues');

/**
 * Resuelve a qué liga se refiere el usuario: por código explícito, o —si no
 * dio código— viendo en cuántas ligas está. Devuelve { league } o { error }.
 */
function resolveLeague(interaction) {
  const code = interaction.options.getString('codigo');

  if (code) {
    const league = getLeagueByCode(code);
    if (!league) return { error: `No encontré ninguna liga con el código \`${code}\`.` };
    return { league };
  }

  const leagues = getLeaguesForUser(interaction.user.id);
  if (leagues.length === 0) {
    return { error: 'No estás en ninguna liga todavía. Usa `/createleague` o `/joinleague`.' };
  }
  if (leagues.length > 1) {
    const list = leagues.map((l) => `\`${l.code}\` — ${l.name}`).join('\n');
    return { error: `Estás en varias ligas, especifica cuál con \`codigo\`:\n${list}` };
  }
  return { league: leagues[0] };
}

function computeStandings(league) {
  const weights = leagueWeights(league);
  const raw = getLeagueRawScores(league.id);

  return raw
    .map((row) => ({
      userId: row.user_id,
      points: applyWeights(row, weights),
      racesScored: row.races_scored
    }))
    .sort((a, b) => b.points - a.points);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('league')
    .setDescription('Comandos de tu liga privada')
    .addSubcommand((sub) =>
      sub
        .setName('standings')
        .setDescription('Clasificación de la liga (con imagen)')
        .addStringOption((option) => option.setName('codigo').setDescription('Código de la liga (opcional si estás en una sola)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('halloffame')
        .setDescription('Campeones históricos de la liga')
        .addStringOption((option) => option.setName('codigo').setDescription('Código de la liga (opcional si estás en una sola)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('crownchampion')
        .setDescription('Corona al líder actual como campeón de la temporada (solo el dueño de la liga)')
        .addStringOption((option) => option.setName('codigo').setDescription('Código de la liga (opcional si estás en una sola)').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const { league, error } = resolveLeague(interaction);

    if (error) {
      await interaction.reply({ content: error, ephemeral: true });
      return;
    }

    if (sub === 'standings') {
      await interaction.deferReply();

      const standings = computeStandings(league);

      const rows = await Promise.all(
        standings.slice(0, 15).map(async (row, i) => {
          const user = await interaction.client.users.fetch(row.userId).catch(() => null);
          return { rank: i + 1, name: user ? user.username : `Usuario ${row.userId}`, points: row.points };
        })
      );

      const imageBuffer = renderLeagueStandingsImage({
        title: `${league.name} (${getMemberCount(league.id)} miembros)`,
        rows
      });

      const attachment = new AttachmentBuilder(imageBuffer, { name: 'standings.png' });

      await interaction.editReply({
        content: standings.length ? null : 'Todavía no hay predicciones puntuadas en esta liga.',
        files: [attachment]
      });
      return;
    }

    if (sub === 'halloffame') {
      await interaction.deferReply();

      const champions = getHallOfFame(league.id);

      if (!champions.length) {
        await interaction.editReply(`**${league.name}** todavía no tiene campeones coronados. Usa \`/league crownchampion\` al cierre de temporada.`);
        return;
      }

      const lines = await Promise.all(
        champions.map(async (c) => {
          const user = await interaction.client.users.fetch(c.user_id).catch(() => null);
          const name = user ? user.username : `Usuario ${c.user_id}`;
          return `🏆 **${c.season}** — ${name} (${c.points} pts)`;
        })
      );

      const embed = new EmbedBuilder()
        .setTitle(`👑 Hall of Fame — ${league.name}`)
        .setColor(0xffd700)
        .setDescription(lines.join('\n'));

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'crownchampion') {
      if (interaction.user.id !== league.owner_id) {
        await interaction.reply({ content: 'Solo el dueño de la liga puede coronar campeón.', ephemeral: true });
        return;
      }

      await interaction.deferReply();

      const standings = computeStandings(league);
      if (!standings.length) {
        await interaction.editReply('No hay puntajes registrados todavía, no hay a quién coronar.');
        return;
      }

      const schedule = await ergast.currentSeasonSchedule();
      const season = schedule[0]?.season ?? String(new Date().getFullYear());

      const winner = standings[0];
      crownChampion({ leagueId: league.id, season, userId: winner.userId, points: winner.points });

      const user = await interaction.client.users.fetch(winner.userId).catch(() => null);

      const embed = new EmbedBuilder()
        .setTitle(`👑 ¡Nuevo campeón de ${league.name}!`)
        .setColor(0xffd700)
        .setDescription(`**${user ? user.username : winner.userId}** es el campeón de la temporada **${season}** con **${winner.points}** pts.`);

      await interaction.editReply({ embeds: [embed] });
    }
  }
};
