#!/usr/bin/env node

/**
 * Migration script for Discord Tarot Bot v2.1.0
 * Adds new features: journal notes, reminders, and enhanced database schema
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
require('dotenv').config();

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ✅ ${msg}`),
  error: (msg) => console.error(`[ERROR] ❌ ${msg}`),
  warn: (msg) => console.warn(`[WARN] ⚠️ ${msg}`)
};

class MigrationManager {
  constructor() {
    this.dbType = process.env.DATABASE_TYPE || 'sqlite';
    this.dbPath = process.env.DATABASE_PATH || './database/tarot.db';
  }

  async run() {
    logger.info('Starting migration to v2.1.0...');
    
    try {
      if (this.dbType === 'postgresql') {
        await this.migratePostgreSQL();
      } else {
        await this.migrateSQLite();
      }
      
      logger.success('Migration completed successfully!');
      logger.info('Your Discord Tarot Bot is now ready for v2.1.0 features:');
      logger.info('- 📖 Personal Reading Journal');
      logger.info('- ⏰ Smart Reminder System');
      logger.info('- 🌙 Astrology Integration');
      logger.info('- 💎 Crystal & Meditation Enhancements');
      
    } catch (error) {
      logger.error(`Migration failed: ${error.message}`);
      process.exit(1);
    }
  }

  async migrateSQLite() {
    logger.info('Migrating SQLite database...');
    
    // Create backup
    await this.createBackup();
    
    const db = new sqlite3.Database(this.dbPath);
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Add notes column to readings table if it doesn't exist
        db.run(`
          ALTER TABLE readings ADD COLUMN notes TEXT;
        `, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            logger.error(`Failed to add notes column: ${err.message}`);
          } else {
            logger.success('Added notes column to readings table');
          }
        });

        // Create reminders table
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
        `, (err) => {
          if (err) {
            logger.error(`Failed to create reminders table: ${err.message}`);
          } else {
            logger.success('Created reminders table');
          }
        });

        // Create indexes
        db.run(`CREATE INDEX IF NOT EXISTS idx_readings_notes ON readings(notes)`, (err) => {
          if (err) logger.warn(`Index creation warning: ${err.message}`);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id)`, (err) => {
          if (err) logger.warn(`Index creation warning: ${err.message}`);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type)`, (err) => {
          if (err) logger.warn(`Index creation warning: ${err.message}`);
          
          // Close database and resolve
          db.close((err) => {
            if (err) {
              reject(err);
            } else {
              logger.success('SQLite migration completed');
              resolve();
            }
          });
        });
      });
    });
  }

  async migratePostgreSQL() {
    logger.info('Migrating PostgreSQL database...');
    
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });

    try {
      // Add notes column to readings table if it doesn't exist
      try {
        await pool.query('ALTER TABLE readings ADD COLUMN notes TEXT');
        logger.success('Added notes column to readings table');
      } catch (err) {
        if (err.code === '42701') { // Column already exists
          logger.info('Notes column already exists');
        } else {
          throw err;
        }
      }

      // Create reminders table
      await pool.query(`
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
      logger.success('Created reminders table');

      // Create indexes
      await pool.query('CREATE INDEX IF NOT EXISTS idx_readings_notes ON readings(notes)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active)');
      logger.success('Created database indexes');

      // Create trigger for updated_at
      await pool.query(`
        DROP TRIGGER IF EXISTS update_reminders_updated_at ON reminders;
        CREATE TRIGGER update_reminders_updated_at 
          BEFORE UPDATE ON reminders 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
      `);
      logger.success('Created database triggers');

    } finally {
      await pool.end();
    }
  }

  async createBackup() {
    if (this.dbType === 'sqlite' && fs.existsSync(this.dbPath)) {
      const backupPath = `${this.dbPath}.backup-v2.1.0-${Date.now()}`;
      fs.copyFileSync(this.dbPath, backupPath);
      logger.success(`Database backup created: ${backupPath}`);
    }
  }

  async verifyMigration() {
    logger.info('Verifying migration...');
    
    if (this.dbType === 'postgresql') {
      const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
      });

      try {
        // Check if notes column exists
        const notesCheck = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'readings' AND column_name = 'notes'
        `);
        
        // Check if reminders table exists
        const remindersCheck = await pool.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_name = 'reminders'
        `);

        if (notesCheck.rows.length > 0 && remindersCheck.rows.length > 0) {
          logger.success('Migration verification passed');
        } else {
          throw new Error('Migration verification failed');
        }
      } finally {
        await pool.end();
      }
    } else {
      // SQLite verification
      const db = new sqlite3.Database(this.dbPath);
      
      return new Promise((resolve, reject) => {
        db.get("PRAGMA table_info(readings)", (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='reminders'", (err, row) => {
            db.close();
            
            if (err) {
              reject(err);
            } else if (row) {
              logger.success('Migration verification passed');
              resolve();
            } else {
              reject(new Error('Migration verification failed'));
            }
          });
        });
      });
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new MigrationManager();
  migration.run()
    .then(() => {
      logger.info('🔮 Your Discord Tarot Bot is ready for the mystical enhancements!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Migration failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = MigrationManager;
