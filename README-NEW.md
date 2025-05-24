# 🔮 Discord Tarot Bot - Reorganized & Enhanced

A comprehensive Discord bot that provides mystical tarot card readings for entertainment purposes. **Now with a clean, organized project structure!**

## 🏗️ **NEW: Professional Project Structure**

This project has been completely reorganized for better maintainability and development:

```
discord-tarot-bot/
├── src/                          # Main source code
│   ├── bot/                      # Bot core functionality
│   │   └── client.js            # Discord client setup
│   ├── commands/                 # Organized by category
│   │   ├── tarot/               # Tarot-related commands
│   │   ├── divination/          # Other divination methods
│   │   ├── user/                # User management commands
│   │   └── admin/               # Administrative commands
│   ├── database/                # Database management
│   ├── utils/                   # Utility functions
│   ├── data/                    # Static data files
│   └── locales/                 # Internationalization
├── docs/                        # All documentation
│   ├── setup/                   # Setup guides
│   ├── user-guides/             # User documentation
│   └── development/             # Development docs
├── scripts/                     # Utility scripts
├── tests/                       # Test files
├── config/                      # Configuration files
└── [root files]                 # Essential root files only
```

## 🚀 **Quick Start - First Commands to Try**

### **1. Install and Setup:**
```bash
# Clone the repository
git clone https://github.com/JaePyJs/discord_tarrot_bot.git
cd discord_tarrot_bot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Discord bot token

# Deploy commands to Discord
npm run deploy-commands

# Start the bot
npm start
```

### **2. First Commands to Test in Discord:**

**Start with the help command:**
```
/tarot help
```

**Try your first reading:**
```
/tarot single
```

**Look up a specific card:**
```
/card name:The Fool
```

**Check your profile:**
```
/profile view
```

**Explore deck themes:**
```
/deck collection
```

## ✨ **Complete Feature Overview**

### **🃏 Tarot Readings**
- **8 Different Spreads**: Single card, three-card, Celtic Cross, horseshoe, relationship, yes/no, daily, career
- **Full 78-Card Deck**: All Major and Minor Arcana
- **Upright & Reversed**: Complete interpretations
- **Position-Specific Meanings**: Context-aware interpretations

### **🌟 Other Divination Methods**
- **Oracle Cards**: 5 themed decks with rich interpretations
- **Norse Runes**: Complete Elder Futhark with authentic meanings
- **I Ching**: Traditional Chinese wisdom with hexagrams

### **🎨 Customization & Personalization**
- **8 Deck Themes**: Unlock by completing readings
- **Personal Journal**: Track and annotate your readings
- **Favorites System**: Save your favorite cards
- **Achievement System**: Unlock rewards as you progress

### **👤 User Features**
- **Personal Profile**: Statistics and reading history
- **Smart Reminders**: Daily and weekly reading notifications
- **Multi-language Support**: English, Spanish, Filipino
- **Progress Tracking**: Collection completion and achievements

### **📊 Analytics & Insights**
- **Personal Statistics**: Track your tarot journey
- **Server Analytics**: Community insights (admin only)
- **Reading Patterns**: Discover your preferences
- **Advanced Metrics**: Deep dive into usage

## 📚 **Documentation & Guides**

### **Setup Guides** ([`docs/setup/`](docs/setup/))
- [Discord Bot Setup](docs/setup/discord-setup.md) - Complete Discord configuration
- [Database Setup](docs/setup/database-setup.md) - PostgreSQL and SQLite setup

### **User Guides** ([`docs/user-guides/`](docs/user-guides/))
- [Complete Discord Commands Tutorial](docs/user-guides/discord-commands-tutorial.md) - **Start here for Discord usage!**
- [Feature Overview](docs/user-guides/features.md) - All bot capabilities
- [FAQ](docs/user-guides/faq.md) - Common questions

### **Development** ([`docs/development/`](docs/development/))
- [Contributing Guide](docs/development/contributing.md)
- [API Documentation](docs/development/api.md)

## 🔧 **Configuration**

### **Environment Variables**
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_test_server_id_here

# Database Configuration (PostgreSQL recommended)
DATABASE_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=tarot_bot
POSTGRES_USER=tarot_user
POSTGRES_PASSWORD=your_password_here

# Bot Settings
TIMEZONE=Asia/Manila
MAX_READINGS_PER_DAY=10
COMMAND_COOLDOWN=30
ENABLE_ANALYTICS=true
```

### **Database Support**
- **PostgreSQL** (recommended): Production-ready, multi-server support
- **SQLite**: Simple setup, perfect for single server or testing

## 🎯 **Quick Command Reference**

| Category | Command | Description |
|----------|---------|-------------|
| **Tarot** | `/tarot single` | Quick single card reading |
| | `/tarot three-card` | Past, Present, Future spread |
| | `/tarot celtic-cross` | Comprehensive 10-card reading |
| | `/tarot help` | Complete command reference |
| **Cards** | `/card name:The Fool` | Look up specific card meanings |
| **Deck** | `/deck theme` | Change visual theme |
| | `/deck collection` | View your card collection |
| | `/deck favorites` | Manage favorite cards |
| **Profile** | `/profile view` | Your reading statistics |
| | `/journal view` | Reading history |
| | `/reminder set` | Set reading reminders |
| **Other** | `/oracle daily` | Oracle card guidance |
| | `/runes single` | Norse rune reading |
| | `/iching reading` | I Ching wisdom |

## 🎨 **Unlockable Themes**

Progress through readings to unlock beautiful deck themes:

- 🌙 **Classic Rider-Waite** (default)
- 🌸 **Ethereal Dreams** (25 readings)
- 🔮 **Mystic Shadows** (50 readings)
- 🌺 **Tropical Paradise** (10 daily readings)
- 🌌 **Cosmic Journey** (100 readings)
- 🏛️ **Ancient Wisdom** (encounter all Major Arcana)
- 🌿 **Nature's Path** (20 nature-themed readings)
- 🎭 **Art Nouveau** (200 readings)

## 🔒 **Security & Rate Limiting**

- **Smart Cooldowns**: 30 seconds between readings
- **Daily Limits**: 10 readings per day per user
- **Secure Configuration**: Environment variables for sensitive data
- **Input Validation**: Prevents malicious input
- **Database Security**: Parameterized queries and connection pooling

## 🆘 **Troubleshooting & Support**

### **Common Issues:**

1. **Commands not appearing in Discord?**
   ```bash
   npm run deploy-commands
   ```

2. **Bot not responding?**
   - Check your `.env` file has the correct `DISCORD_TOKEN`
   - Verify bot permissions in Discord server

3. **Database connection errors?**
   ```bash
   npm run setup-db
   ```

4. **Import/module errors after reorganization?**
   - All import paths have been updated for the new structure
   - If you see errors, check the file paths in `src/` directories

### **Get Help:**
- 📖 Read the [Discord Commands Tutorial](docs/user-guides/discord-commands-tutorial.md)
- 🔧 Check [Setup Guides](docs/setup/)
- 🐛 Open an issue on GitHub for bugs
- 💬 Use `/tarot help` in Discord for quick reference

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Follow the new organized structure
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ **Disclaimer**

This bot is for entertainment purposes only. Tarot readings should not be used as a substitute for professional advice.

---

## 🎉 **Ready to Start?**

1. **Set up the bot** using the guides in [`docs/setup/`](docs/setup/)
2. **Learn the commands** with the [Discord Tutorial](docs/user-guides/discord-commands-tutorial.md)
3. **Start with** `/tarot help` in Discord
4. **Try your first reading** with `/tarot single`

**May the cards guide your path! 🔮✨**
