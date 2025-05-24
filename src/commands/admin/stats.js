const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View server-wide tarot reading statistics'),

    async execute(interaction) {
        const guildId = interaction.guild?.id;
        const db = new Database();

        try {
            await interaction.deferReply();

            // Get server statistics
            const stats = await this.getServerStats(db, guildId);
            
            const embed = new EmbedBuilder()
                .setColor(0x4B0082)
                .setTitle(`📊 ${interaction.guild.name} Tarot Statistics`)
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    {
                        name: '🔮 Total Readings',
                        value: stats.totalReadings.toString(),
                        inline: true
                    },
                    {
                        name: '👥 Active Readers',
                        value: stats.activeReaders.toString(),
                        inline: true
                    },
                    {
                        name: '📅 Today\'s Readings',
                        value: stats.todayReadings.toString(),
                        inline: true
                    },
                    {
                        name: '🎯 Most Popular Spread',
                        value: stats.popularSpread || 'No readings yet',
                        inline: false
                    },
                    {
                        name: '📈 Reading Breakdown',
                        value: stats.spreadBreakdown || 'No data available',
                        inline: false
                    }
                )
                .setFooter({ text: 'Server mystical activity summary' })
                .setTimestamp();

            // Add top readers if available
            if (stats.topReaders && stats.topReaders.length > 0) {
                embed.addFields({
                    name: '🏆 Top Readers This Month',
                    value: stats.topReaders.join('\n'),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in stats command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚫 Statistics Unavailable')
                .setDescription('Unable to retrieve server statistics at this time. Please try again later.')
                .setFooter({ text: 'The cosmic analytics are temporarily offline' });

            await interaction.editReply({ embeds: [errorEmbed] });
        } finally {
            db.close();
        }
    },

    async getServerStats(db, guildId) {
        // Get total readings for this server
        const totalReadings = await this.getServerReadingCount(db, guildId);
        
        // Get active readers count
        const activeReaders = await this.getActiveReadersCount(db, guildId);
        
        // Get today's readings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayReadings = await this.getServerReadingCount(db, guildId, today.toISOString());
        
        // Get most popular spread
        const popularSpread = await this.getMostPopularSpread(db, guildId);
        
        // Get spread breakdown
        const spreadBreakdown = await this.getSpreadBreakdown(db, guildId);
        
        // Get top readers this month
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const topReaders = await this.getTopReaders(db, guildId, monthAgo.toISOString());

        return {
            totalReadings,
            activeReaders,
            todayReadings,
            popularSpread,
            spreadBreakdown,
            topReaders
        };
    },

    async getServerReadingCount(db, guildId, since = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT COUNT(*) as count FROM readings WHERE guild_id = ?';
            const params = [guildId];

            if (since) {
                query += ' AND created_at >= ?';
                params.push(since);
            }

            db.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    },

    async getActiveReadersCount(db, guildId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(DISTINCT user_id) as count FROM readings WHERE guild_id = ?';

            db.db.get(query, [guildId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    },

    async getMostPopularSpread(db, guildId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT reading_type, COUNT(*) as count 
                FROM readings 
                WHERE guild_id = ? 
                GROUP BY reading_type 
                ORDER BY count DESC 
                LIMIT 1
            `;

            db.db.get(query, [guildId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        const spreadNames = {
                            'single': 'Single Card',
                            'three-card': 'Three-Card Spread',
                            'celtic-cross': 'Celtic Cross',
                            'horseshoe': 'Horseshoe Spread',
                            'relationship': 'Relationship Spread',
                            'yes-no': 'Yes/No Reading',
                            'daily': 'Daily Card',
                            'career': 'Career Spread'
                        };
                        resolve(`${spreadNames[row.reading_type] || row.reading_type} (${row.count} readings)`);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    },

    async getSpreadBreakdown(db, guildId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT reading_type, COUNT(*) as count 
                FROM readings 
                WHERE guild_id = ? 
                GROUP BY reading_type 
                ORDER BY count DESC
            `;

            db.db.all(query, [guildId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    if (rows && rows.length > 0) {
                        const spreadNames = {
                            'single': 'Single',
                            'three-card': 'Three-Card',
                            'celtic-cross': 'Celtic Cross',
                            'horseshoe': 'Horseshoe',
                            'relationship': 'Relationship',
                            'yes-no': 'Yes/No',
                            'daily': 'Daily',
                            'career': 'Career'
                        };
                        
                        const breakdown = rows.map(row => 
                            `${spreadNames[row.reading_type] || row.reading_type}: ${row.count}`
                        ).join('\n');
                        
                        resolve(breakdown);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    },

    async getTopReaders(db, guildId, since) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT user_id, COUNT(*) as count 
                FROM readings 
                WHERE guild_id = ? AND created_at >= ?
                GROUP BY user_id 
                ORDER BY count DESC 
                LIMIT 5
            `;

            db.db.all(query, [guildId, since], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    if (rows && rows.length > 0) {
                        const topReaders = rows.map((row, index) => 
                            `${index + 1}. <@${row.user_id}> - ${row.count} readings`
                        );
                        resolve(topReaders);
                    } else {
                        resolve([]);
                    }
                }
            });
        });
    }
};
