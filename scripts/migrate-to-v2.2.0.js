#!/usr/bin/env node

/**
 * Migration script for Discord Tarot Bot v2.2.0
 * Adds advanced features: custom spreads, user preferences, favorites, and divination methods
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

class MigrationManagerV2_2_0 {
  constructor() {
    this.dbType = process.env.DATABASE_TYPE || 'sqlite';
    this.dbPath = process.env.DATABASE_PATH || './database/tarot.db';
  }

  async run() {
    logger.info('Starting migration to v2.2.0...');
    
    try {
      if (this.dbType === 'postgresql') {
        await this.migratePostgreSQL();
      } else {
        await this.migrateSQLite();
      }
      
      logger.success('Migration completed successfully!');
      logger.info('Your Discord Tarot Bot is now ready for v2.2.0 features:');
      logger.info('- 🎨 Custom Spread Creator');
      logger.info('- 🔮 Oracle Cards, Runes, and I Ching');
      logger.info('- 🎯 Advanced Analytics');
      logger.info('- 🎨 Deck Customization');
      logger.info('- 🤖 AI-Enhanced Interpretations');
      logger.info('- 🌍 Multi-language Support');
      logger.info('- 📱 Interactive Reading Experience');
      
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
        // Create custom spreads table
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
        `, (err) => {
          if (err) {
            logger.error(`Failed to create custom_spreads table: ${err.message}`);
          } else {
            logger.success('Created custom_spreads table');
          }
        });

        // Create user preferences table
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
        `, (err) => {
          if (err) {
            logger.error(`Failed to create user_preferences table: ${err.message}`);
          } else {
            logger.success('Created user_preferences table');
          }
        });

        // Create user favorites table
        db.run(`
          CREATE TABLE IF NOT EXISTS user_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            card_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, card_name)
          )
        `, (err) => {
          if (err) {
            logger.error(`Failed to create user_favorites table: ${err.message}`);
          } else {
            logger.success('Created user_favorites table');
          }
        });

        // Create indexes
        const indexes = [
          'CREATE INDEX IF NOT EXISTS idx_custom_spreads_user ON custom_spreads(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_custom_spreads_public ON custom_spreads(is_public)',
          'CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_user_favorites_card ON user_favorites(card_name)'
        ];

        let indexCount = 0;
        indexes.forEach((indexSql, i) => {
          db.run(indexSql, (err) => {
            if (err) logger.warn(`Index creation warning: ${err.message}`);
            indexCount++;
            
            if (indexCount === indexes.length) {
              // Close database and resolve
              db.close((err) => {
                if (err) {
                  reject(err);
                } else {
                  logger.success('SQLite migration completed');
                  resolve();
                }
              });
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
      // Create custom spreads table
      await pool.query(`
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
      logger.success('Created custom_spreads table');

      // Create user preferences table
      await pool.query(`
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
      `);
      logger.success('Created user_preferences table');

      // Create user favorites table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_favorites (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(20) NOT NULL,
          card_name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, card_name)
        )
      `);
      logger.success('Created user_favorites table');

      // Create indexes
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_custom_spreads_user ON custom_spreads(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_custom_spreads_public ON custom_spreads(is_public)',
        'CREATE INDEX IF NOT EXISTS idx_custom_spreads_name ON custom_spreads(name)',
        'CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_favorites_card ON user_favorites(card_name)'
      ];

      for (const indexSql of indexes) {
        await pool.query(indexSql);
      }
      logger.success('Created database indexes');

      // Create triggers for updated_at
      await pool.query(`
        DROP TRIGGER IF EXISTS update_custom_spreads_updated_at ON custom_spreads;
        CREATE TRIGGER update_custom_spreads_updated_at 
          BEFORE UPDATE ON custom_spreads 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
      `);

      await pool.query(`
        DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
        CREATE TRIGGER update_user_preferences_updated_at 
          BEFORE UPDATE ON user_preferences 
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
      const backupPath = `${this.dbPath}.backup-v2.2.0-${Date.now()}`;
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
        // Check if new tables exist
        const tables = ['custom_spreads', 'user_preferences', 'user_favorites'];
        
        for (const table of tables) {
          const result = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name = $1
          `, [table]);
          
          if (result.rows.length === 0) {
            throw new Error(`Table ${table} not found`);
          }
        }

        logger.success('Migration verification passed');
      } finally {
        await pool.end();
      }
    } else {
      // SQLite verification
      const db = new sqlite3.Database(this.dbPath);
      
      return new Promise((resolve, reject) => {
        const tables = ['custom_spreads', 'user_preferences', 'user_favorites'];
        let checkedTables = 0;
        
        tables.forEach(table => {
          db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table], (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            
            if (!row) {
              reject(new Error(`Table ${table} not found`));
              return;
            }
            
            checkedTables++;
            if (checkedTables === tables.length) {
              db.close();
              logger.success('Migration verification passed');
              resolve();
            }
          });
        });
      });
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new MigrationManagerV2_2_0();
  migration.run()
    .then(() => migration.verifyMigration())
    .then(() => {
      logger.info('🔮 Your Discord Tarot Bot is ready for the advanced mystical features!');
      logger.info('');
      logger.info('New features available:');
      logger.info('🎨 /spread - Create and use custom spreads');
      logger.info('🔮 /oracle - Oracle card readings');
      logger.info('⚡ /runes - Norse rune castings');
      logger.info('☯️ /iching - I Ching consultations');
      logger.info('🎯 /deck - Deck customization and themes');
      logger.info('📊 /analytics - Advanced reading analytics');
      logger.info('');
      logger.info('Don\'t forget to run: npm run deploy-commands');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Migration failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = MigrationManagerV2_2_0;
