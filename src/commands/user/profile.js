const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your tarot reading profile and statistics'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const db = new Database();

        try {
            await interaction.deferReply();

            // Get user statistics
            const stats = await this.getUserStats(db, userId);
            
            const embed = new EmbedBuilder()
                .setColor(0x4B0082)
                .setTitle(`🔮 Tarot Profile for ${interaction.user.displayName}`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    {
                        name: '📊 Reading Statistics',
                        value: `**Total Readings:** ${stats.totalReadings}\n**Today's Readings:** ${stats.todayReadings}\n**This Week:** ${stats.weekReadings}\n**This Month:** ${stats.monthReadings}`,
                        inline: true
                    },
                    {
                        name: '🎯 Favorite Spreads',
                        value: stats.favoriteSpread || 'No readings yet',
                        inline: true
                    },
                    {
                        name: '🗓️ Member Since',
                        value: stats.memberSince || 'Today',
                        inline: true
                    },
                    {
                        name: '🌟 Most Recent Reading',
                        value: stats.lastReading || 'No readings yet',
                        inline: false
                    }
                )
                .setFooter({ text: 'Your mystical journey through the cards' })
                .setTimestamp();

            // Add achievement badges
            const badges = this.getAchievementBadges(stats);
            if (badges.length > 0) {
                embed.addFields({
                    name: '🏆 Achievement Badges',
                    value: badges.join(' '),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in profile command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚫 Profile Unavailable')
                .setDescription('Unable to retrieve your profile at this time. Please try again later.')
                .setFooter({ text: 'The cosmic records are temporarily inaccessible' });

            await interaction.editReply({ embeds: [errorEmbed] });
        } finally {
            db.close();
        }
    },

    async getUserStats(db, userId) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get total readings
        const totalReadings = await this.getReadingCount(db, userId);
        
        // Get today's readings
        const todayReadings = await this.getReadingCount(db, userId, today.toISOString());
        
        // Get week readings
        const weekReadings = await this.getReadingCount(db, userId, weekAgo.toISOString());
        
        // Get month readings
        const monthReadings = await this.getReadingCount(db, userId, monthAgo.toISOString());

        // Get favorite spread
        const favoriteSpread = await this.getFavoriteSpread(db, userId);

        // Get member since date
        const memberSince = await this.getMemberSince(db, userId);

        // Get last reading info
        const lastReading = await this.getLastReadingInfo(db, userId);

        return {
            totalReadings,
            todayReadings,
            weekReadings,
            monthReadings,
            favoriteSpread,
            memberSince,
            lastReading
        };
    },

    async getReadingCount(db, userId, since = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT COUNT(*) as count FROM readings WHERE user_id = ?';
            const params = [userId];

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

    async getFavoriteSpread(db, userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT reading_type, COUNT(*) as count 
                FROM readings 
                WHERE user_id = ? 
                GROUP BY reading_type 
                ORDER BY count DESC 
                LIMIT 1
            `;

            db.db.get(query, [userId], (err, row) => {
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
                        resolve(`${spreadNames[row.reading_type] || row.reading_type} (${row.count} times)`);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    },

    async getMemberSince(db, userId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT MIN(created_at) as first_reading FROM readings WHERE user_id = ?';

            db.db.get(query, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row && row.first_reading) {
                        const date = new Date(row.first_reading);
                        resolve(date.toLocaleDateString());
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    },

    async getLastReadingInfo(db, userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT reading_type, created_at 
                FROM readings 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            `;

            db.db.get(query, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        const date = new Date(row.created_at);
                        const spreadNames = {
                            'single': 'Single Card',
                            'three-card': 'Three-Card',
                            'celtic-cross': 'Celtic Cross',
                            'horseshoe': 'Horseshoe',
                            'relationship': 'Relationship',
                            'yes-no': 'Yes/No',
                            'daily': 'Daily Card',
                            'career': 'Career'
                        };
                        resolve(`${spreadNames[row.reading_type] || row.reading_type} - ${date.toLocaleDateString()}`);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    },

    getAchievementBadges(stats) {
        const badges = [];

        // Reading count badges
        if (stats.totalReadings >= 100) badges.push('🌟'); // Century reader
        else if (stats.totalReadings >= 50) badges.push('⭐'); // Dedicated reader
        else if (stats.totalReadings >= 10) badges.push('✨'); // Regular reader
        else if (stats.totalReadings >= 1) badges.push('🔮'); // First reading

        // Consistency badges
        if (stats.weekReadings >= 7) badges.push('🔥'); // Daily reader
        if (stats.monthReadings >= 20) badges.push('📚'); // Avid reader

        return badges;
    }
};
