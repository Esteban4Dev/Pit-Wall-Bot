const { createCanvas } = require('@napi-rs/canvas');

const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 110;
const WIDTH = 760;
const PADDING = 32;

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

/**
 * Dibuja una imagen PNG de la clasificación de una liga.
 * rows: [{ rank, name, points }], ya ordenadas de mayor a menor.
 * Devuelve un Buffer PNG listo para adjuntar en Discord.
 */
function renderLeagueStandingsImage({ title, rows }) {
  const height = HEADER_HEIGHT + Math.max(rows.length, 1) * ROW_HEIGHT + PADDING;
  const canvas = createCanvas(WIDTH, height);
  const ctx = canvas.getContext('2d');

  // Fondo
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(1, '#0f0f1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, height);

  // Franja roja superior (guiño F1)
  ctx.fillStyle = '#e10600';
  ctx.fillRect(0, 0, WIDTH, 8);

  // Título
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(title, PADDING, 60);

  ctx.fillStyle = '#9a9ab0';
  ctx.font = '16px sans-serif';
  ctx.fillText('Pit Wall Bot — Clasificación de liga', PADDING, 86);

  if (!rows.length) {
    ctx.fillStyle = '#9a9ab0';
    ctx.font = '18px sans-serif';
    ctx.fillText('Todavía no hay puntajes registrados en esta liga.', PADDING, HEADER_HEIGHT + 30);
    return canvas.toBuffer('image/png');
  }

  rows.forEach((row, i) => {
    const y = HEADER_HEIGHT + i * ROW_HEIGHT;

    // Fila alterna
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)';
    ctx.fillRect(PADDING - 12, y, WIDTH - (PADDING - 12) * 2, ROW_HEIGHT - 6);

    // Posición
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = MEDAL_COLORS[i] ?? '#ffffff';
    ctx.fillText(`${row.rank}`, PADDING, y + 34);

    // Nombre
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(row.name, PADDING + 50, y + 34);

    // Puntos, alineado a la derecha
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#e10600';
    const pointsText = `${row.points} pts`;
    const textWidth = ctx.measureText(pointsText).width;
    ctx.fillText(pointsText, WIDTH - PADDING - textWidth, y + 34);
  });

  return canvas.toBuffer('image/png');
}

module.exports = { renderLeagueStandingsImage };
