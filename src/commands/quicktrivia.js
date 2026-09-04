const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../db/database');
const { TRIVIA_QUESTIONS } = require('../data/triviaQuestions');
const { shuffle } = require('../utils/shuffle');

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos
const DAILY_LIMIT = 5;
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function today() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' (UTC)
}

function shuffleQuestion(q) {
  const correctText = q.options[q.correctIndex];
  const options = shuffle(q.options);
  return { ...q, options, correctIndex: options.indexOf(correctText) };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quicktrivia')
    .setDescription('Trivia rápida cada 10 min — solo suma a la Liga de Trivia mensual (sin cartas)'),

  async execute(interaction) {
    const userId = interaction.user.id;

    const row = db
      .prepare(`SELECT last_claim_at, last_question_id, uses_today, day FROM quicktrivia_claims WHERE user_id = ?`)
      .get(userId);

    const usesToday = row && row.day === today() ? row.uses_today : 0;
    if (usesToday >= DAILY_LIMIT) {
      await interaction.reply({
        content: `⏳ Ya usaste tus ${DAILY_LIMIT} trivias rápidas de hoy. Vuelve mañana.`,
        ephemeral: true
      });
      return;
    }

    if (row) {
      const elapsed = Date.now() - new Date(row.last_claim_at + 'Z').getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        await interaction.reply({
          content: `⏳ Ya respondiste tu trivia rápida. Vuelve en ~${remainingSec}s.`,
          ephemeral: true
        });
        return;
      }
    }

    // No consultamos preguntas dinámicas aquí (a diferencia de /trivia):
    // con cooldown de 10 min y varios usuarios jugando, golpear la API de F1
    // tan seguido podría chocar con su límite de peticiones.
    // Evitamos repetir la misma pregunta que le tocó la vez anterior.
    const pool = TRIVIA_QUESTIONS.filter((q) => q.id !== row?.last_question_id);
    const candidates = pool.length ? pool : TRIVIA_QUESTIONS;
    const question = shuffleQuestion(candidates[Math.floor(Math.random() * candidates.length)]);

    db.prepare(
      `INSERT INTO quicktrivia_claims (user_id, last_claim_at, last_question_id, uses_today, day)
       VALUES (?, datetime('now'), ?, 1, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         last_claim_at = datetime('now'),
         last_question_id = excluded.last_question_id,
         uses_today = CASE WHEN quicktrivia_claims.day = excluded.day THEN quicktrivia_claims.uses_today + 1 ELSE 1 END,
         day = excluded.day`
    ).run(userId, question.id, today());

    const embed = new EmbedBuilder()
      .setTitle('⚡ Trivia Rápida')
      .setColor(0x9b59b6)
      .setDescription(
        `**${question.question}**\n\n` +
          question.options.map((opt, i) => `**${OPTION_LETTERS[i]}.** ${opt}`).join('\n')
      )
      .setFooter({ text: `Trivia rápida ${usesToday + 1}/${DAILY_LIMIT} de hoy · Solo suma a la Liga de Trivia mensual` });

    const row1 = new ActionRowBuilder().addComponents(
      question.options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`quicktrivia:${i}:${question.correctIndex}:${userId}`)
          .setLabel(OPTION_LETTERS[i])
          .setStyle(ButtonStyle.Secondary)
      )
    );

    await interaction.reply({ embeds: [embed], components: [row1] });
  }
};
