const { REST, Routes } = require("discord.js");
const { readdirSync } = require("fs");
const path = require("path");
require("dotenv").config();

const commands = [];

// Load command files recursively from src/commands
function loadCommands(dir) {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      loadCommands(filePath);
    } else if (file.name.endsWith(".js")) {
      const command = require(filePath);

      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
      } else {
        console.log(
          `⚠️  Command at ${filePath} is missing required "data" or "execute" property.`
        );
      }
    }
  }
}

// Load all commands from the new structure
const commandsPath = path.join(__dirname, "..", "src", "commands");
loadCommands(commandsPath);

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(
      `🚀 Started refreshing ${commands.length} application (/) commands.`
    );
    console.log(
      `Using token: ${process.env.DISCORD_TOKEN ? "Provided" : "Missing"}`
    );
    console.log(`Client ID: ${process.env.CLIENT_ID}`);
    console.log(`Guild ID: ${process.env.GUILD_ID || "Global deployment"}`);

    let data;

    if (process.env.GUILD_ID) {
      // Deploy to specific guild (faster for development)
      console.log(`Deploying to guild: ${process.env.GUILD_ID}`);
      data = await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: commands }
      );
      console.log(`✅ Successfully reloaded ${data.length} guild commands.`);
    } else {
      // Deploy globally (takes up to 1 hour to propagate)
      data = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands,
      });
      console.log(`✅ Successfully reloaded ${data.length} global commands.`);
    }
  } catch (error) {
    console.error("❌ Error deploying commands:", error);
  }
})();
