const { client, initBot } = require("./src/bot/client");

// Initialize and login
initBot().then(() => {
  client.login(process.env.DISCORD_TOKEN);
});
