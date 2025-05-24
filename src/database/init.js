require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const { initializePostgreSQLSchema } = require("./initPostgreSQL");
const logger = require("../utils/logger");

async function initializeDatabase() {
  const dbType = process.env.DATABASE_TYPE || "postgresql";

  logger.info(`Initializing ${dbType} database...`);

  if (dbType.toLowerCase() === "postgresql") {
    return await initializePostgreSQLSchema();
  } else if (dbType.toLowerCase() === "sqlite") {
    return await initializeSQLiteDatabase();
  } else {
    throw new Error(`Unsupported database type: ${dbType}`);
  }
}

async function initializeSQLiteDatabase() {
  // Ensure database directory exists
  const dbDir = path.dirname(
    process.env.SQLITE_PATH || path.join(__dirname, "tarot.db")
  );
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, "tarot.db");

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Create tables
      db.serialize(() => {
        // Users table for rate limiting
        db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        user_id TEXT PRIMARY KEY,
                        last_reading DATETIME,
                        reading_count INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

        // Readings table for history (enhanced with notes)
        db.run(`
                    CREATE TABLE IF NOT EXISTS readings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        guild_id TEXT,
                        reading_type TEXT NOT NULL,
                        cards TEXT NOT NULL,
                        notes TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

        // User preferences table
        db.run(`
                    CREATE TABLE IF NOT EXISTS user_preferences (
                        user_id TEXT PRIMARY KEY,
                        favorite_deck TEXT DEFAULT 'rider-waite',
                        daily_notifications BOOLEAN DEFAULT 0,
                        preferred_spread TEXT,
                        timezone TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

        // Server settings table
        db.run(`
                    CREATE TABLE IF NOT EXISTS server_settings (
                        guild_id TEXT PRIMARY KEY,
                        reading_channel TEXT,
                        daily_card_enabled BOOLEAN DEFAULT 0,
                        daily_card_time TEXT DEFAULT '09:00',
                        max_readings_per_day INTEGER DEFAULT 10,
                        cooldown_seconds INTEGER DEFAULT 30,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

        // Analytics table
        db.run(`
                    CREATE TABLE IF NOT EXISTS analytics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_type TEXT NOT NULL,
                        user_id TEXT,
                        guild_id TEXT,
                        data TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

        // Reminders table for scheduled reading reminders
        db.run(`
                    CREATE TABLE IF NOT EXISTS reminders (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        reminder_type TEXT NOT NULL,
                        schedule TEXT NOT NULL,
                        custom_message TEXT,
                        is_active BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, reminder_type)
                    )
                `);

        // Custom spreads table
        db.run(`
                    CREATE TABLE IF NOT EXISTS custom_spreads (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        description TEXT NOT NULL,
                        card_count INTEGER NOT NULL,
                        positions TEXT NOT NULL,
                        is_public BOOLEAN DEFAULT 0,
                        creator_name TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, name)
                    )
                `);

        // User preferences table
        db.run(`
                    CREATE TABLE IF NOT EXISTS user_preferences (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL UNIQUE,
                        deck_theme TEXT DEFAULT 'classic',
                        reading_style TEXT DEFAULT 'detailed',
                        allow_reversed BOOLEAN DEFAULT 1,
                        ai_insights BOOLEAN DEFAULT 1,
                        language TEXT DEFAULT 'en',
                        unlocked_themes TEXT DEFAULT '["classic"]',
                        notifications BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

        // User favorites table
        db.run(`
                    CREATE TABLE IF NOT EXISTS user_favorites (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        card_name TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, card_name)
                    )
                `);

        // Create indexes for better performance
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_users_last_reading ON users(last_reading)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, created_at)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_readings_guild ON readings(guild_id)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_readings_notes ON readings(notes)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_custom_spreads_user ON custom_spreads(user_id)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_custom_spreads_public ON custom_spreads(is_public)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_user_favorites_card ON user_favorites(card_name)`
        );
      });

      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

module.exports = { initializeDatabase };
