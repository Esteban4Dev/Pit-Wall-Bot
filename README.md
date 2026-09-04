# 🏎️ Pit Wall Bot

Bot de Discord de Fórmula 1: resultados en vivo, predicciones, coleccionables y ligas privadas.

## Estado actual: Fases 1, 2, 3 y 4 completas, más el canal de actualizaciones automáticas

**Fase 1 — Fundación:**
- `/nextrace` — próxima carrera con cuenta regresiva y horarios de sesiones
- `/standings` — clasificación de pilotos o constructores
- `/results [ronda]` — resultados de una carrera (por defecto, la última)
- `/schedule` — calendario completo de la temporada
- Embeds con colores de equipo

**Fase 2 — Predicciones:**
- `/predict` — modal para predecir Top 10, pole, vuelta rápida y Safety Car.
  Se cierra automáticamente 1 hora antes de la carrera.
- `/mypredictions` — tu predicción actual y tus puntos si ya se corrió.
- `/leaderboard [alcance]` — ranking global o de tu servidor.
- `/admin score <ronda> [temporada]` — puntúa las predicciones pendientes
  (requiere "Gestionar servidor"). Manual por ahora.

**Fase 3 — Coleccionables:**
- `/daily` — carta gratis cada 20 horas, sorteada por rareza.
- `/collection [usuario]` — tu colección o la de otra persona.
- `/packs` — sobre de 3 cartas por 30 puntos de predicción.
- `/trade @usuario mi_carta:<id> su_carta:<id>` — intercambio con confirmación por botones.
- Logro automático: Top 10 perfecto = carta Legendaria gratis.

**Fase 4 — Liga privada:**
- `/createleague nombre:<texto> [puntos_exacta] [puntos_offbyone] [puntos_pole] [puntos_vuelta_rapida] [puntos_safety_car]`
  — crea una liga con su propio sistema de puntos (o usa los valores default
  del bot si no especificas nada) y te agrega como dueño.
- `/joinleague codigo:<código>` — únete con el código de 6 caracteres que te compartan.
- `/league standings [codigo]` — clasificación de la liga como **imagen** (generada con `@napi-rs/canvas`).
- `/league halloffame [codigo]` — campeones históricos de la liga.
- `/league crownchampion [codigo]` — corona al líder actual como campeón de
  la temporada (solo el dueño de la liga; no duplica si repites en la misma temporada).
- Si estás en una sola liga, `codigo` es opcional en todos los subcomandos.

**Extra — Canal de actualizaciones automáticas:**
- Cada día (por defecto 9:00, configurable) el bot publica en el canal
  `1539839510140035102` un resumen con: próxima carrera y cuenta regresiva,
  un dato histórico del circuito, quién ganó la última carrera, y quién lidera el campeonato.
- `/admin postupdate` — dispara esa publicación manualmente.

### ¿Cómo funciona el sistema de puntos propio por liga?

Cada predicción puntuada guarda no solo el total, sino el **desglose crudo**
(cuántas posiciones exactas acertaste, cuántas off-by-one, si acertaste pole,
vuelta rápida y safety car). Cada liga tiene sus propios pesos para esos
mismos conteos, así que dos ligas pueden tener rankings completamente
distintos a partir de las mismas predicciones — probado en desarrollo: una
liga que premia mucho la pole y la vuelta rápida corona a alguien distinto
que una liga que solo valora el top10 exacto.

### Sistema de puntos por defecto (fuera de ligas custom)

| Concepto | Puntos |
|---|---|
| Posición exacta (por cada uno de los 10) | 10 |
| Posición desviada por 1 lugar | 5 |
| Pole position correcta | +5 |
| Vuelta rápida correcta | +3 |
| Safety Car acertado | +2 |
| Top 10 perfecto (bonus) | 🏆 carta Legendaria gratis |

### ⚠️ Sobre la detección de Safety Car

Ni Ergast ni Jolpica exponen un campo explícito de "hubo Safety Car". Lo
resolvemos cruzando la fecha de la carrera con los mensajes de control de
carrera (`race_control`) de **OpenF1**. Es **best-effort**: si OpenF1 no
tiene datos para esa sesión, esa parte simplemente no se puntúa para nadie.

### Requiere: Server Members Intent

