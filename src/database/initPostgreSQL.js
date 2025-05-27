const DatabaseManager = require("./DatabaseManager");
const logger = require("../utils/logger");

async function initializePostgreSQLSchema() {
  const db = new DatabaseManager();

  try {
    // Test connection first
    const connectionTest = await db.testConnection();
    if (!connectionTest) {
      throw new Error("Database connection test failed");
    }

    logger.info("Initializing PostgreSQL schema...");

    // Create users table
    await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id VARCHAR(20) PRIMARY KEY,
                last_reading TIMESTAMP WITH TIME ZONE,
                reading_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create readings table (enhanced with notes)
    await db.query(`
            CREATE TABLE IF NOT EXISTS readings (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                guild_id VARCHAR(20),
                reading_type VARCHAR(50) NOT NULL,
                cards JSONB NOT NULL,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create user_preferences table
    await db.query(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id VARCHAR(20) PRIMARY KEY,
                favorite_deck VARCHAR(50) DEFAULT 'rider-waite',
                daily_notifications BOOLEAN DEFAULT FALSE,
                preferred_spread VARCHAR(50),
                timezone VARCHAR(50) DEFAULT 'Asia/Manila',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create server_settings table
    await db.query(`
            CREATE TABLE IF NOT EXISTS server_settings (
                guild_id VARCHAR(20) PRIMARY KEY,
                reading_channel VARCHAR(20),
                daily_card_enabled BOOLEAN DEFAULT FALSE,
                daily_card_time VARCHAR(10) DEFAULT '09:00',
                max_readings_per_day INTEGER DEFAULT 10,
                cooldown_seconds INTEGER DEFAULT 30,
                timezone VARCHAR(50) DEFAULT 'Asia/Manila',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create analytics table
    await db.query(`
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                user_id VARCHAR(20),
                guild_id VARCHAR(20),
                data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create reminders table for scheduled reading reminders
    await db.query(`
            CREATE TABLE IF NOT EXISTS reminders (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                reminder_type VARCHAR(20) NOT NULL,
                schedule VARCHAR(50) NOT NULL,
                custom_message TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, reminder_type)
            )
        `);

    // Create custom spreads table
    await db.query(`
            CREATE TABLE IF NOT EXISTS custom_spreads (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                card_count INTEGER NOT NULL,
                positions JSONB NOT NULL,
                is_public BOOLEAN DEFAULT FALSE,
                creator_name VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, name)
            )
        `);

    // Create user preferences table
    await db.query(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL UNIQUE,
                deck_theme VARCHAR(50) DEFAULT 'classic',
                reading_style VARCHAR(20) DEFAULT 'detailed',
                allow_reversed BOOLEAN DEFAULT TRUE,
                ai_insights BOOLEAN DEFAULT TRUE,
                language VARCHAR(10) DEFAULT 'en',
                unlocked_themes JSONB DEFAULT '["classic"]',
                notifications BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);    // Create user favorites table
    await db.query(`
            CREATE TABLE IF NOT EXISTS user_favorites (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                card_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, card_name)
            )
        `);

    // Gamification tables
    // Create user streaks table
    await db.query(`
            CREATE TABLE IF NOT EXISTS user_streaks (
                user_id VARCHAR(20) PRIMARY KEY,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_reading_date DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create user achievements table
    await db.query(`
            CREATE TABLE IF NOT EXISTS user_achievements (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                achievement_id VARCHAR(50) NOT NULL,
                unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, achievement_id)
            )
        `);

    // Create daily quests table
    await db.query(`
            CREATE TABLE IF NOT EXISTS daily_quests (
                user_id VARCHAR(20) PRIMARY KEY,
                quest_id VARCHAR(50) NOT NULL,
                quest_name VARCHAR(200) NOT NULL,
                quest_description TEXT NOT NULL,
                quest_reward VARCHAR(200) NOT NULL,
                progress INTEGER DEFAULT 0,
                target INTEGER NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                quest_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create indexes for better performance
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_users_last_reading ON users(last_reading)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, created_at)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_readings_guild ON readings(guild_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_readings_type ON readings(reading_type)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_analytics_guild_id ON analytics(guild_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_readings_notes ON readings(notes)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_custom_spreads_user ON custom_spreads(user_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_custom_spreads_public ON custom_spreads(is_public)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_custom_spreads_name ON custom_spreads(name)"
    );    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_user_favorites_card ON user_favorites(card_name)"
    );
    // Gamification indexes
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_user_streaks_date ON user_streaks(last_reading_date)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_daily_quests_user ON daily_quests(user_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_daily_quests_date ON daily_quests(quest_date)"
    );

    // Create triggers for updated_at timestamps
    await db.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

    await db.query(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

    await db.query(`
            DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
            CREATE TRIGGER update_user_preferences_updated_at
                BEFORE UPDATE ON user_preferences
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

    await db.query(`
            DROP TRIGGER IF EXISTS update_server_settings_updated_at ON server_settings;
            CREATE TRIGGER update_server_settings_updated_at
                BEFORE UPDATE ON server_settings
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);    await db.query(`
            DROP TRIGGER IF EXISTS update_reminders_updated_at ON reminders;
            CREATE TRIGGER update_reminders_updated_at
                BEFORE UPDATE ON reminders
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

    await db.query(`
            DROP TRIGGER IF EXISTS update_custom_spreads_updated_at ON custom_spreads;
            CREATE TRIGGER update_custom_spreads_updated_at
                BEFORE UPDATE ON custom_spreads
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

    // Gamification triggers
    await db.query(`
            DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON user_streaks;
            CREATE TRIGGER update_user_streaks_updated_at
                BEFORE UPDATE ON user_streaks
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

    await db.query(`
            DROP TRIGGER IF EXISTS update_daily_quests_updated_at ON daily_quests;
            CREATE TRIGGER update_daily_quests_updated_at
                BEFORE UPDATE ON daily_quests
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

    // Create views for analytics
    await db.query(`
            CREATE OR REPLACE VIEW daily_reading_stats AS
            SELECT
                DATE(created_at AT TIME ZONE 'Asia/Manila') as reading_date,
                COUNT(*) as total_readings,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT guild_id) as unique_guilds,
                reading_type,
                COUNT(*) as type_count
            FROM readings
            GROUP BY DATE(created_at AT TIME ZONE 'Asia/Manila'), reading_type
            ORDER BY reading_date DESC, type_count DESC
        `);

    await db.query(`
            CREATE OR REPLACE VIEW user_reading_summary AS
            SELECT
                u.user_id,
                u.reading_count,
                u.last_reading,
                COUNT(r.id) as total_readings,
                MAX(r.created_at) as last_reading_actual,
                MIN(r.created_at) as first_reading,
                ARRAY_AGG(DISTINCT r.reading_type) as reading_types_used
            FROM users u
            LEFT JOIN readings r ON u.user_id = r.user_id
            GROUP BY u.user_id, u.reading_count, u.last_reading
        `);

    logger.success("PostgreSQL schema initialized successfully");

    // Insert default server settings for Philippines timezone
    await db.query(`
            INSERT INTO server_settings (guild_id, timezone, daily_card_time, daily_card_enabled)
            VALUES ('default', 'Asia/Manila', '09:00', FALSE)
            ON CONFLICT (guild_id) DO NOTHING
        `);

    logger.info("Default Philippines timezone settings configured");
  } catch (error) {
    logger.error("Failed to initialize PostgreSQL schema:", error);
    throw error;
  } finally {
    await db.close();
  }
}

// Function to create database and user (run this manually)
function getPostgreSQLSetupCommands() {
  return `
-- Run these commands in PostgreSQL as superuser (postgres):

-- 1. Create database
CREATE DATABASE tarot_bot;

-- 2. Create user
CREATE USER tarot_user WITH PASSWORD 'your_secure_password_here';

-- 3. Grant permissions
GRANT ALL PRIVILEGES ON DATABASE tarot_bot TO tarot_user;

-- 4. Connect to the database
\\c tarot_bot

-- 5. Grant schema permissions
GRANT ALL ON SCHEMA public TO tarot_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tarot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tarot_user;

-- 6. Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tarot_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tarot_user;

-- 7. Set timezone (optional, but recommended)
ALTER DATABASE tarot_bot SET timezone TO 'Asia/Manila';
    `;
}

module.exports = {
  initializePostgreSQLSchema,
  getPostgreSQLSetupCommands,
};
