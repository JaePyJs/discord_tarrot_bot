const {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
} = require("discord.js");
const { readdirSync } = require("fs");
const path = require("path");
require("dotenv").config();

const Database = require("../database/database");
const { initializeDatabase } = require("../database/init");
const logger = require("../utils/logger");
const analytics = require("../utils/analytics");
const DailyCardManager = require("../utils/dailyCard");
const ReminderManager = require("../utils/reminderManager");
const { handleButtonInteraction } = require("../utils/buttonHandlers");

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Create a collection for commands
client.commands = new Collection();

// Initialize managers
let dailyCardManager;
let reminderManager;

// Load command files recursively
function loadCommands(dir) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      loadCommands(filePath);
    } else if (file.name.endsWith('.js')) {
      const command = require(filePath);
      
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        logger.success(`Loaded command: ${command.data.name}`);
      } else {
        logger.warn(
          `Command at ${filePath} is missing required "data" or "execute" property.`
        );
      }
    }
  }
}

// Load all commands
const commandsPath = path.join(__dirname, "../commands");
loadCommands(commandsPath);

// Initialize database and systems
async function initBot() {
  try {
    await initializeDatabase();
    logger.success("Database initialized successfully");

    // Clean old logs and analytics
    logger.cleanOldLogs();
    await analytics.cleanOldData();

    logger.info("Bot initialization completed");
  } catch (error) {
    logger.error("Failed to initialize bot:", error);
    process.exit(1);
  }
}

// Event: Bot is ready
client.once("ready", async () => {
  logger.success(`${client.user.tag} is online and ready to read the cards!`);
  logger.info(`Serving ${client.guilds.cache.size} servers`);

  // Set bot status
  const statusMessage = process.env.BOT_STATUS || "the mystical cards 🔮";
  const activityType =
    ActivityType[process.env.BOT_ACTIVITY_TYPE] || ActivityType.Watching;
  client.user.setActivity(statusMessage, { type: activityType });

  // Initialize daily card manager
  dailyCardManager = new DailyCardManager(client);

  // Initialize reminder manager
  reminderManager = new ReminderManager(client);
  await reminderManager.initialize();

  // Schedule daily analytics report
  if (process.env.ENABLE_ANALYTICS === "true") {
    setInterval(async () => {
      await analytics.generateDailyReport();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  logger.info("All systems initialized and ready");
});

// Event: Handle interactions (commands and autocomplete)
client.on("interactionCreate", async (interaction) => {
  // Handle button interactions
  if (interaction.isButton()) {
    try {
      const startTime = Date.now();
      await handleButtonInteraction(interaction);
      const executionTime = Date.now() - startTime;

      logger.debug(`Button interaction handled: ${interaction.customId}`, {
        executionTime: `${executionTime}ms`,
        userId: interaction.user.id,
      });
    } catch (error) {
      logger.error("Error handling button interaction:", error);
      
      const errorMessage = {
        content: "🚫 There was an error processing your button interaction! The spirits seem disturbed...",
        ephemeral: true,
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (followUpError) {
        logger.error("Failed to send button error message:", followUpError);
      }
    }
    return;
  }

  // Handle autocomplete interactions
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);

    if (!command || !command.autocomplete) {
      return;
    }

    try {
      const startTime = Date.now();
      await command.autocomplete(interaction);
      const executionTime = Date.now() - startTime;

      logger.debug(`Autocomplete handled: ${interaction.commandName}`, {
        executionTime: `${executionTime}ms`,
        userId: interaction.user.id,
      });
    } catch (error) {
      logger.error("Error handling autocomplete:", error);
    }
    return;
  }

  // Handle slash command interactions
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  const startTime = Date.now();

  if (!command) {
    logger.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    // Execute command
    await command.execute(interaction);

    const executionTime = Date.now() - startTime;

    // Log successful command execution
    logger.logCommand(
      interaction.commandName,
      interaction.user.id,
      interaction.guild?.id,
      true
    );

    // Track analytics
    await analytics.trackCommand(
      interaction.commandName,
      interaction.user.id,
      interaction.guild?.id,
      true,
      executionTime
    );

    logger.debug(`Command executed successfully: ${interaction.commandName}`, {
      executionTime: `${executionTime}ms`,
      userId: interaction.user.id,
      guildId: interaction.guild?.id,
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;

    logger.error("Error executing command:", error);
    logger.logCommand(
      interaction.commandName,
      interaction.user.id,
      interaction.guild?.id,
      false,
      error
    );

    // Track failed command
    await analytics.trackCommand(
      interaction.commandName,
      interaction.user.id,
      interaction.guild?.id,
      false,
      executionTime,
      error
    );

    const errorMessage = {
      content:
        "🚫 There was an error while executing this command! The spirits seem disturbed...",
      ephemeral: true,
    };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (followUpError) {
      logger.error("Failed to send error message:", followUpError);
    }
  }
});

// Event: Handle errors
client.on("error", (error) => {
  logger.error("Discord client error:", error);
});

// Handle process errors
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...");

  if (dailyCardManager) {
    logger.info("Stopping daily card manager...");
  }

  if (reminderManager) {
    logger.info("Stopping reminder manager...");
    reminderManager.stopAll();
  }

  logger.info("Destroying Discord client...");
  client.destroy();

  logger.info("Bot shutdown complete");
  process.exit(0);
});

module.exports = { client, initBot };