`/leaderboard alcance:server` necesita leer la lista de miembros del servidor.
Actívalo en el [Developer Portal](https://discord.com/developers/applications) →
tu app → **Bot** → **Privileged Gateway Intents** → **Server Members Intent**.

### Sobre el canal fijo

El ID de canal está en `.env` (`RACE_UPDATES_CHANNEL_ID`), ya viene
precargado con `1539839510140035102`. Asegúrate de que el bot tenga permiso
de **Ver canal** y **Enviar mensajes** ahí.

### Sobre la generación de imágenes

`@napi-rs/canvas` trae binarios precompilados para Linux/macOS/Windows, así
que `npm install` debería bastar sin instalar librerías de sistema (a
diferencia de `node-canvas`/Cairo). Si tu servidor usa una arquitectura poco
común, revisa que exista un binario prebuilt para tu plataforma en su
[página de npm](https://www.npmjs.com/package/@napi-rs/canvas).

## ⚠️ Nota importante sobre las fuentes de datos

El plan original mencionaba la **API de Ergast**, pero esa API **cerró a fines de 2024**.
Este bot usa **[Jolpica-F1](https://github.com/jolpica/jolpica-f1)**, el sucesor oficial y
mantenido por la comunidad, que expone los **mismos endpoints y formato de respuesta** que
Ergast (`api.jolpi.ca/ergast/f1/...`), así que el código es prácticamente idéntico al que
hubieras escrito contra Ergast. Para datos de sesión en vivo se usa **OpenF1**.

Límite gratuito de Jolpica: ~200 requests/hora sin autenticación. Para producción con
varios servidores, conviene cachear resultados (ver sección "Siguientes pasos").

## Instalación

1. Clona/descarga esta carpeta e instala dependencias:
   ```bash
   npm install
   ```

2. Crea una aplicación en el [Discord Developer Portal](https://discord.com/developers/applications):
   - Copia el **Application ID** → `CLIENT_ID`
   - En la pestaña "Bot", crea un token → `DISCORD_TOKEN`
   - En "OAuth2 > URL Generator", marca los scopes `bot` y `applications.commands`,
     y en permisos como mínimo `Send Messages` y `Embed Links`. Usa la URL generada
     para invitar el bot a tu servidor.

3. Copia `.env.example` a `.env` y completa los valores:
   ```bash
   cp .env.example .env
   ```
   Para desarrollo, también pon tu `GUILD_ID` (clic derecho en tu servidor con
   modo desarrollador activado > "Copiar ID de servidor") para que los comandos
   se registren al instante en vez de esperar hasta 1 hora.

4. Registra los comandos slash:
   ```bash
   npm run deploy
   ```

5. Arranca el bot:
   ```bash
   npm start
   ```
   (o `npm run dev` para reinicio automático al guardar cambios)

## Estructura del proyecto

```
src/
  index.js            # entry point: login + manejo de interacciones (comandos, modales, botones)
  deploy-commands.js  # registra los slash commands en Discord
  commands/           # un archivo por comando slash
  interactions/
    modalHandlers.js   # guardado de /predict al enviar el modal
    buttonHandlers.js  # Aceptar/Rechazar de /trade
  jobs/
    raceUpdatePost.js  # arma y publica el embed de actualización de F1
    scheduler.js        # cron que dispara raceUpdatePost.js periódicamente
  db/
    database.js         # conexión SQLite + esquema completo + migraciones ligeras
    predictions.js       # predicciones y leaderboard global
    cards.js             # catálogo de cartas, colecciones, sorteos
    seedCards.js          # siembra el catálogo (leyendas + temporada actual)
    wallet.js             # saldo de puntos gastables en /packs
    trades.js             # intercambios pendientes/aceptados/rechazados
    leagues.js            # ligas privadas, membresías, pesos custom, Hall of Fame
  utils/
    api.js              # cliente de Jolpica (Ergast-compatible) y OpenF1
    embeds.js            # helpers para construir embeds consistentes
    scoring.js           # calcula conteos de aciertos + aplica pesos (default o de liga)
    validation.js         # valida el input del modal de predicciones
    leagueImage.js         # genera el PNG de clasificación con @napi-rs/canvas
  config/
    teamColors.js        # colores de librea por constructor
    rarity.js             # metadata y probabilidades de rareza de cartas
  data/
    legendaryCards.js     # catálogo fijo de leyendas históricas

data/
  pitwall.db          # se crea solo al arrancar el bot (no se sube a git)
```

## Roadmap original: completo

Con esto se implementaron las 4 fases del plan original (Fundación,
Predicciones, Coleccionables, Liga privada) más la pieza principal de
automatización (canal de actualizaciones). El bot es usable de punta a punta.
Si más adelante quieres seguir puliendo, quedan sueltos, del roadmap original:
- Notificaciones automáticas de cada sesión del fin de semana (FP1/FP2/FP3/Qualy),
  no solo el resumen diario.
- Automatizar `/admin score` para que se dispare solo apenas termine una carrera.
- `/stats @usuario`, soporte multi-idioma, y `/admin resetpredictions`.

## Servidor de Discord, bot F1 Hispano 24/7

https://discord.gg/FRuNRgAEZd
