const { EmbedBuilder } = require('discord.js');

const CATEGORIES = {
  overview: {
    label: '👋 Inicio',
    build: () =>
      new EmbedBuilder()
        .setTitle('🏎️ Pit Wall Bot — Ayuda')
        .setColor(0xe10600)
        .setDescription(
          'Bot de Fórmula 1 para el servidor: resultados en vivo, predicciones con puntos, cartas coleccionables y ligas privadas.\n\n' +
            'Usa el menú de abajo para ver los comandos de cada sección.\n\n' +
            '**Categorías:**\n' +
            '🏁 Información de F1\n' +
            '🔮 Predicciones\n' +
            '🃏 Cartas coleccionables\n' +
            '👑 Ligas privadas\n' +
            '📅 Actualizaciones automáticas'
        )
  },

  info: {
    label: '🏁 Información de F1',
    build: () =>
      new EmbedBuilder()
        .setTitle('🏁 Información de F1')
        .setColor(0xe10600)
        .setDescription(
          '**/nextrace**\nPróxima carrera: circuito, cuenta regresiva y horarios de todas las sesiones.\n\n' +
            '**/standings tipo:<Pilotos|Constructores>**\nClasificación actual del campeonato.\n\n' +
            '**/results ronda:<opcional>**\nResultados de una carrera (por defecto, la última corrida).\n\n' +
            '**/schedule**\nCalendario completo de la temporada, marcando qué carreras ya pasaron.'
        )
  },

  predictions: {
    label: '🔮 Predicciones',
    build: () =>
      new EmbedBuilder()
        .setTitle('🔮 Predicciones')
        .setColor(0x1e90ff)
        .setDescription(
          '**/predict**\nAbre un formulario para predecir el Top 10, pole, vuelta rápida y Safety Car de la próxima carrera. ' +
            'Puedes editarla mientras esté abierta. Se cierra 1 hora antes de la carrera.\n\n' +
            '**/mypredictions**\nVe tu predicción actual y tus puntos si ya se corrió.\n\n' +
            '**/leaderboard tipo:<Predicciones|Saldo|Trivia> alcance:<servidor|global>**\nRanking de predicciones, saldo gastable, o liga mensual de trivia.\n\n' +
            '**Puntos:**\nExacta: 10 · Off-by-one: 5 · Pole: +5 · Vuelta rápida: +3 · Safety Car: +2\n' +
            '🏆 Top 10 perfecto = carta Legendaria gratis.'
        )
  },

  cards: {
    label: '🃏 Cartas coleccionables',
    build: () =>
      new EmbedBuilder()
        .setTitle('🃏 Cartas coleccionables')
        .setColor(0x9b59b6)
        .setDescription(
          '**/daily**\nCarta gratis cada 20 horas. Rareza al azar: ⚪ Común · 🔵 Especial · 🟣 Épica · 🟡 Legendaria.\n\n' +
            '**/trivia**\nPregunta de F1 cada 4 horas. Acierta y ganas 5 pts + una carta al azar.\n\n' +
            '**/quicktrivia**\nPregunta rápida cada 10 minutos, máx. 5 al día. Sin cartas ni saldo — solo suma a la Liga de Trivia mensual.\n\n' +
            '**/choosecard carta_id:<ID>**\nSolo para el campeón del mes de trivia: elige cualquier carta del catálogo.\n\n' +
            '**/cards**\nCatálogo completo de cartas con sus IDs.\n\n' +
            '**/balance**\nVe tu saldo de puntos gastables (distinto del ranking de `/leaderboard`).\n\n' +
            '**/collection usuario:<opcional>**\nTu colección, agrupada por rareza (o la de otra persona).\n\n' +
            '**/packs**\nSobre de 3 cartas por 30 puntos de predicción.\n\n' +
            '**/trade usuario:<@x> mi_carta:<ID> su_carta:<ID>**\nPropone un intercambio; la otra persona confirma con botones.'
        )
  },

  leagues: {
    label: '👑 Ligas privadas',
    build: () =>
      new EmbedBuilder()
        .setTitle('👑 Ligas privadas')
        .setColor(0xffd700)
        .setDescription(
          '**/createleague nombre:<texto>**\nCrea tu liga (con sistema de puntos propio si quieres). Te da un código para compartir.\n\n' +
            '**/joinleague codigo:<código>**\nÚnete a una liga con su código.\n\n' +
            '**/league standings**\nClasificación de tu liga, como imagen.\n\n' +
            '**/league halloffame**\nCampeones históricos de la liga.\n\n' +
            '**/league crownchampion**\n*(solo el dueño)* Corona al líder actual como campeón de la temporada.'
        )
  },

  automation: {
    label: '📅 Automático',
    build: () =>
      new EmbedBuilder()
        .setTitle('📅 Actualizaciones automáticas')
        .setColor(0x2ecc71)
        .setDescription(
          'Todos los días a las 9:00, el bot publica solo un resumen con:\n\n' +
            '• La próxima carrera y cuánto falta\n' +
            '• Un dato histórico del circuito\n' +
            '• Quién ganó la última carrera\n' +
            '• Quién lidera el campeonato\n\n' +
            'No necesitas hacer nada, se publica solo en el canal de actualizaciones.\n\n' +
            'También el día 1 de cada mes se corona solo al campeón del mes anterior de la Liga de Trivia, sin que un admin tenga que hacerlo a mano.'
        )
  }
};

module.exports = { CATEGORIES };
