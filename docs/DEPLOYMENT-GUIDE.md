# 🚀 Discord Tarot Bot - Deployment Guide

## Prerequisites

- [Node.js](https://nodejs.org/) v16.0.0 or higher
- A [Discord Bot Token](https://discord.com/developers/applications)
- Basic familiarity with Discord bot setup

## Quick Deployment Steps

### 1. Configure Environment Variables

Edit the `.env` file in the root directory and add your Discord Bot Token and other configuration:

```
# Database Configuration (Default uses SQLite)
DATABASE_TYPE=sqlite
SQLITE_PATH=./database/tarot.db

# Discord Bot Token (REQUIRED)
DISCORD_TOKEN=your_discord_bot_token_here

# Bot Configuration (REQUIRED for command deployment)
CLIENT_ID=your_discord_application_client_id
GUILD_ID=your_test_guild_id_for_development

# Optional Configuration
LOG_LEVEL=info
TIMEZONE=Asia/Manila
DEFAULT_COOLDOWN=30
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Deploy Commands

This registers all slash commands with Discord:

```bash
npm run deploy-commands
```

### 4. Start the Bot

```bash
npm start
```

For development with automatic reloading:

```bash
npm run dev
```

## Docker Deployment (Optional)

If you prefer using Docker:

```bash
docker-compose up -d
```

## Verifying Deployment

Once your bot is running, you should see:

- ✅ "Bot initialization completed" message in the console
- ✅ Your bot appearing online in your Discord server
- ✅ Slash commands available when typing `/` in Discord

## Testing Bot Functionality

1. Try a basic command: `/tarot single`
2. Check the reminder system: `/reminder set`
3. Test button interactions on readings
4. Use card lookup: `/card`
5. View your profile: `/profile`

## Troubleshooting

### Common Issues

1. **"An invalid token was provided"**

   - Verify your Discord token is correct in the `.env` file

2. **Commands not appearing in Discord**

   - Run `npm run deploy-commands` again
   - Check if your bot has proper permissions

3. **Database Errors**
   - Ensure the database directory is writable
   - For PostgreSQL users: verify connection details

## Maintenance

- Check logs in `logs/tarot-bot.log`
- Update dependencies periodically with `npm update`
- Back up the database file regularly if using SQLite
