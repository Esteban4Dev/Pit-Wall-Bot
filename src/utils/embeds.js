const { EmbedBuilder } = require('discord.js');
const { getTeamColor } = require('../config/teamColors');

function baseEmbed({ title, description, color = 0xe10600 }) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description ?? null)
    .setColor(color)
    .setFooter({ text: 'Pit Wall Bot 🏎️ · Datos: Jolpica-F1 / OpenF1' })
    .setTimestamp();
}

function formatCountdown(targetDate) {
  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) return '¡La sesión ya comenzó o finalizó!';

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(' ');
}

module.exports = { baseEmbed, formatCountdown, getTeamColor };
