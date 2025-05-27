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

  // Gamification methods

  // User streak methods
  async getUserStreak(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT current_streak FROM user_streaks WHERE user_id = $1"
        : "SELECT current_streak FROM user_streaks WHERE user_id = ?";

    const result = await this.query(sql, [userId]);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];
    return row ? row.current_streak : 0;
  }

  async updateUserStreak(userId, streak) {
    const timestamp = this.getCurrentTimestamp();
    const date = this.getCurrentDate();

    const sql =
      this.dbType === "postgresql"
        ? `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_reading_date, created_at, updated_at)
           VALUES ($1, $2, $2, $3, $4, $4)
           ON CONFLICT (user_id)
           DO UPDATE SET 
             current_streak = $2,
             longest_streak = GREATEST(user_streaks.longest_streak, $2),
             last_reading_date = $3,
             updated_at = $4`
        : `INSERT OR REPLACE INTO user_streaks (user_id, current_streak, longest_streak, last_reading_date, created_at, updated_at)
           VALUES (?, ?, MAX(COALESCE((SELECT longest_streak FROM user_streaks WHERE user_id = ?), 0), ?), ?, ?, ?)`;

    const params =
      this.dbType === "postgresql"
        ? [userId, streak, date, timestamp]
        : [userId, streak, userId, streak, date, timestamp, timestamp];

    return await this.query(sql, params);
  }

  async getLastReadingDate(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT MAX(created_at) as last_reading FROM readings WHERE user_id = $1"
        : "SELECT MAX(created_at) as last_reading FROM readings WHERE user_id = ?";

    const result = await this.query(sql, [userId]);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];
    return row ? row.last_reading : null;
  }

  // User achievements methods
  async getUserAchievements(userId) {
    const sql =
      this.dbType === "postgresql"
        ? "SELECT achievement_id FROM user_achievements WHERE user_id = $1"
        : "SELECT achievement_id FROM user_achievements WHERE user_id = ?";

    const result = await this.query(sql, [userId]);
    const rows = this.dbType === "postgresql" ? result.rows : result.rows;
    return rows.map((row) => row.achievement_id);
  }

  async addUserAchievement(userId, achievementId) {
    const timestamp = this.getCurrentTimestamp();
    const sql =
      this.dbType === "postgresql"
        ? "INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, achievement_id) DO NOTHING"
        : "INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)";

    return await this.query(sql, [userId, achievementId, timestamp]);
  }

  // Daily quest methods
  async getUserDailyQuest(userId) {
    const today = this.getCurrentDate();
    const sql =
      this.dbType === "postgresql"
        ? "SELECT * FROM daily_quests WHERE user_id = $1 AND quest_date = $2"
        : "SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ?";

    const result = await this.query(sql, [userId, today]);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];

    if (row) {
      return {
        id: row.quest_id,
        name: row.quest_name,
        description: row.quest_description,
        reward: row.quest_reward,
        progress: row.progress,
        target: row.target,
        completed: row.completed,
      };
    }
    return null;
  }

  async setUserDailyQuest(userId, quest) {
    const timestamp = this.getCurrentTimestamp();
    const today = this.getCurrentDate();

    const sql =
      this.dbType === "postgresql"
        ? `INSERT INTO daily_quests (user_id, quest_id, quest_name, quest_description, quest_reward, progress, target, completed, quest_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
           ON CONFLICT (user_id) 
           DO UPDATE SET 
             quest_id = $2, quest_name = $3, quest_description = $4, quest_reward = $5,
             progress = $6, target = $7, completed = $8, quest_date = $9, updated_at = $10`
        : `INSERT OR REPLACE INTO daily_quests (user_id, quest_id, quest_name, quest_description, quest_reward, progress, target, completed, quest_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      userId,
      quest.id,
      quest.name,
      quest.description,
      quest.reward,
      quest.progress,
      quest.target,
      quest.completed ? 1 : 0,
      today,
      timestamp,
    ];

    if (this.dbType === "sqlite") {
      params.push(timestamp);
    }

    return await this.query(sql, params);
  }

  async updateUserDailyQuest(userId, quest) {
    const timestamp = this.getCurrentTimestamp();
    const sql =
      this.dbType === "postgresql"
        ? "UPDATE daily_quests SET progress = $1, completed = $2, updated_at = $3 WHERE user_id = $4"
        : "UPDATE daily_quests SET progress = ?, completed = ?, updated_at = ? WHERE user_id = ?";

    return await this.query(sql, [
      quest.progress,
      quest.completed ? 1 : 0,
      timestamp,
      userId,
    ]);
  }

  async completeUserDailyQuest(userId) {
    const timestamp = this.getCurrentTimestamp();
    const sql =
      this.dbType === "postgresql"
        ? "UPDATE daily_quests SET completed = TRUE, updated_at = $1 WHERE user_id = $2"
        : "UPDATE daily_quests SET completed = 1, updated_at = ? WHERE user_id = ?";

    return await this.query(sql, [timestamp, userId]);
  }

  // Statistics methods for gamification
  async getUserCardStats(userId) {
    const sql =
      this.dbType === "postgresql"
        ? `SELECT 
             COUNT(*) as total_readings,
             COUNT(CASE WHEN reading_type = 'daily' THEN 1 END) as daily_readings,
             COUNT(CASE WHEN reading_type = 'relationship' THEN 1 END) as relationship_readings,
             COUNT(CASE WHEN reading_type = 'three-card' THEN 1 END) as three_card_readings,
             COUNT(CASE WHEN reading_type = 'celtic-cross' THEN 1 END) as celtic_cross_readings
           FROM readings WHERE user_id = $1`
        : `SELECT 
             COUNT(*) as total_readings,
             COUNT(CASE WHEN reading_type = 'daily' THEN 1 END) as daily_readings,
             COUNT(CASE WHEN reading_type = 'relationship' THEN 1 END) as relationship_readings,
             COUNT(CASE WHEN reading_type = 'three-card' THEN 1 END) as three_card_readings,
             COUNT(CASE WHEN reading_type = 'celtic-cross' THEN 1 END) as celtic_cross_readings
           FROM readings WHERE user_id = ?`;

    const result = await this.query(sql, [userId]);
    const row = this.dbType === "postgresql" ? result.rows[0] : result.rows[0];

    // Get current streak
    const currentStreak = await this.getUserStreak(userId);

    return {
      totalReadings: parseInt(row.total_readings) || 0,
      dailyReadings: parseInt(row.daily_readings) || 0,
      relationshipReadings: parseInt(row.relationship_readings) || 0,
      threeCardReadings: parseInt(row.three_card_readings) || 0,
      celticCrossReadings: parseInt(row.celtic_cross_readings) || 0,
      currentStreak: currentStreak,
      // Placeholder values - would need more complex queries for accurate counts
      uniqueCards: 0,
      majorArcanaCount: 0,
      seasonalReadings: 0,
    };
  }
}

module.exports = DatabaseManager;
