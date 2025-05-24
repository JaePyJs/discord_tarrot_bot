const Database = require('../database/database');
const logger = require('./logger');

class AnalyticsManager {
    constructor() {
        this.enabled = process.env.ENABLE_ANALYTICS === 'true';
        this.webhookUrl = process.env.ANALYTICS_WEBHOOK_URL;
        this.retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 90;
    }

    // Track reading event
    async trackReading(userId, guildId, readingType, cards, executionTime) {
        if (!this.enabled) return;

        try {
            const db = new Database();
            
            // Store analytics data
            await this.storeAnalytics(db, {
                event_type: 'reading',
                user_id: userId,
                guild_id: guildId,
                data: {
                    reading_type: readingType,
                    card_count: cards.length,
                    execution_time: executionTime,
                    cards_drawn: cards.map(card => ({
                        name: card.name,
                        arcana: card.arcana,
                        suit: card.suit || null,
                        is_reversed: card.isReversed
                    }))
                }
            });

            db.close();
            
            logger.debug('Reading analytics tracked', {
                userId,
                guildId,
                readingType,
                executionTime
            });

        } catch (error) {
            logger.error('Failed to track reading analytics', error);
        }
    }

    // Track command usage
    async trackCommand(commandName, userId, guildId, success, executionTime, error = null) {
        if (!this.enabled) return;

        try {
            const db = new Database();
            
            await this.storeAnalytics(db, {
                event_type: 'command',
                user_id: userId,
                guild_id: guildId,
                data: {
                    command: commandName,
                    success,
                    execution_time: executionTime,
                    error: error ? error.message : null
                }
            });

            db.close();

        } catch (error) {
            logger.error('Failed to track command analytics', error);
        }
    }

    // Track user engagement
    async trackEngagement(userId, guildId, engagementType, metadata = {}) {
        if (!this.enabled) return;

        try {
            const db = new Database();
            
            await this.storeAnalytics(db, {
                event_type: 'engagement',
                user_id: userId,
                guild_id: guildId,
                data: {
                    engagement_type: engagementType,
                    ...metadata
                }
            });

            db.close();

        } catch (error) {
            logger.error('Failed to track engagement analytics', error);
        }
    }

    // Store analytics data
    async storeAnalytics(db, analyticsData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO analytics (
                    event_type, user_id, guild_id, data, created_at
                ) VALUES (?, ?, ?, ?, ?)
            `;
            
            const now = new Date().toISOString();
            const dataJson = JSON.stringify(analyticsData.data);

            db.db.run(query, [
                analyticsData.event_type,
                analyticsData.user_id,
                analyticsData.guild_id,
                dataJson,
                now
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Generate daily analytics report
    async generateDailyReport() {
        if (!this.enabled) return null;

        try {
            const db = new Database();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // Get today's statistics
            const stats = await this.getDailyStats(db, todayISO);
            
            db.close();

            const report = {
                date: today.toDateString(),
                totalReadings: stats.readings,
                totalCommands: stats.commands,
                uniqueUsers: stats.uniqueUsers,
                uniqueServers: stats.uniqueServers,
                popularSpreads: stats.popularSpreads,
                averageExecutionTime: stats.avgExecutionTime,
                errorRate: stats.errorRate
            };

            // Send to webhook if configured
            if (this.webhookUrl) {
                await this.sendWebhookReport(report);
            }

            logger.info('Daily analytics report generated', report);
            return report;

        } catch (error) {
            logger.error('Failed to generate daily report', error);
            return null;
        }
    }

    // Get daily statistics
    async getDailyStats(db, since) {
        const queries = {
            readings: `SELECT COUNT(*) as count FROM analytics WHERE event_type = 'reading' AND created_at >= ?`,
            commands: `SELECT COUNT(*) as count FROM analytics WHERE event_type = 'command' AND created_at >= ?`,
            uniqueUsers: `SELECT COUNT(DISTINCT user_id) as count FROM analytics WHERE created_at >= ?`,
            uniqueServers: `SELECT COUNT(DISTINCT guild_id) as count FROM analytics WHERE created_at >= ?`,
            popularSpreads: `
                SELECT JSON_EXTRACT(data, '$.reading_type') as spread, COUNT(*) as count 
                FROM analytics 
                WHERE event_type = 'reading' AND created_at >= ? 
                GROUP BY JSON_EXTRACT(data, '$.reading_type') 
                ORDER BY count DESC 
                LIMIT 3
            `,
            avgExecutionTime: `
                SELECT AVG(CAST(JSON_EXTRACT(data, '$.execution_time') AS REAL)) as avg_time 
                FROM analytics 
                WHERE event_type = 'reading' AND created_at >= ?
            `,
            errorRate: `
                SELECT 
                    (SUM(CASE WHEN JSON_EXTRACT(data, '$.success') = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as error_rate
                FROM analytics 
                WHERE event_type = 'command' AND created_at >= ?
            `
        };

        const results = {};
        
        for (const [key, query] of Object.entries(queries)) {
            results[key] = await new Promise((resolve, reject) => {
                db.db.get(query, [since], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }

        return {
            readings: results.readings.count,
            commands: results.commands.count,
            uniqueUsers: results.uniqueUsers.count,
            uniqueServers: results.uniqueServers.count,
            popularSpreads: results.popularSpreads,
            avgExecutionTime: Math.round(results.avgExecutionTime?.avg_time || 0),
            errorRate: Math.round(results.errorRate?.error_rate || 0)
        };
    }

    // Send webhook report
    async sendWebhookReport(report) {
        try {
            const embed = {
                title: '📊 Daily Tarot Bot Analytics',
                description: `Analytics report for ${report.date}`,
                color: 0x4B0082,
                fields: [
                    {
                        name: '🔮 Total Readings',
                        value: report.totalReadings.toString(),
                        inline: true
                    },
                    {
                        name: '⚡ Total Commands',
                        value: report.totalCommands.toString(),
                        inline: true
                    },
                    {
                        name: '👥 Unique Users',
                        value: report.uniqueUsers.toString(),
                        inline: true
                    },
                    {
                        name: '🏠 Unique Servers',
                        value: report.uniqueServers.toString(),
                        inline: true
                    },
                    {
                        name: '⏱️ Avg Response Time',
                        value: `${report.averageExecutionTime}ms`,
                        inline: true
                    },
                    {
                        name: '❌ Error Rate',
                        value: `${report.errorRate}%`,
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Tarot Bot Analytics'
                }
            };

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ embeds: [embed] })
            });

            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.status}`);
            }

        } catch (error) {
            logger.error('Failed to send webhook report', error);
        }
    }

    // Clean old analytics data
    async cleanOldData() {
        if (!this.enabled) return;

        try {
            const db = new Database();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
            const cutoffISO = cutoffDate.toISOString();

            const result = await new Promise((resolve, reject) => {
                const query = 'DELETE FROM analytics WHERE created_at < ?';
                db.db.run(query, [cutoffISO], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });

            db.close();

            logger.info(`Cleaned ${result} old analytics records`, {
                cutoffDate: cutoffDate.toDateString(),
                retentionDays: this.retentionDays
            });

        } catch (error) {
            logger.error('Failed to clean old analytics data', error);
        }
    }
}

module.exports = new AnalyticsManager();
