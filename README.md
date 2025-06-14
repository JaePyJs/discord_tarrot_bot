# 🔮 Discord Tarot Bot

A comprehensive Discord bot that brings the mystical art of tarot reading to your server. From single-card draws to complex spreads, this bot offers engaging spiritual content for entertainment and self-reflection.

<div align="center">

![Version](https://img.shields.io/badge/version--blue)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

## 🌟 Features

- **Diverse Reading Types**: 8 different tarot spreads from quick single cards to comprehensive Celtic Cross
- **Multiple Divination Systems**: Tarot, Oracle Cards, I-Ching, and Norse Runes
- **Personal Journey**: Track readings, save favorites, maintain a reflection journal
- **User Engagement**: Achievement system, card collection, customizable themes
- **Server Management**: Analytics, rate limiting, and moderation features
- **Fully Customizable**: Themes, language support, and server-specific settings

## 📋 Table of Contents

- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Commands](#-commands)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Installation

### Prerequisites

- Node.js (v16.0.0+)
- npm or yarn
- A Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- SQLite (default) or PostgreSQL (optional for larger servers)

### Quick Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/username/discord-tarot-bot.git
   cd discord-tarot-bot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create environment configuration:**

   ```bash
   cp .env.example .env
   ```

4. **Edit the `.env` file with your Discord credentials:**

   ```
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_application_id
   ```

5. **Run the setup script:**

   ```bash
   npm run setup
   ```

6. **Deploy commands to Discord:**

   ```bash
   npm run deploy-commands
   ```

7. **Start the bot:**
   ```bash
   npm start
   ```

### Docker Installation

1. **Build the container:**

   ```bash
   docker build -t discord-tarot-bot .
   ```

2. **Run with docker-compose:**
   ```bash
   docker-compose up -d
   ```

## ⚙️ Configuration

### Basic Configuration

Open `.env` file and configure the following settings:

```
# Discord Bot Credentials (Required)
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here

# Optional Settings
# GUILD_ID=your_test_server_id  # For faster command registration during development
# DATABASE_TYPE=postgresql       # Use PostgreSQL instead of SQLite
```

### Advanced Configuration

For more detailed configuration, see `docs/setup/ENHANCED_SETUP_GUIDE.md`

### Database Options

The bot supports two database types:

1. **SQLite** (Default): Great for small to medium servers

   - No additional setup required
   - Data stored in `src/database/tarot.db`

2. **PostgreSQL**: Recommended for large servers or multiple server deployments
   - Requires additional setup (see `docs/setup/DATABASE_SETUP.md`)
   - Better performance for high-traffic usage

## 🎮 Usage

Once the bot is running and invited to your server, users can interact with it using slash commands.

### First-time Setup

1. **Invite the bot to your server** using the OAuth2 URL generator in Discord Developer Portal

   - Required permissions: `Send Messages`, `Embed Links`, `Attach Files`, `Use Slash Commands`

2. **Deploy commands** to make them available in your server

   ```bash
   npm run deploy-commands
   ```

3. **Test the bot** with a simple command
   ```
   /tarot single
   ```

## 🔍 Commands

### Core Commands

| Command               | Description                           | Options         |
| --------------------- | ------------------------------------- | --------------- |
| `/tarot single`       | Draw a single card for quick guidance | theme, question |
| `/tarot three-card`   | Past, Present, Future spread          | theme, question |
| `/tarot celtic-cross` | 10-card comprehensive reading         | theme, question |
| `/tarot yes-no`       | Answer a yes/no question              | question        |
| `/tarot horseshoe`    | 7-card spread for choices             | theme, question |
| `/tarot daily`        | Daily guidance card                   | theme           |
| `/tarot career`       | 5-card career path reading            | theme, question |
| `/tarot relationship` | 6-card relationship insight           | theme, question |

### Utility Commands

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `/card name:[card]` | Look up specific card meanings |
| `/deck collection`  | View your collected cards      |
| `/journal view`     | See your saved readings        |
| `/profile view`     | Check your tarot usage stats   |
| `/oracle daily`     | Get an oracle card message     |
| `/iching cast`      | Cast an I-Ching hexagram       |
| `/runes cast`       | Cast a Norse rune reading      |

### Admin Commands

| Command             | Description                            |
| ------------------- | -------------------------------------- |
| `/admin settings`   | Configure bot settings for your server |
| `/analytics report` | Generate usage statistics              |
| `/stats server`     | View server engagement metrics         |

For a complete list of commands and detailed explanations, see [Commands Documentation](docs/user-guides/discord-commands-tutorial.md)

## 🧪 Development

### Project Structure

```
discord-tarot-bot/
├── 📄 index.js, package.json, README.md
├── 🗂️ src/ (commands, utils, database, data, locales)
├── 📚 docs/ (setup, user-guides, development)
├── 🧪 tests/ (test-setup.js, test-all-features.js)
├── 🔧 scripts/ (deploy-commands.js, setup.js)
├── 📦 logs/ (tarot-bot.log)
├── 🐳 Dockerfile, docker-compose.yml
└── ⚙️ .env.example, .gitignore
```

### Running Tests

```bash
npm run test          # Basic functionality tests
npm run test-all      # Comprehensive test suite
```

### Adding New Commands

1. Create a new command file in `src/commands/` directory
2. Implement required functions (`data` and `execute`)
3. Register the command with `npm run deploy-commands`

See [Development Guide](docs/development/DEVELOPMENT.md) for detailed instructions.

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Buttons Not Working

If buttons like "Share", "Overview", or "Reflection" are not responding:

1. Check that your Discord bot has the proper permissions
2. Verify the bot is online and connected to Discord
3. Try redeploying commands with `npm run deploy-commands`
4. Check logs for errors: `logs/tarot-bot.log`

#### Database Connection Errors

If you see "Database connection failed":

1. Check the database file permissions
2. Ensure SQLite is properly installed
3. For PostgreSQL, verify connection parameters in `.env`

#### Command Not Found

If slash commands are not appearing:

1. Run `npm run deploy-commands` to register commands
2. Ensure the bot has the `applications.commands` scope in OAuth2 settings
3. It may take up to an hour for global commands to propagate

For more troubleshooting steps, see [FAQ](docs/user-guides/FAQ.md)

## ⚠️ Disclaimer

This bot is designed for **entertainment and self-reflection purposes only**. Tarot readings should never replace professional advice for health, legal, or financial matters.

---

🔮 **May the cards illuminate your path!** ✨
