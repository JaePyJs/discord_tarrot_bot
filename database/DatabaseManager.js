const { Pool } = require("pg");
const sqlite3 = require("sqlite3").verbose();
const moment = require("moment-timezone");
const logger = require("../utils/logger");

class DatabaseManager {
  constructor() {
    this.dbType = process.env.DATABASE_TYPE || "postgresql";
    this.timezone = process.env.TIMEZONE || "Asia/Manila";
    this.pool = null;
    this.db = null;

    this.initializeConnection();
  }

  initializeConnection() {
    switch (this.dbType.toLowerCase()) {
      case "postgresql":
      case "postgres":
        this.initializePostgreSQL();
        break;
      case "sqlite":
        this.initializeSQLite();
        break;
      default:
        logger.error(`Unsupported database type: ${this.dbType}`);
        throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }

  initializePostgreSQL() {
    const config = {
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      database: process.env.POSTGRES_DATABASE || "tarot_bot",
      user: process.env.POSTGRES_USER || "tarot_user",
      password: process.env.POSTGRES_PASSWORD,
      ssl:
        process.env.POSTGRES_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
      acquireTimeoutMillis:
        parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT) || 60000,
      timezone: this.timezone,
    };

    this.pool = new Pool(config);

    this.pool.on("error", (err) => {
      logger.error("PostgreSQL pool error:", err);
    });

    logger.info("PostgreSQL connection pool initialized", {
      host: config.host,
      port: config.port,
      database: config.database,
      timezone: this.timezone,
    });
  }

