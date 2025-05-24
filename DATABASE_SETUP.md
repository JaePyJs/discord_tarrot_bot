# 🗄️ **DATABASE SETUP GUIDE - POSTGRESQL FOR PHILIPPINES**

## 🚀 **RECOMMENDED: PostgreSQL Setup**

PostgreSQL is the recommended database for production use with your Discord Tarot Bot. Here's how to set it up for Philippines timezone.

---

## 📋 **Prerequisites**

### **For Windows:**
1. **Download PostgreSQL:** https://www.postgresql.org/download/windows/
2. **Choose version:** PostgreSQL 15 or 16 (latest stable)
3. **During installation:**
   - Remember the password for `postgres` user
   - Default port: 5432
   - Default locale: Use your system locale

### **For macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

### **For Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## 🔧 **Database Configuration**

### **Step 1: Access PostgreSQL**

**Windows (using pgAdmin or Command Prompt):**
```cmd
# Open Command Prompt as Administrator
psql -U postgres
```

**macOS/Linux:**
```bash
sudo -u postgres psql
```

### **Step 2: Create Database and User**

Run these commands in PostgreSQL:

```sql
-- 1. Create the database
CREATE DATABASE tarot_bot;

-- 2. Create a dedicated user
CREATE USER tarot_user WITH PASSWORD 'your_secure_password_here';

-- 3. Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE tarot_bot TO tarot_user;

-- 4. Connect to the new database
\c tarot_bot

-- 5. Grant schema permissions
GRANT ALL ON SCHEMA public TO tarot_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tarot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tarot_user;

-- 6. Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tarot_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tarot_user;

-- 7. Set timezone to Philippines (IMPORTANT!)
ALTER DATABASE tarot_bot SET timezone TO 'Asia/Manila';

-- 8. Exit PostgreSQL
\q
```

### **Step 3: Update Your .env File**

Edit your `.env` file with the PostgreSQL settings:

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

# Philippines Timezone
TIMEZONE=Asia/Manila
```

---

## 🇵🇭 **Philippines Timezone Configuration**

Your bot is now configured for **Philippines Standard Time (PST) - UTC+8**.

### **Key Features:**
- ✅ **Daily cards** scheduled in Philippines time
- ✅ **All timestamps** displayed in Philippines time
- ✅ **Analytics** calculated using Philippines timezone
- ✅ **User activity** tracked in local time

### **Daily Card Schedule:**
- Default time: **9:00 AM Philippines Time**
- Configurable in `.env`: `DAILY_CARD_TIME=09:00`
- Timezone: `TIMEZONE=Asia/Manila`

---

## 🧪 **Testing Your Setup**

### **Step 1: Install Dependencies**
```bash
npm install
```

### **Step 2: Initialize Database Schema**
```bash
node -e "
const { initializePostgreSQLSchema } = require('./database/initPostgreSQL');
initializePostgreSQLSchema().then(() => {
  console.log('✅ Database schema initialized successfully!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});
"
```

### **Step 3: Test Database Connection**
```bash
npm run test-all
```

### **Step 4: Deploy Commands and Start Bot**
```bash
npm run deploy-commands
npm start
```

---

## 🔒 **Security Best Practices**

### **1. Strong Password**
```sql
-- Use a strong password (example)
ALTER USER tarot_user WITH PASSWORD 'TarotBot2024!SecurePass#Philippines';
```

### **2. Network Security**
Edit `postgresql.conf` and `pg_hba.conf` if needed:
```bash
# Find config files
sudo -u postgres psql -c "SHOW config_file;"
sudo -u postgres psql -c "SHOW hba_file;"
```

### **3. Environment Variables**
Never commit your `.env` file! Keep your database credentials secure.

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. "Connection refused" Error**
```bash
# Check if PostgreSQL is running
# Windows:
services.msc  # Look for PostgreSQL service

# macOS:
brew services list | grep postgresql

# Linux:
sudo systemctl status postgresql
```

#### **2. "Authentication failed" Error**
- Double-check username and password in `.env`
- Verify user exists: `\du` in PostgreSQL
- Check `pg_hba.conf` authentication method

#### **3. "Database does not exist" Error**
- Verify database name in `.env`
- Check if database exists: `\l` in PostgreSQL

#### **4. "Permission denied" Error**
- Re-run the GRANT commands from Step 2
- Ensure user has proper permissions

### **Reset Database (if needed):**
```sql
-- Connect as postgres user
DROP DATABASE IF EXISTS tarot_bot;
DROP USER IF EXISTS tarot_user;

-- Then repeat Step 2 above
```

---

## 📊 **Database Schema Overview**

Your PostgreSQL database will have these tables:

1. **`users`** - User profiles and reading counts
2. **`readings`** - All tarot reading history
3. **`user_preferences`** - User settings and preferences
4. **`server_settings`** - Discord server configurations
5. **`analytics`** - Performance and usage analytics

### **Views Created:**
- **`daily_reading_stats`** - Daily analytics summary
- **`user_reading_summary`** - User activity overview

---

## 🌟 **Advanced Features**

### **Automatic Backups**
```bash
# Create backup script (backup.sh)
#!/bin/bash
pg_dump -h localhost -U tarot_user -d tarot_bot > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Performance Monitoring**
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('tarot_bot'));

-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## ✅ **Success Checklist**

- [ ] PostgreSQL installed and running
- [ ] Database `tarot_bot` created
- [ ] User `tarot_user` created with proper permissions
- [ ] Timezone set to `Asia/Manila`
- [ ] `.env` file updated with database credentials
- [ ] Database schema initialized successfully
- [ ] Bot connects and runs without errors
- [ ] Daily card scheduling works in Philippines time

---

## 🆘 **Need Help?**

If you encounter issues:

1. **Check the logs:** Look for error messages in the console
2. **Verify credentials:** Double-check your `.env` file
3. **Test connection:** Use `psql` to connect manually
4. **Check permissions:** Ensure user has proper database access

**Your Discord Tarot Bot is now ready with PostgreSQL and Philippines timezone! 🇵🇭🔮**
