const DatabaseManager = require('../src/database/DatabaseManager');
const logger = require('../src/utils/logger');

async function migrateGamificationTables() {
  // Force SQLite for this migration if no database URL is provided
  if (!process.env.DATABASE_URL && !process.env.DATABASE_TYPE) {
    process.env.DATABASE_TYPE = 'sqlite';
    process.env.DB_PATH = './database/tarot.db';
  }
  
  const db = new DatabaseManager();
  
  try {
    logger.info('Starting gamification tables migration...');
    
    if (db.dbType === 'postgresql') {
      await migratePostgreSQLGamification(db);
    } else if (db.dbType === 'sqlite') {
      await migrateSQLiteGamification(db);
    }
    
    logger.success('Gamification tables migration completed successfully!');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

async function migratePostgreSQLGamification(db) {
  logger.info('Migrating PostgreSQL gamification tables...');
  
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
  
  // Create indexes
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_streaks_date ON user_streaks(last_reading_date)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_daily_quests_user ON daily_quests(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_daily_quests_date ON daily_quests(quest_date)');
  
  // Create update triggers
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
  
  logger.info('PostgreSQL gamification tables created successfully');
}

async function migrateSQLiteGamification(db) {
  logger.info('Migrating SQLite gamification tables...');
  
  // Create user streaks table
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_streaks (
      user_id TEXT PRIMARY KEY,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_reading_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create user achievements table
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id)
    )
  `);
  
  // Create daily quests table
  await db.query(`
    CREATE TABLE IF NOT EXISTS daily_quests (
      user_id TEXT PRIMARY KEY,
      quest_id TEXT NOT NULL,
      quest_name TEXT NOT NULL,
      quest_description TEXT NOT NULL,
      quest_reward TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      target INTEGER NOT NULL,
      completed BOOLEAN DEFAULT 0,
      quest_date DATE DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_streaks_date ON user_streaks(last_reading_date)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_daily_quests_user ON daily_quests(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_daily_quests_date ON daily_quests(quest_date)');
  
  logger.info('SQLite gamification tables created successfully');
}

// Run migration if called directly
if (require.main === module) {
  migrateGamificationTables()
    .then(() => {
      console.log('✅ Gamification migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateGamificationTables };
