const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const AdvancedAnalyticsEngine = require('../utils/advancedAnalytics');
const DatabaseManager = require('../database/DatabaseManager');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('analytics')
    .setDescription('Advanced analytics and insights about your tarot journey')
    .addSubcommand(subcommand =>
      subcommand
        .setName('patterns')
        .setDescription('Analyze your reading patterns and trends')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('insights')
        .setDescription('Get personalized insights about your spiritual journey')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('timeline')
        .setDescription('View your tarot journey timeline')
        .addStringOption(option =>
          option
            .setName('period')
            .setDescription('Time period to analyze')
            .addChoices(
              { name: 'Last 7 Days', value: '7d' },
              { name: 'Last 30 Days', value: '30d' },
              { name: 'Last 3 Months', value: '3m' },
              { name: 'All Time', value: 'all' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('recommendations')
        .setDescription('Get personalized recommendations for your practice')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('compare')
        .setDescription('Compare your current period with previous periods')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const analytics = new AdvancedAnalyticsEngine();
    const db = new DatabaseManager();

    try {
      await interaction.deferReply();

      switch (subcommand) {
        case 'patterns':
          await this.handlePatterns(interaction, analytics, userId);
          break;
        case 'insights':
          await this.handleInsights(interaction, analytics, userId);
          break;
        case 'timeline':
          await this.handleTimeline(interaction, analytics, db, userId);
          break;
        case 'recommendations':
          await this.handleRecommendations(interaction, analytics, userId);
          break;
        case 'compare':
          await this.handleCompare(interaction, analytics, userId);
          break;
      }
    } catch (error) {
      logger.error('Error in analytics command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('📊 Analytics Error')
        .setDescription('Unable to analyze your data at the moment. Please try again later.')
        .setFooter({ text: 'The cosmic data streams are temporarily disrupted' });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },

  async handlePatterns(interaction, analytics, userId) {
    const patterns = await analytics.analyzeUserPatterns(userId);

    if (!patterns.hasData) {
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('📊 Reading Patterns')
        .setDescription('Not enough data to analyze patterns yet.')
        .addFields({
          name: '🎯 Get Started',
          value: 'Complete at least 5 readings to unlock pattern analysis!',
          inline: false
        })
        .setFooter({ text: 'Your mystical journey is just beginning' });

      return await interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('📊 Your Reading Patterns')
      .setDescription(`Analysis of ${patterns.totalReadings} readings`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        {
          name: '⏰ Time Patterns',
          value: `**Peak Time:** ${patterns.timePatterns.preferredTime} (${patterns.timePatterns.peakHour}:00)\n**Favorite Day:** ${patterns.timePatterns.preferredDay}\n**Most Active Month:** ${patterns.timePatterns.preferredMonth}`,
          inline: true
        },
        {
          name: '🃏 Card Preferences',
          value: `**Reversal Rate:** ${patterns.cardPatterns.reversalRate}%\n**Unique Cards:** ${patterns.cardPatterns.totalUniqueCards}/78\n**Card Diversity:** ${patterns.cardPatterns.cardDiversity}%`,
          inline: true
        },
        {
          name: '🎴 Spread Preferences',
          value: `**Favorite:** ${patterns.spreadPreferences.favoriteSpread}\n**Variety:** ${patterns.spreadPreferences.spreadDiversity} different types`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Patterns reveal the rhythm of your spiritual practice' });

    // Add most frequent cards
    if (patterns.cardPatterns.mostFrequentCards.length > 0) {
      const topCards = patterns.cardPatterns.mostFrequentCards
        .slice(0, 5)
        .map(([card, count]) => `${card} (${count}x)`)
        .join('\n');

      embed.addFields({
        name: '⭐ Most Frequent Cards',
        value: topCards,
        inline: false
      });
    }

    // Add suit distribution
    const suits = patterns.cardPatterns.suitDistribution;
    const suitText = `Cups: ${suits.cups} | Wands: ${suits.wands} | Swords: ${suits.swords} | Pentacles: ${suits.pentacles} | Major: ${suits.major}`;
    
    embed.addFields({
      name: '🌟 Suit Distribution',
      value: suitText,
      inline: false
    });

    await interaction.editReply({ embeds: [embed] });
  },

  async handleInsights(interaction, analytics, userId) {
    const patterns = await analytics.analyzeUserPatterns(userId);

    if (!patterns.hasData) {
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('💡 Personal Insights')
        .setDescription('Complete more readings to unlock personalized insights!')
        .setFooter({ text: 'Wisdom grows with practice' });

      return await interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x9370DB)
      .setTitle('💡 Your Spiritual Insights')
      .setDescription('Personalized insights based on your tarot journey')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: 'These insights reflect your unique spiritual path' });

    // Add insights
    if (patterns.insights.length > 0) {
      patterns.insights.forEach((insight, index) => {
        embed.addFields({
          name: `${insight.icon} ${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Insight`,
          value: insight.message,
          inline: false
        });
      });
    }

    // Add emotional journey summary
    if (patterns.emotionalJourney) {
      const journey = patterns.emotionalJourney;
      embed.addFields({
        name: '🌙 Emotional Journey',
        value: `**Recent Mood:** ${journey.recentMood}\n**Overall Trend:** ${journey.overallTrend}\n**Dominant Themes:** ${journey.dominantThemes.map(t => t.theme).join(', ')}`,
        inline: false
      });
    }

    // Add cyclical patterns
    if (patterns.cyclicalPatterns) {
      const cycles = patterns.cyclicalPatterns;
      embed.addFields({
        name: '🔄 Practice Consistency',
        value: `**Consistency Score:** ${Math.round(cycles.consistency)}%\n**Most Active Period:** Week ${cycles.mostActiveWeek}`,
        inline: true
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async handleTimeline(interaction, analytics, db, userId) {
    const period = interaction.options.getString('period') || '30d';
    
    // Get readings for the specified period
    let startDate;
    const now = moment().tz('Asia/Manila');
    
    switch (period) {
      case '7d':
        startDate = now.clone().subtract(7, 'days');
        break;
      case '30d':
        startDate = now.clone().subtract(30, 'days');
        break;
      case '3m':
        startDate = now.clone().subtract(3, 'months');
        break;
      default:
        startDate = null; // All time
    }

    const readings = await db.getUserReadingsInPeriod(userId, startDate?.toISOString(), now.toISOString());

    if (readings.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('📅 Reading Timeline')
        .setDescription(`No readings found in the selected period (${this.getPeriodName(period)}).`)
        .setFooter({ text: 'Start reading to build your timeline' });

      return await interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle(`📅 Reading Timeline - ${this.getPeriodName(period)}`)
      .setDescription(`${readings.length} readings in this period`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: 'Your spiritual journey through time' });

    // Group readings by date
    const readingsByDate = {};
    readings.forEach(reading => {
      const date = moment(reading.created_at).tz('Asia/Manila').format('MMM DD');
      if (!readingsByDate[date]) {
        readingsByDate[date] = [];
      }
      readingsByDate[date].push(reading);
    });

    // Add timeline entries (limit to recent dates)
    const dates = Object.keys(readingsByDate).slice(-10);
    dates.forEach(date => {
      const dayReadings = readingsByDate[date];
      const readingTypes = dayReadings.map(r => r.reading_type).join(', ');
      
      embed.addFields({
        name: `📅 ${date}`,
        value: `${dayReadings.length} reading(s): ${readingTypes}`,
        inline: true
      });
    });

    // Add summary statistics
    const totalCards = readings.reduce((sum, reading) => {
      const cards = JSON.parse(reading.cards_drawn || reading.cards || '[]');
      return sum + cards.length;
    }, 0);

    embed.addFields({
      name: '📊 Period Summary',
      value: `**Total Readings:** ${readings.length}\n**Cards Drawn:** ${totalCards}\n**Average per Day:** ${(readings.length / this.getPeriodDays(period)).toFixed(1)}`,
      inline: false
    });

    await interaction.editReply({ embeds: [embed] });
  },

  async handleRecommendations(interaction, analytics, userId) {
    const patterns = await analytics.analyzeUserPatterns(userId);

    if (!patterns.hasData) {
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('🎯 Recommendations')
        .setDescription('Complete more readings to receive personalized recommendations!')
        .addFields({
          name: '🌟 General Tips',
          value: '• Try different spread types\n• Keep a reading journal\n• Practice daily for consistency\n• Explore different divination methods',
          inline: false
        })
        .setFooter({ text: 'Your practice will guide your path' });

      return await interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x32CD32)
      .setTitle('🎯 Personalized Recommendations')
      .setDescription('Suggestions to enhance your spiritual practice')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: 'Tailored guidance for your unique journey' });

    // Add recommendations
    if (patterns.recommendations.length > 0) {
      patterns.recommendations.forEach(rec => {
        embed.addFields({
          name: `${this.getRecommendationEmoji(rec.type)} ${rec.title}`,
          value: `${rec.description}\n\n*Action:* ${rec.action}`,
          inline: false
        });
      });
    } else {
      embed.addFields({
        name: '✨ You\'re doing great!',
        value: 'Your practice shows excellent balance and consistency. Keep exploring and growing!',
        inline: false
      });
    }

    // Add next steps based on experience level
    const nextSteps = this.getNextSteps(patterns.totalReadings);
    embed.addFields({
      name: '🚀 Next Steps',
      value: nextSteps,
      inline: false
    });

    await interaction.editReply({ embeds: [embed] });
  },

  async handleCompare(interaction, analytics, userId) {
    // This would compare current period with previous period
    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('📈 Period Comparison')
      .setDescription('Compare your current practice with previous periods')
      .addFields({
        name: '🚧 Coming Soon',
        value: 'Period comparison features are being developed. This will allow you to track your growth over time!',
        inline: false
      })
      .setFooter({ text: 'Advanced analytics coming in future updates' });

    await interaction.editReply({ embeds: [embed] });
  },

  getPeriodName(period) {
    const names = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '3m': 'Last 3 Months',
      'all': 'All Time'
    };
    return names[period] || 'Selected Period';
  },

  getPeriodDays(period) {
    const days = {
      '7d': 7,
      '30d': 30,
      '3m': 90,
      'all': 365 // Approximate
    };
    return days[period] || 30;
  },

  getRecommendationEmoji(type) {
    const emojis = {
      spread: '🎴',
      timing: '⏰',
      journaling: '📝',
      diversity: '🌈',
      consistency: '📅'
    };
    return emojis[type] || '💡';
  },

  getNextSteps(totalReadings) {
    if (totalReadings < 10) {
      return '• Try different spread types\n• Start a reading journal\n• Explore oracle cards and runes';
    } else if (totalReadings < 50) {
      return '• Create custom spreads\n• Set reading reminders\n• Explore AI-enhanced interpretations';
    } else if (totalReadings < 100) {
      return '• Share spreads with the community\n• Analyze your patterns deeply\n• Try advanced divination methods';
    } else {
      return '• Mentor other readers\n• Create complex custom spreads\n• Explore professional development';
    }
  }
};
