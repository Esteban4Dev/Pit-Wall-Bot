const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { addTriviaPoints } = require('../db/triviaLeague');

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const QUICK_TRIVIA_LEAGUE_POINTS = 2;

function extractOptionText(description, letter) {
  const line = description.split('\n').find((l) => l.startsWith(`**${letter}.**`));
  return line ? line.replace(`**${letter}.**`, '').trim() : letter;
}

async function handleQuickTriviaButton(interaction) {
  const [, optIdxStr, correctIdxStr, ownerId] = interaction.customId.split(':');
  const optIdx = Number(optIdxStr);
  const correctIdx = Number(correctIdxStr);

  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: 'Esta trivia rápida no es tuya, usa `/quicktrivia` para la tuya. ⚡', ephemeral: true });
    return;
  }

  const description = interaction.message.embeds[0]?.description ?? '';
  const isCorrect = optIdx === correctIdx;
  const correctText = extractOptionText(description, OPTION_LETTERS[correctIdx]);

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
    addTriviaPoints(interaction.user.id, QUICK_TRIVIA_LEAGUE_POINTS);
    resultLine = `✅ **¡Correcto!** +${QUICK_TRIVIA_LEAGUE_POINTS} pts a la Liga de Trivia mensual.`;
  } else {
    resultLine = `❌ **Incorrecto.** La respuesta correcta era **${correctText}**.`;
  }

  const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
    .setColor(isCorrect ? 0x2ecc71 : 0xe74c3c)
    .setDescription(`${description}\n\n${resultLine}`)
    .setFooter({ text: 'Próxima pregunta en 10 min con /quicktrivia' });

  await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });
}

module.exports = { handleQuickTriviaButton };
