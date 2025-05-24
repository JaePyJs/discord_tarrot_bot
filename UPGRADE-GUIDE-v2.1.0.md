# 🔮 Upgrade Guide to v2.1.0 - Mystical Enhancement Edition

Welcome to the most comprehensive update yet! This guide will help you upgrade your Discord Tarot Bot to version 2.1.0 with all the new mystical features.

## 🌟 What's New in v2.1.0

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

---

## 🚀 Upgrade Instructions

### Step 1: Backup Your Data

**IMPORTANT:** Always backup your data before upgrading!

```bash
# For SQLite users
cp database/tarot.db database/tarot.db.backup-$(date +%Y%m%d)

# For PostgreSQL users
pg_dump your_database_name > backup-$(date +%Y%m%d).sql
```

### Step 2: Update the Code

```bash
# Pull the latest changes
git pull origin main

# Install new dependencies
npm install
```

### Step 3: Run Database Migration

The new features require database schema updates. Run the migration script:

```bash
# Run the migration script
npm run migrate
```

This will:
- Add a `notes` column to the `readings` table
- Create a new `reminders` table
- Add necessary indexes for performance
- Create a backup of your existing database

### Step 4: Deploy New Commands

Deploy the new slash commands to Discord:

```bash
npm run deploy-commands
```

### Step 5: Test the New Features

Run the comprehensive test suite to verify everything works:

```bash
npm run test-v2.1.0
```

### Step 6: Start Your Bot

```bash
npm start
```

---

## 🆕 New Commands Available

### 📖 Journal Commands
- `/journal view [page]` - View your reading history with pagination
- `/journal note <text>` - Add a personal note to your most recent reading
- `/journal search <query>` - Search your readings by cards, types, or notes
- `/journal export [format]` - Export your journal as text or JSON
- `/journal stats` - View detailed statistics about your tarot practice

### ⏰ Reminder Commands
- `/reminder set <time> [message]` - Set a daily reading reminder
- `/reminder weekly <day> <time> [message]` - Set a weekly reading reminder
- `/reminder view` - View all your active reminders
- `/reminder remove <type>` - Remove specific or all reminders

### 🔮 Enhanced Existing Commands
- `/tarot daily` - Now includes moon phase and planetary influences
- `/tarot single` - Enhanced with astrological timing information
- `/card [name]` - Now shows crystal recommendations and meditation guidance

---

## 🛠️ Troubleshooting

### Migration Issues

**Problem:** Migration script fails
```bash
# Check database permissions
ls -la database/

# Ensure database file exists
ls -la database/tarot.db

# Run migration with verbose output
node scripts/migrate-to-v2.1.0.js
```

**Problem:** "Column already exists" error
- This is normal if you've run the migration before
- The script handles this gracefully

### Command Deployment Issues

**Problem:** New commands don't appear in Discord
```bash
# Redeploy commands
npm run deploy-commands

# Check bot permissions in your server
# Ensure bot has "Use Slash Commands" permission
```

### Reminder System Issues

**Problem:** Reminders not working
- Check that your bot has permission to send DMs
- Verify timezone settings in your environment
- Test with `/reminder set 09:00 Test message`

### Database Connection Issues

**Problem:** Database errors after migration
```bash
# Test database connection
npm run test-v2.1.0

# Restore from backup if needed
cp database/tarot.db.backup-YYYYMMDD database/tarot.db
```

---

## 🔧 Configuration Updates

### Environment Variables

No new environment variables are required, but you can optionally add:

```env
# Optional: Set timezone (defaults to Asia/Manila)
TIMEZONE=Asia/Manila

# Optional: Enable enhanced logging
LOG_LEVEL=debug
```

### PostgreSQL Users

If you're using PostgreSQL, ensure your connection settings are correct:

```env
DATABASE_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tarot_bot
DB_USER=your_username
DB_PASSWORD=your_password
```

---

## 📊 Performance Notes

### Database Performance
- New indexes have been added for optimal query performance
- Journal searches are optimized for large reading histories
- Reminder system uses efficient cron scheduling

### Memory Usage
- Enhanced card data adds minimal memory overhead
- Astrology calculations are cached for performance
- Reminder system is lightweight and efficient

---

## 🎯 Usage Tips

### Journal System
- Use `/journal note` immediately after readings for best reflection
- Export your journal monthly to track spiritual growth
- Search by card names to find patterns in your readings

### Reminder System
- Set daily reminders for consistent practice
- Use custom messages for personalized motivation
- Weekly reminders work great for deeper spreads

### Astrology Features
- Daily readings now include cosmic timing
- Pay attention to moon phase influences
- Use planetary guidance for optimal reading times

### Crystal & Meditation
- Follow crystal recommendations for enhanced readings
- Use meditation suggestions before major spreads
- Combine crystals with meditation for deeper insights

---

## 🆘 Getting Help

If you encounter issues during the upgrade:

1. **Check the logs:** Look for error messages in the console
2. **Run diagnostics:** Use `npm run test-v2.1.0` to identify issues
3. **Restore backup:** If needed, restore from your backup
4. **Create an issue:** Report bugs with detailed information

---

## 🎉 Enjoy Your Enhanced Tarot Experience!

You now have access to the most comprehensive tarot bot experience available:

- 📖 **Personal Journal** - Track your spiritual journey
- ⏰ **Smart Reminders** - Never miss your practice
- 🌙 **Astrology Integration** - Cosmic timing guidance
- 💎 **Crystal & Meditation** - Holistic spiritual practice

May the cards guide your enhanced mystical journey! ✨

---

*For more information, check the updated FEATURES.md and CHANGELOG.md files.*
