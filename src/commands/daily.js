const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db/database');
const { drawRandomCard, addCardToUser } = require('../db/cards');
const { RARITY_META, DAILY_WEIGHTS } = require('../config/rarity');

const COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 horas

module.exports = {
  data: new SlashCommandBuilder().setName('daily').setDescription('Reclama tu carta gratis del día'),

  async execute(interaction) {
    const userId = interaction.user.id;

    const row = db.prepare(`SELECT last_claim_at FROM daily_claims WHERE user_id = ?`).get(userId);

    if (row) {
      const elapsed = Date.now() - new Date(row.last_claim_at + 'Z').getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        const remainingH = Math.ceil(remainingMs / (60 * 60 * 1000));
        await interaction.reply({
          content: `⏳ Ya reclamaste tu carta de hoy. Vuelve en ~${remainingH}h.`,
          ephemeral: true
        });
        return;
      }
    }

    const card = drawRandomCard(DAILY_WEIGHTS);
    if (!card) {
      await interaction.reply({
        content: 'El catálogo de cartas todavía no está listo, intenta en unos minutos.',
        ephemeral: true
      });
      return;
    }

    addCardToUser(userId, card.id, 1);

    db.prepare(
      `INSERT INTO daily_claims (user_id, last_claim_at) VALUES (?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET last_claim_at = datetime('now')`
    ).run(userId);

    const meta = RARITY_META[card.rarity];

    const embed = new EmbedBuilder()
      .setTitle(`${meta.emoji} ¡Nueva carta! ${card.name}`)
      .setColor(meta.color)
      .setDescription(`**Rareza:** ${meta.label}\n${card.subtitle ? `**${card.type === 'constructor' ? 'Detalle' : 'Equipo'}:** ${card.subtitle}` : ''}`)
      .setFooter({ text: 'Vuelve mañana por otra carta con /daily' });

    await interaction.reply({ embeds: [embed] });
  }
};
