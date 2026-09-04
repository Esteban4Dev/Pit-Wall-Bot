const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { credit } = require('../db/wallet');
const { drawRandomCard, addCardToUser } = require('../db/cards');
const { RARITY_META, DAILY_WEIGHTS } = require('../config/rarity');

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const TRIVIA_REWARD_POINTS = 5;

/**
 * El texto completo de cada opción vive en la descripción del embed
 * ("**A.** Texto..."), así que lo leemos de ahí en vez de tener que guardar
 * la pregunta en algún lado — el customId de los botones solo carga índices.
 */
function extractOptionText(description, letter) {
  const line = description.split('\n').find((l) => l.startsWith(`**${letter}.**`));
  return line ? line.replace(`**${letter}.**`, '').trim() : letter;
}

async function handleTriviaButton(interaction) {
  const [, optIdxStr, correctIdxStr, ownerId] = interaction.customId.split(':');
  const optIdx = Number(optIdxStr);
  const correctIdx = Number(correctIdxStr);

  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: 'Esta trivia no es tuya, usa `/trivia` para la tuya. 🏁', ephemeral: true });
    return;
  }

  const description = interaction.message.embeds[0]?.description ?? '';
  const isCorrect = optIdx === correctIdx;
  const correctText = extractOptionText(description, OPTION_LETTERS[correctIdx]);

  // Reconstruye los botones ya deshabilitados, marcando visualmente el
  // acierto/error (verde en la correcta, rojo en la elegida si falló).
  const disabledRow = new ActionRowBuilder().addComponents(
    interaction.message.components[0].components.map((btn, i) => {
      let style = ButtonStyle.Secondary;
      if (i === correctIdx) style = ButtonStyle.Success;
      else if (i === optIdx) style = ButtonStyle.Danger;

      return new ButtonBuilder().setCustomId(btn.customId).setLabel(btn.label).setStyle(style).setDisabled(true);
    })
  );

  let resultLine;
  if (isCorrect) {
    credit(interaction.user.id, TRIVIA_REWARD_POINTS);
    const card = drawRandomCard(DAILY_WEIGHTS);
    let cardLine = '';
    if (card) {
      addCardToUser(interaction.user.id, card.id, 1);
      const meta = RARITY_META[card.rarity];
      cardLine = ` y una carta ${meta.emoji} **${card.name}** (${meta.label})`;
    }
    resultLine = `✅ **¡Correcto!** +${TRIVIA_REWARD_POINTS} pts${cardLine}.`;
  } else {
    resultLine = `❌ **Incorrecto.** La respuesta correcta era **${correctText}**.`;
  }

  const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
    .setColor(isCorrect ? 0x2ecc71 : 0xe74c3c)
    .setDescription(`${description}\n\n${resultLine}`)
    .setFooter({ text: 'Vuelve a intentarlo en 4 horas con /trivia' });

  await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });
}

module.exports = { handleTriviaButton };
