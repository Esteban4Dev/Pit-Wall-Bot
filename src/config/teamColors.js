// Colores aproximados de librea 2025/2026. Actualiza cada temporada si cambian.
// Las claves están normalizadas (minúsculas, sin espacios/acentos) para matchear
// contra el "constructorId" que devuelve la API (ej: "red_bull", "ferrari").
const TEAM_COLORS = {
  red_bull: 0x3671c6,
  mclaren: 0xff8000,
  ferrari: 0xe8002d,
  mercedes: 0x27f4d2,
  aston_martin: 0x229971,
  alpine: 0x0093cc,
  williams: 0x64c4ff,
  rb: 0x6692ff,
  sauber: 0x52e252,
  haas: 0xb6babd,
  default: 0xe10600 // rojo F1 genérico
};

function getTeamColor(constructorId) {
  if (!constructorId) return TEAM_COLORS.default;
  const key = constructorId.toLowerCase().replace(/[\s-]/g, '_');
  return TEAM_COLORS[key] ?? TEAM_COLORS.default;
}

module.exports = { TEAM_COLORS, getTeamColor };
