# 🔮 **ENHANCED DISCORD TAROT BOT - COMPLETE SETUP GUIDE**

## 🇵🇭 **PHILIPPINES EDITION WITH POSTGRESQL**

Your Discord Tarot Bot has been **MASSIVELY ENHANCED** with PostgreSQL database support, Philippines timezone configuration, and advanced security features!

---

## 🚀 **QUICK SETUP (RECOMMENDED)**

Since you already have your Discord token in the `.env` file, here's the fastest way to get your enhanced bot running:

### **Option 1: Interactive Setup (Recommended)**
```bash
npm run setup
```
This will guide you through the complete setup process with prompts.

### **Option 2: Manual Setup**
If you prefer to configure manually, follow the detailed steps below.

---

## 🗄️ **DATABASE SETUP - POSTGRESQL (RECOMMENDED)**

### **Step 1: Install PostgreSQL**

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Install with default settings (remember the postgres password)

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### **Step 2: Create Database and User**

Open PostgreSQL command line:
```bash
# Windows: Open Command Prompt as Administrator
psql -U postgres

# macOS/Linux:
sudo -u postgres psql
```

Run these commands in PostgreSQL:
```sql
-- Create database
CREATE DATABASE tarot_bot;

-- Create user
CREATE USER tarot_user WITH PASSWORD 'your_secure_password_here';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE tarot_bot TO tarot_user;

-- Connect to database
\c tarot_bot

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO tarot_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tarot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tarot_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tarot_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tarot_user;

-- Set Philippines timezone
ALTER DATABASE tarot_bot SET timezone TO 'Asia/Manila';

-- Exit
\q
```

### **Step 3: Update Your .env File**

Add these PostgreSQL settings to your existing `.env` file:

```env
# Database Configuration
DATABASE_TYPE=postgresql

# PostgreSQL Settings
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=tarot_bot
POSTGRES_USER=tarot_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_SSL=false

# Philippines Timezone (IMPORTANT!)
TIMEZONE=Asia/Manila

# Enhanced Features
ENABLE_ANALYTICS=true
PERFORMANCE_MONITORING=true
ENABLE_DEBUG_LOGGING=false
```

---

## 🇵🇭 **PHILIPPINES TIMEZONE FEATURES**

Your bot is now fully configured for **Philippines Standard Time (UTC+8)**:

### **✅ What's Configured:**
- **Daily cards** scheduled in Philippines time
- **All timestamps** displayed in Philippines time  
- **Analytics** calculated using Philippines timezone
- **User activity** tracked in local time
- **Database** timezone set to Asia/Manila

### **🌅 Daily Card Schedule:**
- Default time: **9:00 AM Philippines Time**
- Configurable: `DAILY_CARD_TIME=09:00`
- Timezone: `TIMEZONE=Asia/Manila`

---

## 🛠️ **COMPLETE INSTALLATION**

### **Step 1: Install Dependencies**
```bash
npm install
```

### **Step 2: Initialize Database Schema**
```bash
npm run setup-db
```

### **Step 3: Deploy Discord Commands**
```bash
npm run deploy-commands
```

### **Step 4: Test Everything**
```bash
npm run test-all
```

### **Step 5: Start the Bot**
```bash
npm start
```

---

## 🌟 **NEW ENHANCED FEATURES**

### **🗄️ PostgreSQL Database**
- **Production-ready** with connection pooling
- **Optimized indexes** for performance
- **Automatic timestamps** with Philippines timezone
- **JSONB support** for complex data
- **Views** for analytics queries

### **🛡️ Advanced Security**
- **Input validation** with Joi schemas
- **Rate limiting** per user and server
- **Blacklist support** for users/servers
- **Security event logging**
- **Suspicious activity detection**

### **⚡ Performance Monitoring**
- **Real-time metrics** collection
- **Performance alerts** for slow operations
- **Memory usage** monitoring
- **System health** checks
- **Webhook notifications** for issues

### **🇵🇭 Philippines Timezone Support**
- **All times** in Philippines Standard Time
- **Daily card** scheduling in local time
- **Analytics** calculated in Philippines timezone
- **User-friendly** date/time formatting

### **🔧 Enhanced Admin Tools**
- **System status** monitoring
- **Performance reports**
- **Database cleanup** tools
- **Manual daily card** posting
- **Analytics dashboard**

---

## 📊 **AVAILABLE COMMANDS**

