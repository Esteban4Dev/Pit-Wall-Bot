const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../db/database');
const { TRIVIA_QUESTIONS } = require('../data/triviaQuestions');
const { generateDynamicQuestions } = require('../utils/dynamicTrivia');
const { shuffle } = require('../utils/shuffle');

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 horas
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Baraja las opciones de una pregunta estática y recalcula el índice correcto,
 * así el orden no es siempre el mismo aunque la pregunta se repita.
 */
function shuffleQuestion(q) {
  const correctText = q.options[q.correctIndex];
  const options = shuffle(q.options);
  return { ...q, options, correctIndex: options.indexOf(correctText) };
}

module.exports = {
  data: new SlashCommandBuilder().setName('trivia').setDescription('Responde una pregunta de F1 y gana puntos + una carta si aciertas'),

  async execute(interaction) {
    const userId = interaction.user.id;

    const row = db.prepare(`SELECT last_claim_at FROM trivia_claims WHERE user_id = ?`).get(userId);
    if (row) {
      const elapsed = Date.now() - new Date(row.last_claim_at + 'Z').getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingMin = Math.ceil((COOLDOWN_MS - elapsed) / (60 * 1000));
        await interaction.reply({
          content: `⏳ Ya usaste tu trivia. Vuelve en ~${remainingMin} min.`,
          ephemeral: true
        });
        return;
      }
    }

    await interaction.deferReply();

    const dynamicQuestions = await generateDynamicQuestions();
    const pool = [...TRIVIA_QUESTIONS.map(shuffleQuestion), ...dynamicQuestions];
    const question = pool[Math.floor(Math.random() * pool.length)];

    // Se gasta el cooldown apenas se emite la pregunta, no al responderla,
    // para que no se pueda re-tirar buscando una pregunta "más fácil".
    db.prepare(
      `INSERT INTO trivia_claims (user_id, last_claim_at) VALUES (?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET last_claim_at = datetime('now')`
    ).run(userId);

    const embed = new EmbedBuilder()
      .setTitle('🏁 Trivia F1')
      .setColor(0xe10600)
      .setDescription(
        `**${question.question}**\n\n` +
          question.options.map((opt, i) => `**${OPTION_LETTERS[i]}.** ${opt}`).join('\n')
      )
      .setFooter({ text: 'Tienes 60 segundos para responder · Acierta y ganas puntos + una carta' });

    const row1 = new ActionRowBuilder().addComponents(
      question.options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`trivia:${i}:${question.correctIndex}:${userId}`)
          .setLabel(OPTION_LETTERS[i])
          .setStyle(ButtonStyle.Secondary)
      )
    );

    await interaction.editReply({ embeds: [embed], components: [row1] });
  }
};
