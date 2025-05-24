# 🔮 Discord Tarot Bot Setup Guide

This guide will walk you through setting up your Discord Tarot Bot from scratch.

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- A Discord account
- Basic command line knowledge

## 🤖 Creating a Discord Bot

### Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give your bot a name (e.g., "Mystic Tarot Reader")
4. Click "Create"

### Step 2: Create a Bot User

1. In your application, go to the "Bot" section
2. Click "Add Bot"
3. Customize your bot:
   - **Username**: Choose a mystical name
   - **Avatar**: Upload a tarot-themed image
   - **Public Bot**: Turn OFF (recommended for personal use)
   - **Requires OAuth2 Code Grant**: Leave OFF

### Step 3: Get Your Bot Token

1. In the "Bot" section, click "Reset Token"
2. Copy the token (keep this secret!)
3. Save it for the next step

### Step 4: Get Your Application ID

1. Go to the "General Information" section
2. Copy the "Application ID"
3. Save it for the next step

## ⚙️ Bot Configuration

### Step 1: Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_application_id_here
   GUILD_ID=your_test_server_id_here  # Optional: for faster testing
   ```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Deploy Commands

```bash
npm run deploy-commands
```

## 🏠 Inviting Your Bot to a Server

### Step 1: Generate Invite Link

1. In the Discord Developer Portal, go to "OAuth2" > "URL Generator"
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Send Messages
   - ✅ Use Slash Commands
   - ✅ Embed Links
   - ✅ Read Message History
4. Copy the generated URL

### Step 2: Invite the Bot

1. Open the generated URL in your browser
2. Select the server you want to add the bot to
3. Click "Authorize"

## 🚀 Running the Bot

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t discord-tarot-bot .
docker run -d --name tarot-bot --env-file .env discord-tarot-bot
```

## 🧪 Testing Your Bot

1. Go to your Discord server
2. Type `/tarot` and you should see the available commands
3. Try `/tarot single` for a quick test
4. Use `/tarot help` to see all available options

## 🔧 Troubleshooting

### Bot Not Responding
- Check that the bot is online (green status)
- Verify the bot has proper permissions
- Check the console for error messages

### Commands Not Appearing
- Ensure you ran `npm run deploy-commands`
- Check that `CLIENT_ID` is correct in `.env`
- Try removing and re-adding the bot to your server

### Database Errors
- Ensure the `database/` directory exists and is writable
- Check file permissions
- Verify SQLite3 is properly installed

### Rate Limiting Issues
- Check your `.env` configuration
- Verify the database is working properly
- Look for error messages in the console

## 🎨 Customization

### Adding More Cards
Edit `data/major-arcana.json` to add or modify cards:
```json
{
  "id": 11,
  "name": "Your Custom Card",
  "arcana": "major",
  "upright": {
    "keywords": ["keyword1", "keyword2"],
    "meaning": "Your card meaning here"
  },
  "reversed": {
    "keywords": ["reversed1", "reversed2"],
    "meaning": "Your reversed meaning here"
  },
  "image_url": "https://your-image-url.com/card.jpg"
}
```

### Adjusting Rate Limits
Modify these values in `.env`:
```env
COMMAND_COOLDOWN=30          # Seconds between readings
MAX_READINGS_PER_DAY=10      # Daily limit per user
```

### Changing Bot Status
Edit `index.js` around line 45:
```javascript
client.user.setActivity('your custom status', { type: 'WATCHING' });
```

## 📊 Monitoring

### View Logs
```bash
# If running with Docker
docker logs discord-tarot-bot

# If running directly
# Logs will appear in your terminal
```

### Database Queries
The bot uses SQLite. You can query the database directly:
```bash
sqlite3 database/tarot.db
.tables
SELECT * FROM readings LIMIT 10;
```

## 🔒 Security Best Practices

1. **Never share your bot token**
2. **Use environment variables for secrets**
3. **Keep your bot private** (turn off "Public Bot")
4. **Regularly update dependencies**: `npm audit fix`
5. **Monitor bot usage** through Discord's developer portal

## 🆘 Getting Help

If you encounter issues:

1. Check this setup guide
2. Review the main README.md
3. Look at the console output for error messages
4. Check the Discord Developer Portal for any issues
5. Verify your bot permissions in Discord

## 🎉 Success!

Once everything is working, you should see:
- ✅ Bot online in Discord (green status)
- ✅ Slash commands available (`/tarot`)
- ✅ Successful readings with beautiful embeds
- ✅ Rate limiting working properly

Enjoy your mystical Discord bot! 🔮✨