### **🔮 Tarot Readings (8 Types)**
- `/tarot single` - Single card guidance
- `/tarot three-card` - Past, Present, Future
- `/tarot celtic-cross` - 10-card comprehensive
- `/tarot horseshoe` - 7-card general guidance
- `/tarot relationship` - 6-card love reading
- `/tarot yes-no` - Direct yes/no answers
- `/tarot daily` - Daily inspiration
- `/tarot career` - 5-card career guidance
- `/tarot help` - Complete help system

### **📊 Analytics & Profiles**
- `/profile` - Personal statistics and badges
- `/stats` - Server-wide analytics
- `/card [name]` - Card lookup with autocomplete

### **🛠️ Admin Tools (New!)**
- `/admin daily-card` - Post daily card manually
- `/admin analytics` - Generate analytics report
- `/admin status` - System status and performance
- `/admin cleanup` - Clean old data and logs

---

## 🧪 **TESTING YOUR SETUP**

### **Test Database Connection:**
```bash
node -e "
const DatabaseManager = require('./database/DatabaseManager');
const db = new DatabaseManager();
db.testConnection().then(success => {
  console.log(success ? '✅ Database connected!' : '❌ Database connection failed');
  process.exit(success ? 0 : 1);
});
"
```

### **Test All Features:**
```bash
npm run test-all
```

### **Test in Discord:**
1. Type `/tarot help` to see all commands
2. Try `/tarot single` for a quick reading
3. Use `/profile` to see your statistics
4. Test `/card the fool` for card lookup

---

## 🚨 **TROUBLESHOOTING**

### **Database Connection Issues:**
1. **Check PostgreSQL is running:**
   ```bash
   # Windows: Check services.msc
   # macOS: brew services list | grep postgresql
   # Linux: sudo systemctl status postgresql
   ```

2. **Verify credentials in .env file**
3. **Test manual connection:**
   ```bash
   psql -h localhost -U tarot_user -d tarot_bot
   ```

### **Bot Not Responding:**
1. Check console for error messages
2. Verify Discord token is correct
3. Ensure bot has proper permissions
4. Try redeploying commands: `npm run deploy-commands`

### **Timezone Issues:**
1. Verify `TIMEZONE=Asia/Manila` in .env
2. Check database timezone: `SHOW timezone;` in PostgreSQL
3. Restart bot after timezone changes

---

## 🔒 **SECURITY BEST PRACTICES**

### **Database Security:**
- Use strong passwords for PostgreSQL user
- Never commit .env file to version control
- Regularly backup your database
- Monitor for suspicious activity

### **Bot Security:**
- Keep Discord token secret
- Use environment variables for all secrets
- Enable rate limiting and blacklists
- Monitor performance and security logs

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **Database Optimization:**
- Connection pooling enabled by default
- Indexes created for all common queries
- JSONB for efficient JSON storage
- Automatic cleanup of old data

### **Bot Optimization:**
- Memory usage monitoring
- Performance alerts for slow operations
- Efficient Discord API usage
- Graceful error handling

---

## 🎉 **SUCCESS CHECKLIST**

- [ ] PostgreSQL installed and running
- [ ] Database `tarot_bot` created with proper permissions
- [ ] `.env` file updated with database credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Database schema initialized (`npm run setup-db`)
- [ ] Discord commands deployed (`npm run deploy-commands`)
- [ ] Bot starts without errors (`npm start`)
- [ ] Bot responds to `/tarot help` in Discord
- [ ] Philippines timezone working correctly
- [ ] All 78 tarot cards available
- [ ] User profiles and analytics working

---

## 🌟 **WHAT'S NEW IN THIS ENHANCED VERSION**

1. **🗄️ PostgreSQL Support** - Production-ready database
2. **🇵🇭 Philippines Timezone** - Full localization for Philippines
3. **🛡️ Advanced Security** - Input validation, rate limiting, blacklists
4. **⚡ Performance Monitoring** - Real-time metrics and alerts
5. **🔧 Enhanced Admin Tools** - Complete management system
6. **📊 Better Analytics** - Detailed performance and usage tracking
7. **🌅 Daily Card Automation** - Scheduled in Philippines time
8. **🎨 Improved UX** - Better error handling and user feedback

**Your Discord Tarot Bot is now enterprise-grade and ready for the Philippines! 🇵🇭🔮**

---

*May the cards guide your Discord server with mystical wisdom from the Philippines! 🌟*
