# 🔮 Discord Tarot Bot

A comprehensive Discord bot that provides mystical tarot card readings for entertainment purposes. Features the complete 78-card tarot deck, multiple spread types, user profiles, and advanced analytics.

**🚀 Version 2.2.0 - Ultimate Mystical Experience**

## 🆕 **What's New in v2.2.0**

### 🌟 **REVOLUTIONARY UPDATE - THE COMPLETE DIVINATION PLATFORM**

This massive update transforms the Discord Tarot Bot into the most comprehensive divination platform available! Now featuring **multiple divination methods**, **AI-powered interpretations**, **custom spread creator**, **advanced analytics**, and **interactive experiences**.

### ✨ **NEW DIVINATION METHODS**

- 🔮 **Oracle Cards**: 5 themed decks with rich interpretations
- ⚡ **Norse Runes**: Complete Elder Futhark with authentic meanings
- ☯️ **I Ching**: Traditional Chinese wisdom with hexagrams and changing lines

### 🎨 **ADVANCED FEATURES**

- 🎨 **Custom Spread Creator**: Design and share your own spreads
- 🤖 **AI-Enhanced Interpretations**: GPT-powered personalized insights
- 🌍 **Multi-Language Support**: 5 languages including Filipino/Tagalog
- 📱 **Interactive Reading Experience**: Buttons, modals, and dynamic navigation
- 🎯 **Advanced Analytics**: Deep insights into your spiritual journey
- 🎨 **Deck Customization**: 8 themes, favorites, and achievement system

## 🆕 **What's New in v2.1.0**

### 📖 **Personal Reading Journal**

- Complete searchable history of all your readings
- Add personal notes and reflections to any reading
- Export your journal as text or JSON
- Detailed statistics about your tarot practice

### ⏰ **Smart Reminder System**

- Daily and weekly reading reminders
- Philippines timezone support (Asia/Manila)
- Custom reminder messages
- DM notifications

### 🌙 **Astrology Integration**

- Moon phase influences in daily readings
- Planetary guidance and cosmic timing
- Enhanced spiritual context

### 💎 **Crystal & Meditation Enhancements**

- Crystal recommendations for Major Arcana cards
- Meditation guidance for court cards
- Holistic mind-body-spirit approach

## ✨ Features

### 🃏 **Complete Tarot Experience**

- **Full 78-Card Deck:** All 22 Major Arcana + 56 Minor Arcana cards
- **8 Reading Types:**
  - 🔮 Single Card - Quick daily guidance
  - 🃏 Three-Card Spread - Past, Present, Future
  - ✨ Celtic Cross - Comprehensive 10-card reading
  - 🐴 Horseshoe Spread - 7-card general guidance
  - 💕 Relationship Spread - 6-card love & relationships
  - ❓ Yes/No Reading - Direct answers with confidence levels
  - 🌅 Daily Card - Daily inspiration
  - 💼 Career Spread - 5-card professional guidance

### 🎨 **Rich Visual Experience**

- Beautiful Discord embeds with authentic card imagery
- Upright and reversed card meanings
- Mystical themed responses and emojis
- Position-specific interpretations for spreads
- Color-coded embeds (indigo for upright, red for reversed)

### 👤 **User Profiles & Analytics**

- Personal reading statistics and history
- Achievement badges for milestones
- Favorite spread tracking
- Server-wide statistics and leaderboards
- Reading history and patterns

### 🔍 **Advanced Features**

- Card lookup with autocomplete search
- Server statistics and analytics
- Smart rate limiting and daily limits
- User preferences and settings
- Comprehensive help system

### 🛡️ **Smart Rate Limiting**

- Configurable cooldown between readings
- Daily reading limits per user
- Prevents spam while maintaining engagement
- Graceful error handling and user feedback

### 💾 **Data Persistence**

- SQLite database for all user data
- Reading history and analytics
- User preferences and server settings
- Lightweight and self-contained

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- A Discord application and bot token
- Basic knowledge of Discord bot setup

