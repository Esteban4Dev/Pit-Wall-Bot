const CODE_RE = /^[A-Z]{3}$/;

/**
 * Valida y normaliza el string "VER,NOR,LEC,..." del modal.
 * Lanza Error con un mensaje amigable si algo no cuadra.
 */
function parseTop10(raw) {
  const codes = raw
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (codes.length !== 10) {
    throw new Error(`Debes poner exactamente 10 pilotos separados por coma (pusiste ${codes.length}).`);
  }

  const invalid = codes.filter((c) => !CODE_RE.test(c));
  if (invalid.length) {
    throw new Error(`Estos códigos no son válidos (deben ser 3 letras): ${invalid.join(', ')}`);
  }

  const duplicated = codes.filter((c, i) => codes.indexOf(c) !== i);
  if (duplicated.length) {
    throw new Error(`No puedes repetir un piloto: ${[...new Set(duplicated)].join(', ')}`);
  }

  return codes;
}

function parseDriverCode(raw) {
  if (!raw || !raw.trim()) return null;
  const code = raw.trim().toUpperCase();
  if (!CODE_RE.test(code)) {
    throw new Error(`"${raw}" no es un código de piloto válido (deben ser 3 letras, ej: VER).`);
  }
  return code;
}

function parseSafetyCar(raw) {
  if (!raw || !raw.trim()) return null;
  const val = raw.trim().toLowerCase();
  if (['si', 'sí', 's', 'yes', 'y'].includes(val)) return true;
  if (['no', 'n'].includes(val)) return false;
  throw new Error(`"${raw}" no es válido para Safety Car, responde "si" o "no".`);
}

module.exports = { parseTop10, parseDriverCode, parseSafetyCar };
