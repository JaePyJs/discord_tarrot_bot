const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'tarot.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
            } else {
                console.log('✅ Connected to SQLite database');
            }
        });
    }

    // Get user's last reading time for rate limiting
    async getLastReading(userId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT last_reading FROM users WHERE user_id = ?';
            this.db.get(query, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? new Date(row.last_reading) : null);
                }
            });
        });
    }

    // Update user's last reading time
    async updateLastReading(userId) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const query = `
                INSERT OR REPLACE INTO users (user_id, last_reading, reading_count)
                VALUES (?, ?, COALESCE((SELECT reading_count FROM users WHERE user_id = ?), 0) + 1)
            `;
            this.db.run(query, [userId, now, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Get user's reading count for today
    async getTodayReadingCount(userId) {
        return new Promise((resolve, reject) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            const query = `
                SELECT COUNT(*) as count FROM readings 
                WHERE user_id = ? AND created_at >= ?
            `;
            this.db.get(query, [userId, todayISO], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    // Save a reading to the database
    async saveReading(userId, guildId, readingType, cards) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO readings (user_id, guild_id, reading_type, cards, created_at)
                VALUES (?, ?, ?, ?, ?)
            `;
            const now = new Date().toISOString();
            const cardsJson = JSON.stringify(cards);

            this.db.run(query, [userId, guildId, readingType, cardsJson, now], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Close database connection
    close() {
        return new Promise((resolve) => {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('✅ Database connection closed');
                }
                resolve();
            });
        });
    }
}

module.exports = Database;
