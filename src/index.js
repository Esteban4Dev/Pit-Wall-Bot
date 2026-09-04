require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
require('./db/database'); // fuerza la creación del archivo .db y las tablas al arrancar
const { handlePredictModal } = require('./interactions/modalHandlers');
const { handleTradeButton } = require('./interactions/buttonHandlers');
const { handleTriviaButton } = require('./interactions/triviaButtonHandler');
const { handleQuickTriviaButton } = require('./interactions/quickTriviaButtonHandler');
const { handleHelpSelect } = require('./interactions/selectMenuHandlers');
const { seedCards } = require('./db/seedCards');
const { startScheduler } = require('./jobs/scheduler');

const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  console.error('❌ Falta DISCORD_TOKEN en el archivo .env');
  process.exit(1);
}

const client = new Client({
  // GuildMembers es necesario para /leaderboard alcance:server. Es un "privileged
  // intent": hay que habilitarlo también en Discord Developer Portal > Bot >
  // Privileged Gateway Intents > Server Members Intent.
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// --- Carga dinámica de comandos ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command?.data && command?.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`⚠️  El comando en ${file} no tiene 'data' o 'execute', se omite.`);
  }
}

// --- Manejo de interacciones ---
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('predict_modal:')) {
        await handlePredictModal(interaction);
      }
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('trade_accept:') || interaction.customId.startsWith('trade_decline:')) {
        await handleTradeButton(interaction);
      } else if (interaction.customId.startsWith('quicktrivia:')) {
        await handleQuickTriviaButton(interaction);
      } else if (interaction.customId.startsWith('trivia:')) {
        await handleTriviaButton(interaction);
      }
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'help_select') {
        await handleHelpSelect(interaction);
      }
      return;
    }
  } catch (error) {
    console.error('Error manejando interacción:', error);

    const errorReply = { content: '⚠️ Ocurrió un error procesando esto.', ephemeral: true };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorReply);
    } else if (interaction.isRepliable()) {
      await interaction.reply(errorReply);
    }
  }
});

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Pit Wall Bot conectado como ${c.user.tag}`);

  await seedCards();
  startScheduler(client);
});

client.login(DISCORD_TOKEN);