  initializeSQLite() {
    const dbPath = process.env.SQLITE_PATH || "./database/tarot.db";
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error("SQLite connection error:", err);
        throw err;
      } else {
        logger.info("SQLite database connected", { path: dbPath });
      }
    });
  }

  // Get current timestamp in Philippines timezone
  getCurrentTimestamp() {
    return moment().tz(this.timezone).format("YYYY-MM-DD HH:mm:ss");
  }

  // Get date in Philippines timezone
  getCurrentDate() {
    return moment().tz(this.timezone).format("YYYY-MM-DD");
  }

  // Execute query based on database type
  async query(sql, params = []) {
    if (this.dbType === "postgresql") {
      return await this.postgresQuery(sql, params);
    } else if (this.dbType === "sqlite") {
      return await this.sqliteQuery(sql, params);
    }
  }

  async postgresQuery(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } catch (error) {
      logger.error("PostgreSQL query error:", {
        sql,
        params,
        error: error.message,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async sqliteQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            logger.error("SQLite query error:", {
              sql,
              params,
              error: err.message,
            });
            reject(err);
          } else {
            resolve({ rows, rowCount: rows.length });
          }
        });
      } else {
        this.db.run(sql, params, function (err) {
          if (err) {
            logger.error("SQLite query error:", {
              sql,
              params,
              error: err.message,
            });
            reject(err);
          } else {
            resolve({
              rowCount: this.changes,
              insertId: this.lastID,
              rows: [],
            });
          }
        });
      }
    });
  }

  // Get user's last reading time for rate limiting
  async getLastReading(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT last_reading FROM users WHERE user_id = $1"
        : "SELECT last_reading FROM users WHERE user_id = ?";

    const result = await this.query(sql, [userId]);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];

    if (row && row.last_reading) {
      return moment.tz(row.last_reading, this.timezone).toDate();
    }
    return null;
  }

  // Update user's last reading time
  async updateLastReading(userId) {
    const timestamp = this.getCurrentTimestamp();
    const sql =
      this.dbType === "postgresql"
        ? `INSERT INTO users (user_id, last_reading, reading_count, created_at)
               VALUES ($1, $2, 1, $2)
               ON CONFLICT (user_id)
               DO UPDATE SET last_reading = $2, reading_count = users.reading_count + 1`
        : `INSERT OR REPLACE INTO users (user_id, last_reading, reading_count, created_at)
               VALUES (?, ?, COALESCE((SELECT reading_count FROM users WHERE user_id = ?), 0) + 1, ?)`;

    const params =
      this.dbType === "postgresql"
        ? [userId, timestamp]
        : [userId, timestamp, userId, timestamp];

    return await this.query(sql, params);
  }

  // Get user's reading count for today
  async getTodayReadingCount(userId) {
    const today = moment()
      .tz(this.timezone)
      .startOf("day")
      .format("YYYY-MM-DD HH:mm:ss");

    const sql =
      this.dbType === "postgresql"
        ? "SELECT COUNT(*) as count FROM readings WHERE user_id = $1 AND created_at >= $2"
        : "SELECT COUNT(*) as count FROM readings WHERE user_id = ? AND created_at >= ?";

    const result = await this.query(sql, [userId, today]);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];

    return parseInt(row.count) || 0;
  }

  // Save a reading to the database
  async saveReading(userId, guildId, readingType, cards) {
    const timestamp = this.getCurrentTimestamp();
    const cardsJson = JSON.stringify(cards);

    const sql =
      this.dbType === "postgresql"
        ? "INSERT INTO readings (user_id, guild_id, reading_type, cards, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id"
        : "INSERT INTO readings (user_id, guild_id, reading_type, cards, created_at) VALUES (?, ?, ?, ?, ?)";

    const result = await this.query(sql, [
      userId,
      guildId,
      readingType,
      cardsJson,
      timestamp,
    ]);

    return this.dbType === "postgresql" ? result.rows[0].id : result.insertId;
  }

  // Store analytics data
  async storeAnalytics(eventType, userId, guildId, data) {
    const timestamp = this.getCurrentTimestamp();
    const dataJson = JSON.stringify(data);

    const sql =
      this.dbType === "postgresql"
        ? "INSERT INTO analytics (event_type, user_id, guild_id, data, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id"
        : "INSERT INTO analytics (event_type, user_id, guild_id, data, created_at) VALUES (?, ?, ?, ?, ?)";

    const result = await this.query(sql, [
      eventType,
      userId,
      guildId,
      dataJson,
      timestamp,
    ]);

    return this.dbType === "postgresql" ? result.rows[0].id : result.insertId;
  }

  // Get server reading count
  async getServerReadingCount(guildId, since = null) {
    let sql =
      this.dbType === "postgresql"
        ? "SELECT COUNT(*) as count FROM readings WHERE guild_id = $1"
        : "SELECT COUNT(*) as count FROM readings WHERE guild_id = ?";

    const params = [guildId];

    if (since) {
      sql +=
        this.dbType === "postgresql"
          ? " AND created_at >= $2"
          : " AND created_at >= ?";
      params.push(since);
    }

    const result = await this.query(sql, params);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];

    return parseInt(row.count) || 0;
  }

  // Close database connection
  async close() {
    if (this.dbType === "postgresql" && this.pool) {
      await this.pool.end();
      logger.info("PostgreSQL connection pool closed");
    } else if (this.dbType === "sqlite" && this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            logger.error("Error closing SQLite database:", err);
          } else {
            logger.info("SQLite database connection closed");
          }
          resolve();
        });
      });
    }
  }

  // Test database connection
  async testConnection() {
    try {
      const sql =
        this.dbType === "postgresql"
          ? "SELECT NOW() as current_time"
          : 'SELECT datetime("now") as current_time';
      const result = await this.query(sql);
      const row =
        this.dbType === "postgresql" ? result.rows[0] : result.rows[0];

      logger.success("Database connection test successful", {
        dbType: this.dbType,
        currentTime: row.current_time,
        timezone: this.timezone,
      });

      return true;
    } catch (error) {
      logger.error("Database connection test failed:", error);
      return false;
    }
  }

  // Journal-related methods
  async getUserReadings(userId, limit = 10, offset = 0) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM readings WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
        : "SELECT * FROM readings WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?";

    const result = await this.query(sql, [userId, limit, offset]);
    return this.dbType === "postgresql" ? result.rows : result.rows;
  }

  async getUserReadingCount(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT COUNT(*) as count FROM readings WHERE user_id = $1"
        : "SELECT COUNT(*) as count FROM readings WHERE user_id = ?";

    const result = await this.query(sql, [userId]);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];
    return parseInt(row.count) || 0;
  }

  async getMostRecentReading(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM readings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1"
        : "SELECT * FROM readings WHERE user_id = ? ORDER BY created_at DESC LIMIT 1";

    const result = await this.query(sql, [userId]);
    return this.dbType === "postgresql" ? result.rows[0] : result.rows[0];
  }

  async addReadingNote(readingId, note) {
    const sql =
      this.dbType === "postgresql"
        ? "UPDATE readings SET notes = $1 WHERE id = $2"
        : "UPDATE readings SET notes = ? WHERE id = ?";

    return await this.query(sql, [note, readingId]);
  }

  async searchUserReadings(userId, query) {
    const sql =
      this.dbType === "postgresql"
        ? `SELECT * FROM readings WHERE user_id = $1 AND (
                LOWER(reading_type) LIKE LOWER($2) OR
                LOWER(cards_drawn) LIKE LOWER($2) OR
                LOWER(notes) LIKE LOWER($2)
               ) ORDER BY created_at DESC LIMIT 20`
        : `SELECT * FROM readings WHERE user_id = ? AND (
                LOWER(reading_type) LIKE LOWER(?) OR
                LOWER(cards) LIKE LOWER(?) OR
                LOWER(notes) LIKE LOWER(?)
               ) ORDER BY created_at DESC LIMIT 20`;

    const searchTerm = `%${query}%`;
    const params =
      this.dbType === "postgresql"
        ? [userId, searchTerm]
        : [userId, searchTerm, searchTerm, searchTerm];

    const result = await this.query(sql, params);
    return this.dbType === "postgresql" ? result.rows : result.rows;
  }

  async getAllUserReadings(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM readings WHERE user_id = $1 ORDER BY created_at DESC"
        : "SELECT * FROM readings WHERE user_id = ? ORDER BY created_at DESC";

    const result = await this.query(sql, [userId]);
    return this.dbType === "postgresql" ? result.rows : result.rows;
  }

  async getUserJournalStats(userId) {
    const sql =
      this.dbType === "postgresql"
        ? `SELECT
                COUNT(*) as total_readings,
                COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END) as readings_with_notes,
                MIN(created_at) as first_reading,
                MAX(created_at) as last_reading,
                COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as this_month
               FROM readings WHERE user_id = $1`
        : `SELECT
                COUNT(*) as total_readings,
                COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END) as readings_with_notes,
                MIN(created_at) as first_reading,
                MAX(created_at) as last_reading,
                COUNT(CASE WHEN created_at >= date('now', 'start of month') THEN 1 END) as this_month
               FROM readings WHERE user_id = ?`;

    const result = await this.query(sql, [userId]);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];

    // Get favorite spread
    const favoriteSql =
      this.dbType === "postgresql"
        ? "SELECT reading_type, COUNT(*) as count FROM readings WHERE user_id = $1 GROUP BY reading_type ORDER BY count DESC LIMIT 1"
        : "SELECT reading_type, COUNT(*) as count FROM readings WHERE user_id = ? GROUP BY reading_type ORDER BY count DESC LIMIT 1";

    const favoriteResult = await this.query(favoriteSql, [userId]);
    const favoriteRow =
      this.dbType === "postgresql"
        ? favoriteResult.rows[0]
        : favoriteResult.rows[0];

    return {
      totalReadings: parseInt(row.total_readings) || 0,
      readingsWithNotes: parseInt(row.readings_with_notes) || 0,
      firstReading: row.first_reading,
      lastReading: row.last_reading,
      thisMonth: parseInt(row.this_month) || 0,
      favoriteSpread: favoriteRow ? favoriteRow.reading_type : null,
    };
  }

  // Reminder-related methods
  async setUserReminder(userId, reminderType, schedule, customMessage = null) {
    const timestamp = this.getCurrentTimestamp();
    const sql =
      this.dbType === "postgresql"
        ? `INSERT INTO reminders (user_id, reminder_type, schedule, custom_message, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, reminder_type)
         DO UPDATE SET schedule = $3, custom_message = $4, created_at = $5`
        : `INSERT OR REPLACE INTO reminders (user_id, reminder_type, schedule, custom_message, created_at)
         VALUES (?, ?, ?, ?, ?)`;

    return await this.query(sql, [
      userId,
      reminderType,
      schedule,
      customMessage,
      timestamp,
    ]);
  }

  async getUserReminders(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM reminders WHERE user_id = $1 ORDER BY created_at DESC"
        : "SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC";

    const result = await this.query(sql, [userId]);
    return this.dbType === "postgresql" ? result.rows : result.rows;
  }

  async removeUserReminder(userId, reminderType) {
    const sql =
      this.dbType === "postgresql"
        ? "DELETE FROM reminders WHERE user_id = $1 AND reminder_type = $2"
        : "DELETE FROM reminders WHERE user_id = ? AND reminder_type = ?";

    const result = await this.query(sql, [userId, reminderType]);
    return result.rowCount > 0;
  }

  async removeAllUserReminders(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "DELETE FROM reminders WHERE user_id = $1"
        : "DELETE FROM reminders WHERE user_id = ?";

    return await this.query(sql, [userId]);
  }

  async getAllActiveReminders() {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM reminders ORDER BY created_at DESC"
        : "SELECT * FROM reminders ORDER BY created_at DESC";

    const result = await this.query(sql);
    return this.dbType === "postgresql" ? result.rows : result.rows;
  }

  // Oracle reading methods
  async getDailyOracleReading(userId, date) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM readings WHERE user_id = $1 AND reading_type LIKE $2 AND DATE(created_at) = $3"
        : "SELECT * FROM readings WHERE user_id = ? AND reading_type LIKE ? AND DATE(created_at) = ?";

    const result = await this.query(sql, [userId, "oracle:%:daily", date]);
    return this.dbType === "postgresql" ? result.rows[0] : result.rows[0];
  }

  // Rune reading methods
  async getDailyRuneReading(userId, date) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM readings WHERE user_id = $1 AND reading_type = $2 AND DATE(created_at) = $3"
        : "SELECT * FROM readings WHERE user_id = ? AND reading_type = ? AND DATE(created_at) = ?";

    const result = await this.query(sql, [userId, "runes:daily", date]);
    return this.dbType === "postgresql" ? result.rows[0] : result.rows[0];
  }

  // I Ching reading methods
  async getDailyIChingReading(userId, date) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM readings WHERE user_id = $1 AND reading_type = $2 AND DATE(created_at) = $3"
        : "SELECT * FROM readings WHERE user_id = ? AND reading_type = ? AND DATE(created_at) = ?";

    const result = await this.query(sql, [userId, "iching:daily", date]);
    return this.dbType === "postgresql" ? result.rows[0] : result.rows[0];
  }

  // User preferences methods
  async getUserPreferences(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM user_preferences WHERE user_id = $1"
        : "SELECT * FROM user_preferences WHERE user_id = ?";

    const result = await this.query(sql, [userId]);
    return this.dbType === "postgresql" ? result.rows[0] : result.rows[0];
  }

  async setUserPreference(userId, key, value) {
    const timestamp = this.getCurrentTimestamp();
    const sql =
      this.dbType === "postgresql"
        ? `INSERT INTO user_preferences (user_id, ${key}, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET ${key} = $2, updated_at = $3`
        : `INSERT OR REPLACE INTO user_preferences (user_id, ${key}, updated_at)
         VALUES (?, ?, ?)`;

    return await this.query(sql, [userId, value, timestamp]);
  }

  // Card statistics methods
  async getUserCardStats(userId) {
    const sql =
      this.dbType === "postgresql"
        ? `SELECT
          COUNT(DISTINCT cards_drawn) as unique_cards,
          COUNT(*) as total_readings,
          COUNT(CASE WHEN reading_type = 'daily' THEN 1 END) as daily_readings,
          COUNT(CASE WHEN cards_drawn LIKE '%Major%' THEN 1 END) as major_arcana_count
         FROM readings WHERE user_id = $1`
        : `SELECT
          COUNT(DISTINCT cards) as unique_cards,
          COUNT(*) as total_readings,
          COUNT(CASE WHEN reading_type = 'daily' THEN 1 END) as daily_readings,
          COUNT(CASE WHEN cards LIKE '%Major%' THEN 1 END) as major_arcana_count
         FROM readings WHERE user_id = ?`;

    const result = await this.query(sql, [userId]);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];

    return {
      uniqueCards: parseInt(row.unique_cards) || 0,
      totalReadings: parseInt(row.total_readings) || 0,
      dailyReadings: parseInt(row.daily_readings) || 0,
      majorArcanaCount: parseInt(row.major_arcana_count) || 0,
    };
  }

  // Favorites methods
  async getUserFavorites(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC"
        : "SELECT * FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC";

    const result = await this.query(sql, [userId]);
    return this.dbType === "postgresql" ? result.rows : result.rows;
  }

  async addUserFavorite(userId, cardName) {
    const timestamp = this.getCurrentTimestamp();
    const sql =
      this.dbType === "postgresql"
        ? "INSERT INTO user_favorites (user_id, card_name, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING"
        : "INSERT OR IGNORE INTO user_favorites (user_id, card_name, created_at) VALUES (?, ?, ?)";

    const result = await this.query(sql, [userId, cardName, timestamp]);
    return result.rowCount > 0 || result.changes > 0;
  }

  async removeUserFavorite(userId, cardName) {
    const sql =
      this.dbType === "postgresql"
        ? "DELETE FROM user_favorites WHERE user_id = $1 AND card_name = $2"
        : "DELETE FROM user_favorites WHERE user_id = ? AND card_name = ?";

    const result = await this.query(sql, [userId, cardName]);
    return result.rowCount > 0 || result.changes > 0;
  }

  async unlockThemes(userId, themes) {
    const preferences = (await this.getUserPreferences(userId)) || {};
    const currentThemes = preferences.unlocked_themes || ["classic"];
    const newThemes = [...new Set([...currentThemes, ...themes])];

    return await this.setUserPreference(
      userId,
      "unlocked_themes",
      JSON.stringify(newThemes)
    );
  }
}

module.exports = DatabaseManager;