### Installation

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd discord-tarot-bot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Discord bot credentials:

   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_application_id_here
   GUILD_ID=your_test_guild_id_here  # Optional: for faster command deployment during development
   ```

4. **Deploy slash commands:**

   ```bash
   npm run deploy-commands
   ```

5. **Start the bot:**

   ```bash
   npm start
   ```

   For development with auto-restart:

   ```bash
   npm run dev
   ```

## 🎮 Usage

### 🔮 **Tarot Reading Commands**

- `/tarot single` - Draw a single card for guidance
- `/tarot three-card` - Past, Present, Future spread
- `/tarot celtic-cross` - Full 10-card Celtic Cross spread
- `/tarot horseshoe` - 7-card Horseshoe spread for general guidance
- `/tarot relationship` - 6-card spread focused on relationships
- `/tarot yes-no` - Simple yes/no answer to your question
- `/tarot daily` - Daily guidance card
- `/tarot career` - 5-card spread for career guidance
- `/tarot help` - View usage instructions and information

### 🔮 **Oracle Cards** _(NEW in v2.2.0)_

- `/oracle single [deck]` - Draw a single oracle card from 5 different decks
- `/oracle three [deck]` - Past, Present, Future oracle spread
- `/oracle daily` - Daily oracle guidance with automatic deck rotation
- **5 Oracle Decks**: Angel Guidance 🌟, Goddess Wisdom 🌸, Spirit Animals 🦋, Moon Phases 🌙, Crystal Energy 💎

### ⚡ **Norse Runes** _(NEW in v2.2.0)_

- `/runes single` - Cast a single rune for guidance
- `/runes three` - Three-rune spread for past, present, future
- `/runes daily` - Daily rune guidance
- `/runes norns` - The Norns spread invoking Urd, Verdandi, and Skuld
- **Complete Elder Futhark**: All 24 traditional Norse runes with authentic meanings

### ☯️ **I Ching** _(NEW in v2.2.0)_

- `/iching cast [question]` - Cast coins for a hexagram reading with optional question
- `/iching daily` - Daily I Ching guidance
- `/iching hexagram <number>` - Look up specific hexagrams (1-64)
- **Traditional System**: Authentic Chinese wisdom with changing lines and transformations

### 🎨 **Custom Spreads** _(NEW in v2.2.0)_

- `/spread create` - Design your own custom spreads (1-15 cards)
- `/spread list [filter]` - Browse your spreads and public community spreads
- `/spread use <name>` - Perform readings with custom spreads
- `/spread edit <name>` - Modify your existing spreads
- `/spread share <name>` - Share your spreads with the community

### 🎨 **Deck Customization** _(NEW in v2.2.0)_

- `/deck theme <style>` - Change your deck theme (8 themes available)
- `/deck favorites` - Manage your favorite cards
- `/deck collection` - View your card collection and statistics
- `/deck preferences` - Set reading preferences and AI features
- `/deck unlock` - View and unlock new themes through achievements

### 📊 **Advanced Analytics** _(NEW in v2.2.0)_

- `/analytics patterns` - Analyze your reading patterns and trends
- `/analytics insights` - Get personalized insights about your spiritual journey
- `/analytics timeline [period]` - View your tarot journey timeline
- `/analytics recommendations` - Get personalized recommendations for your practice

### 📖 **Journal Commands** _(NEW in v2.1.0)_

- `/journal view [page]` - View your reading history with pagination
- `/journal note <text>` - Add a personal note to your most recent reading
- `/journal search <query>` - Search your readings by cards, types, or notes
- `/journal export [format]` - Export your journal as text or JSON
- `/journal stats` - View detailed statistics about your tarot practice

### ⏰ **Reminder Commands** _(NEW in v2.1.0)_

- `/reminder set <time> [message]` - Set a daily reading reminder
- `/reminder weekly <day> <time> [message]` - Set a weekly reading reminder
- `/reminder view` - View all your active reminders
- `/reminder remove <type>` - Remove specific or all reminders

### 📊 **Profile & Analytics Commands**

- `/profile` - View your personal tarot reading statistics
- `/stats` - View server-wide reading statistics
- `/card [name]` - Look up information about a specific card (with autocomplete, now enhanced with crystals and meditation)

### Example Interactions

```text
User: /tarot relationship
Bot: 💕 Tarot Reading for Username
     [Six cards showing relationship dynamics with detailed interpretations]

User: /tarot yes-no
Bot: ❓ Tarot Reading for Username
     Answer: Yes (High confidence)
     [Card interpretation explaining the guidance]

