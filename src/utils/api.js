const fetch = require('node-fetch');

const ERGAST_BASE_URL = process.env.ERGAST_BASE_URL || 'https://api.jolpi.ca/ergast/f1';
const OPENF1_BASE_URL = process.env.OPENF1_BASE_URL || 'https://api.openf1.org/v1';

/**
 * Fetch genérico con manejo de errores centralizado.
 */
async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }

  return res.json();
}

/**
 * API estilo Ergast (servida por Jolpica-F1, el sucesor oficial de Ergast
 * tras su cierre a fines de 2024). Misma forma de respuesta que Ergast,
 * solo cambia el dominio base.
 */
const ergast = {
  async currentSeasonSchedule() {
    const data = await fetchJson(`${ERGAST_BASE_URL}/current.json`);
    return data.MRData.RaceTable.Races;
  },

  async nextRace() {
    const races = await this.currentSeasonSchedule();
    const now = new Date();
    return races.find((r) => new Date(`${r.date}T${r.time || '00:00:00Z'}`) > now) ?? null;
  },

  async driverStandings(season = 'current') {
    const data = await fetchJson(`${ERGAST_BASE_URL}/${season}/driverStandings.json`);
    const list = data.MRData.StandingsTable.StandingsLists;
    return list.length ? list[0].DriverStandings : [];
  },

  async constructorStandings(season = 'current') {
    const data = await fetchJson(`${ERGAST_BASE_URL}/${season}/constructorStandings.json`);
    const list = data.MRData.StandingsTable.StandingsLists;
    return list.length ? list[0].ConstructorStandings : [];
  },

  /**
   * Resultados de un GP. `round` puede ser número de ronda, "last", o vacío
   * (usa "last" por defecto).
   */
  async raceResults(season = 'current', round = 'last') {
    const data = await fetchJson(`${ERGAST_BASE_URL}/${season}/${round}/results.json`);
    const races = data.MRData.RaceTable.Races;
    return races.length ? races[0] : null;
  },

  async qualifyingResults(season = 'current', round = 'last') {
    const data = await fetchJson(`${ERGAST_BASE_URL}/${season}/${round}/qualifying.json`);
    const races = data.MRData.RaceTable.Races;
    return races.length ? races[0] : null;
  },

  /**
   * Info de calendario (fecha, hora, circuito) de una ronda específica, sin resultados.
   */
  async raceInfo(season = 'current', round) {
    const data = await fetchJson(`${ERGAST_BASE_URL}/${season}/${round}.json`);
    const races = data.MRData.RaceTable.Races;
    return races.length ? races[0] : null;
  },

  /**
   * Cuántos GP se han corrido en este circuito y desde qué año, para dar
   * contexto histórico. Usa el total que reporta la propia API (MRData.total)
   * en vez de contar el array, por si hay más de 1000 carreras (no pasa hoy,
   * pero así queda correcto).
   */
  async circuitHistory(circuitId) {
    const data = await fetchJson(`${ERGAST_BASE_URL}/circuits/${circuitId}/races.json?limit=1000`);
    const races = data.MRData.RaceTable.Races;
    const total = Number(data.MRData.total) || races.length;
    const years = races.map((r) => Number(r.season)).filter((y) => !Number.isNaN(y));
    const firstYear = years.length ? Math.min(...years) : null;
    return { total, firstYear };
  }
};

/**
 * API OpenF1 para datos de sesión / tiempo real.
 */
const openf1 = {
  async latestSession() {
    const data = await fetchJson(`${OPENF1_BASE_URL}/sessions?session_key=latest`);
    return data.length ? data[0] : null;
  },

  async sessionsForMeeting(meetingKey) {
    return fetchJson(`${OPENF1_BASE_URL}/sessions?meeting_key=${meetingKey}`);
  },

  /**
   * Busca el meeting de OpenF1 cuya sesión de carrera cae en la fecha dada (YYYY-MM-DD).
   * Es un match best-effort por fecha, no hay un ID compartido entre Ergast/Jolpica y OpenF1.
   */
  async findRaceSessionByDate(dateStr) {
    const year = dateStr.slice(0, 4);
    const sessions = await fetchJson(
      `${OPENF1_BASE_URL}/sessions?year=${year}&session_name=Race`
    );
    return sessions.find((s) => (s.date_start || '').startsWith(dateStr)) ?? null;
  },

  /**
   * Best-effort: revisa los mensajes de control de carrera buscando despliegues
   * de Safety Car (incluye Virtual Safety Car). Si OpenF1 no tiene datos para
   * esa sesión, devuelve null (desconocido) en vez de asumir "no".
   */
  async wasSafetyCarDeployed(sessionKey) {
    const messages = await fetchJson(`${OPENF1_BASE_URL}/race_control?session_key=${sessionKey}`);
    if (!messages.length) return null;

    return messages.some((m) => {
      const text = `${m.category ?? ''} ${m.message ?? ''}`.toUpperCase();
      return text.includes('SAFETY CAR');
    });
  }
};

module.exports = { ergast, openf1 };
