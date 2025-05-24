const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../database/DatabaseManager');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('journal')
    .setDescription('Manage your personal tarot reading journal')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your reading history')
        .addIntegerOption(option =>
          option
            .setName('page')
            .setDescription('Page number to view')
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('note')
        .setDescription('Add a note to your most recent reading')
        .addStringOption(option =>
          option
            .setName('text')
            .setDescription('Your reflection or note about the reading')
            .setRequired(true)
            .setMaxLength(1000)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription('Search your reading history')
        .addStringOption(option =>
          option
            .setName('query')
            .setDescription('Search for specific cards or reading types')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('export')
        .setDescription('Export your journal entries')
        .addStringOption(option =>
          option
            .setName('format')
            .setDescription('Export format')
            .addChoices(
              { name: 'Text Summary', value: 'text' },
              { name: 'Detailed JSON', value: 'json' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View your journal statistics')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const db = new DatabaseManager();

    try {
      switch (subcommand) {
        case 'view':
          await this.handleView(interaction, db, userId);
          break;
        case 'note':
          await this.handleNote(interaction, db, userId);
          break;
        case 'search':
          await this.handleSearch(interaction, db, userId);
          break;
        case 'export':
          await this.handleExport(interaction, db, userId);
          break;
        case 'stats':
          await this.handleStats(interaction, db, userId);
          break;
      }
    } catch (error) {
      logger.error('Error in journal command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('📖 Journal Error')
        .setDescription('There was an error accessing your journal. Please try again later.')
        .setFooter({ text: 'The mystical records seem temporarily unavailable' });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },

  async handleView(interaction, db, userId) {
    await interaction.deferReply();
    
    const page = interaction.options.getInteger('page') || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const readings = await db.getUserReadings(userId, limit, offset);
    const totalReadings = await db.getUserReadingCount(userId);
    const totalPages = Math.ceil(totalReadings / limit);

    if (readings.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('📖 Your Tarot Journal')
        .setDescription('Your journal is empty. Start by getting a tarot reading!')
        .setFooter({ text: 'Use /tarot to begin your mystical journey' });

      return await interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('📖 Your Tarot Journal')
      .setDescription(`Page ${page} of ${totalPages} • ${totalReadings} total readings`)
      .setFooter({ text: 'Your mystical journey through the cards' });

    for (const reading of readings) {
      const readingDate = moment(reading.created_at).tz('Asia/Manila').format('MMM DD, YYYY [at] h:mm A');
      const cards = JSON.parse(reading.cards_drawn);
      const cardNames = cards.map(card => `${card.name}${card.isReversed ? ' (R)' : ''}`).join(', ');
      
      let fieldValue = `**Cards:** ${cardNames}\n**Type:** ${reading.reading_type}`;
      
      if (reading.notes) {
        fieldValue += `\n**Note:** ${reading.notes}`;
      }

      embed.addFields({
        name: `🔮 ${readingDate}`,
        value: fieldValue,
        inline: false
      });
    }

    // Add navigation buttons if there are multiple pages
    if (totalPages > 1) {
      const row = new ActionRowBuilder();
      
      if (page > 1) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`journal_prev_${page - 1}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️')
        );
      }
      
      if (page < totalPages) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`journal_next_${page + 1}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➡️')
        );
      }

      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  },

  async handleNote(interaction, db, userId) {
    const noteText = interaction.options.getString('text');
    
    // Get the user's most recent reading
    const recentReading = await db.getMostRecentReading(userId);
    
    if (!recentReading) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('📝 No Recent Reading')
        .setDescription('You need to have at least one reading before adding notes.')
        .setFooter({ text: 'Use /tarot to get your first reading' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Add the note to the reading
    await db.addReadingNote(recentReading.id, noteText);

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('📝 Note Added')
      .setDescription('Your reflection has been added to your most recent reading.')
      .addFields({
        name: 'Your Note',
        value: noteText,
        inline: false
      })
      .setFooter({ text: 'Your insights deepen the mystical connection' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async handleSearch(interaction, db, userId) {
    await interaction.deferReply();
    
    const query = interaction.options.getString('query').toLowerCase();
    const readings = await db.searchUserReadings(userId, query);

    if (readings.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🔍 Search Results')
        .setDescription(`No readings found matching "${query}".`)
        .setFooter({ text: 'Try searching for card names or reading types' });

      return await interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('🔍 Search Results')
      .setDescription(`Found ${readings.length} reading(s) matching "${query}"`)
      .setFooter({ text: 'Your mystical search through time' });

    for (const reading of readings.slice(0, 5)) { // Limit to 5 results
      const readingDate = moment(reading.created_at).tz('Asia/Manila').format('MMM DD, YYYY [at] h:mm A');
      const cards = JSON.parse(reading.cards_drawn);
      const cardNames = cards.map(card => `${card.name}${card.isReversed ? ' (R)' : ''}`).join(', ');
      
      let fieldValue = `**Cards:** ${cardNames}\n**Type:** ${reading.reading_type}`;
      
      if (reading.notes) {
        fieldValue += `\n**Note:** ${reading.notes.substring(0, 100)}${reading.notes.length > 100 ? '...' : ''}`;
      }

      embed.addFields({
        name: `🔮 ${readingDate}`,
        value: fieldValue,
        inline: false
      });
    }

    if (readings.length > 5) {
      embed.setDescription(`Found ${readings.length} reading(s) matching "${query}" (showing first 5)`);
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async handleExport(interaction, db, userId) {
    await interaction.deferReply({ ephemeral: true });
    
    const format = interaction.options.getString('format') || 'text';
    const readings = await db.getAllUserReadings(userId);

    if (readings.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('📤 Export Failed')
        .setDescription('You have no readings to export.')
        .setFooter({ text: 'Start your journey with /tarot' });

      return await interaction.editReply({ embeds: [embed] });
    }

    let exportContent = '';
    
    if (format === 'text') {
      exportContent = this.generateTextExport(readings);
    } else {
      exportContent = JSON.stringify(readings, null, 2);
    }

    // Create a text file attachment
    const buffer = Buffer.from(exportContent, 'utf8');
    const filename = `tarot-journal-${userId}-${Date.now()}.${format === 'json' ? 'json' : 'txt'}`;

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('📤 Journal Exported')
      .setDescription(`Your tarot journal has been exported as ${format === 'json' ? 'JSON' : 'text'}.`)
      .addFields({
        name: 'Export Details',
        value: `**Readings:** ${readings.length}\n**Format:** ${format.toUpperCase()}\n**File:** ${filename}`,
        inline: false
      })
      .setFooter({ text: 'Your mystical journey preserved for eternity' });

    await interaction.editReply({ 
      embeds: [embed], 
      files: [{ attachment: buffer, name: filename }] 
    });
  },

  async handleStats(interaction, db, userId) {
    await interaction.deferReply();
    
    const stats = await db.getUserJournalStats(userId);

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('📊 Your Journal Statistics')
      .setDescription('Insights into your mystical journey')
      .addFields(
        {
          name: '📖 Total Readings',
          value: stats.totalReadings.toString(),
          inline: true
        },
        {
          name: '📝 Readings with Notes',
          value: stats.readingsWithNotes.toString(),
          inline: true
        },
        {
          name: '🔮 Favorite Spread',
          value: stats.favoriteSpread || 'None yet',
          inline: true
        },
        {
          name: '📅 First Reading',
          value: stats.firstReading ? moment(stats.firstReading).tz('Asia/Manila').format('MMM DD, YYYY') : 'None',
          inline: true
        },
        {
          name: '🌟 Most Recent',
          value: stats.lastReading ? moment(stats.lastReading).tz('Asia/Manila').format('MMM DD, YYYY') : 'None',
          inline: true
        },
        {
          name: '📈 This Month',
          value: stats.thisMonth.toString(),
          inline: true
        }
      )
      .setFooter({ text: 'Your dedication to the mystical arts grows stronger' });

    await interaction.editReply({ embeds: [embed] });
  },

  generateTextExport(readings) {
    let content = '🔮 TAROT JOURNAL EXPORT\n';
    content += '=' .repeat(50) + '\n\n';
    
    for (const reading of readings) {
      const date = moment(reading.created_at).tz('Asia/Manila').format('MMMM DD, YYYY [at] h:mm A');
      const cards = JSON.parse(reading.cards_drawn);
      
      content += `📅 ${date}\n`;
      content += `🎴 Reading Type: ${reading.reading_type}\n`;
      content += `🃏 Cards Drawn:\n`;
      
      for (const card of cards) {
        content += `   • ${card.name}${card.isReversed ? ' (Reversed)' : ''}\n`;
        if (card.position) {
          content += `     Position: ${card.position}\n`;
        }
      }
      
      if (reading.notes) {
        content += `📝 Notes: ${reading.notes}\n`;
      }
      
      content += '\n' + '-'.repeat(30) + '\n\n';
    }
    
    content += `\nTotal Readings: ${readings.length}\n`;
    content += `Export Date: ${moment().tz('Asia/Manila').format('MMMM DD, YYYY [at] h:mm A')} (Philippines Time)\n`;
    
    return content;
  }
};