User: /card the fool
Bot: 🔮 The Fool
     [Detailed upright and reversed meanings with imagery]

User: /profile
Bot: 🔮 Tarot Profile for Username
     [Personal statistics, badges, and reading history]
```

## ⚙️ Configuration

### Environment Variables

| Variable               | Description                  | Default               |
| ---------------------- | ---------------------------- | --------------------- |
| `DISCORD_TOKEN`        | Your Discord bot token       | Required              |
| `CLIENT_ID`            | Your Discord application ID  | Required              |
| `GUILD_ID`             | Test server ID (optional)    | None                  |
| `DATABASE_PATH`        | SQLite database file path    | `./database/tarot.db` |
| `COMMAND_COOLDOWN`     | Seconds between readings     | `30`                  |
| `MAX_READINGS_PER_DAY` | Daily reading limit per user | `10`                  |

### Customization

- **Card Data:** Modify `data/major-arcana.json` to customize card meanings
- **Rate Limits:** Adjust cooldown and daily limits in `.env`
- **Styling:** Modify embed colors and formatting in `commands/tarot.js`

## 🐳 Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create database directory
RUN mkdir -p database

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t discord-tarot-bot .
docker run -d --name tarot-bot --env-file .env discord-tarot-bot
```

## 📊 Database Schema

The bot uses SQLite with two main tables:

- **users:** Tracks user cooldowns and reading counts
- **readings:** Stores reading history for analytics

## 🛡️ Security & Permissions

### Required Bot Permissions

- `Send Messages`
- `Use Slash Commands`
- `Embed Links`
- `Read Message History`

### Security Features

- Rate limiting prevents spam
- Input validation on all commands
- No sensitive data storage
- Ephemeral error messages

## 🎨 Customization Ideas

- Add more tarot spreads (Horseshoe, Relationship, etc.)
- Implement Minor Arcana cards (56 additional cards)
- Add user preferences (favorite decks, reading styles)
- Create reading history commands
- Add server-specific settings
- Implement card of the day feature

## 🐛 Troubleshooting

### Common Issues

1. **Commands not appearing:**

   - Ensure bot has proper permissions
   - Run `npm run deploy-commands`
   - Check `CLIENT_ID` and `GUILD_ID` in `.env`

2. **Database errors:**

   - Ensure write permissions in database directory
   - Check `DATABASE_PATH` configuration

3. **Rate limiting not working:**
   - Verify environment variables are loaded
   - Check database connection

### Debug Mode

Set `NODE_ENV=development` for additional logging.

## 📚 **Complete Documentation Library**

### **🚀 Getting Started**

- [QUICK-START-GUIDE.md](QUICK-START-GUIDE.md) - **Start here!** Get reading in 5 minutes
- [SETUP.md](SETUP.md) - Complete bot setup guide
- [DISCORD_SETUP.md](DISCORD_SETUP.md) - Discord bot configuration
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database setup options

### **📖 User Guides**

- [USER-GUIDE.md](USER-GUIDE.md) - **Complete user manual** for all features
- [TAROT-INTERPRETATION-GUIDE.md](TAROT-INTERPRETATION-GUIDE.md) - **Learn tarot meanings** and interpretation
- [QUICK-COMMAND-REFERENCE.md](QUICK-COMMAND-REFERENCE.md) - **All commands** at a glance
- [FAQ.md](FAQ.md) - **Frequently asked questions** and troubleshooting

### **🔧 Technical Documentation**

- [FEATURES.md](FEATURES.md) - Detailed feature documentation
- [CHANGELOG.md](CHANGELOG.md) - Version history and updates
- [ENHANCEMENT-SUMMARY-v2.2.0.md](ENHANCEMENT-SUMMARY-v2.2.0.md) - Latest enhancements
- [NEXT-STEPS-v2.2.0.md](NEXT-STEPS-v2.2.0.md) - Advanced configuration options

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This bot is for entertainment purposes only. Tarot readings should not be used for making important life decisions. The bot provides randomly generated card combinations and interpretations based on traditional tarot meanings.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

If you encounter issues or have questions:

1. Check the troubleshooting section
2. Review the GitHub issues
3. Create a new issue with detailed information

---

_May the cards guide your code! 🔮_
