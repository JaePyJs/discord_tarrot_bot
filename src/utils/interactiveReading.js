const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../database/DatabaseManager');
const AIInterpretationEngine = require('./aiInterpretation');
const LocalizationManager = require('./localization');
const logger = require('./logger');

class InteractiveReadingManager {
  constructor() {
    this.db = new DatabaseManager();
    this.ai = new AIInterpretationEngine();
    this.localization = new LocalizationManager();
    this.activeReadings = new Map(); // Store active reading sessions
  }

  // Create interactive reading with buttons
  createInteractiveReading(cards, readingType, user, options = {}) {
    const readingId = `reading_${user.id}_${Date.now()}`;
    
    // Store reading session
    this.activeReadings.set(readingId, {
      cards,
      readingType,
      user,
      createdAt: new Date(),
      currentCard: 0,
      options
    });

    const embeds = this.createReadingEmbeds(cards, readingType, user, options);
    const components = this.createReadingComponents(readingId, cards.length, options);

    return {
      embeds,
      components,
      readingId
    };
  }

  // Create reading embeds with enhanced features
  createReadingEmbeds(cards, readingType, user, options = {}) {
    const embeds = [];
    const language = options.language || 'en';

    // Main reading embed
    const mainEmbed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle(`🔮 ${this.localization.t(`spreads.${readingType}`, language)} Reading`)
      .setDescription(this.getReadingDescription(readingType, language))
      .setAuthor({
        name: `${user.displayName}'s Interactive Reading`,
        iconURL: user.displayAvatarURL(),
      })
      .setTimestamp()
      .setFooter({
        text: this.localization.t('messages.for_entertainment', language),
      });

    // Add reading overview
    if (cards.length > 1) {
      const cardList = cards.map((card, index) => {
        const position = card.position || `Position ${index + 1}`;
        return `${index + 1}. **${position}**: ${card.name} ${card.isReversed ? '(R)' : ''}`;
      }).join('\n');

      mainEmbed.addFields({
        name: '🎴 Cards in This Reading',
        value: cardList,
        inline: false
      });
    }

    embeds.push(mainEmbed);

    // Add first card embed
    if (cards.length > 0) {
      const firstCard = this.createCardEmbed(cards[0], 0, language);
      embeds.push(firstCard);
    }

    return embeds;
  }

  // Create interactive components
  createReadingComponents(readingId, cardCount, options = {}) {
    const components = [];

    // Navigation buttons for multi-card readings
    if (cardCount > 1) {
      const navRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`prev_card_${readingId}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️')
            .setDisabled(true), // Start with first card
          new ButtonBuilder()
            .setCustomId(`next_card_${readingId}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➡️')
            .setDisabled(cardCount <= 1),
          new ButtonBuilder()
            .setCustomId(`overview_${readingId}`)
            .setLabel('Overview')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋')
        );
      components.push(navRow);
    }

    // Action buttons
    const actionRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`add_note_${readingId}`)
          .setLabel('Add Note')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId(`get_insight_${readingId}`)
          .setLabel('AI Insight')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✨')
          .setDisabled(!this.ai.isAvailable()),
        new ButtonBuilder()
          .setCustomId(`save_reading_${readingId}`)
          .setLabel('Save')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💾')
      );

    // Add share button if enabled
    if (options.allowSharing) {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`share_reading_${readingId}`)
          .setLabel('Share')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔗')
      );
    }

    components.push(actionRow);

    // Additional options dropdown
    const optionsMenu = new StringSelectMenuBuilder()
      .setCustomId(`reading_options_${readingId}`)
      .setPlaceholder('Choose an action...')
      .addOptions([
        {
          label: 'Reflection Questions',
          description: 'Get AI-generated reflection questions',
          value: 'reflection_questions',
          emoji: '🤔'
        },
        {
          label: 'Daily Affirmation',
          description: 'Generate a daily affirmation',
          value: 'daily_affirmation',
          emoji: '🌟'
        },
        {
          label: 'Export Reading',
          description: 'Export this reading as text',
          value: 'export_reading',
          emoji: '📤'
        },
        {
          label: 'Similar Readings',
          description: 'Find similar readings in your history',
          value: 'similar_readings',
          emoji: '🔍'
        }
      ]);

    const optionsRow = new ActionRowBuilder().addComponents(optionsMenu);
    components.push(optionsRow);

    return components;
  }

  // Create individual card embed
  createCardEmbed(card, index, language = 'en') {
    const meaning = card.isReversed ? card.reversed : card.upright;
    const orientation = card.isReversed 
      ? this.localization.t('cards.reversed', language)
      : this.localization.t('cards.upright', language);

    const embed = new EmbedBuilder()
      .setColor(card.isReversed ? 0x8B0000 : 0x4B0082)
      .setTitle(`${card.position || `Card ${index + 1}`}: ${card.name}`)
      .setDescription(`**${orientation}**\n\n${meaning.meaning}`)
      .addFields({
        name: this.localization.t('cards.keywords', language),
        value: meaning.keywords.join(', '),
        inline: false
      });

    // Add card image if available
    if (card.image_url) {
      embed.setThumbnail(card.image_url);
    }

    // Add crystal recommendations if available
    const crystals = this.getCrystalRecommendations(card.name);
    if (crystals && crystals.length > 0) {
      embed.addFields({
        name: '💎 Recommended Crystals',
        value: crystals.join(', '),
        inline: false
      });
    }

    // Add meditation guidance if available
    const meditation = this.getMeditationGuidance(card.name);
    if (meditation) {
      embed.addFields({
        name: '🧘 Meditation Focus',
        value: meditation,
        inline: false
      });
    }

    return embed;
  }

  // Handle button interactions
  async handleButtonInteraction(interaction) {
    const customId = interaction.customId;
    const readingId = this.extractReadingId(customId);
    
    if (!readingId || !this.activeReadings.has(readingId)) {
      return await interaction.reply({
        content: 'This reading session has expired. Please start a new reading.',
        ephemeral: true
      });
    }

    const reading = this.activeReadings.get(readingId);
    
    try {
      if (customId.startsWith('prev_card_')) {
        await this.handlePreviousCard(interaction, reading);
      } else if (customId.startsWith('next_card_')) {
        await this.handleNextCard(interaction, reading);
      } else if (customId.startsWith('overview_')) {
        await this.handleOverview(interaction, reading);
      } else if (customId.startsWith('add_note_')) {
        await this.handleAddNote(interaction, reading);
      } else if (customId.startsWith('get_insight_')) {
        await this.handleGetInsight(interaction, reading);
      } else if (customId.startsWith('save_reading_')) {
        await this.handleSaveReading(interaction, reading);
      } else if (customId.startsWith('share_reading_')) {
        await this.handleShareReading(interaction, reading);
      }
    } catch (error) {
      logger.error('Button interaction error:', error);
      await interaction.reply({
        content: 'An error occurred while processing your request.',
        ephemeral: true
      });
    }
  }

  // Handle select menu interactions
  async handleSelectMenuInteraction(interaction) {
    const customId = interaction.customId;
    const readingId = this.extractReadingId(customId);
    const selectedValue = interaction.values[0];
    
    if (!readingId || !this.activeReadings.has(readingId)) {
      return await interaction.reply({
        content: 'This reading session has expired. Please start a new reading.',
        ephemeral: true
      });
    }

    const reading = this.activeReadings.get(readingId);
    
    try {
      switch (selectedValue) {
        case 'reflection_questions':
          await this.handleReflectionQuestions(interaction, reading);
          break;
        case 'daily_affirmation':
          await this.handleDailyAffirmation(interaction, reading);
          break;
        case 'export_reading':
          await this.handleExportReading(interaction, reading);
          break;
        case 'similar_readings':
          await this.handleSimilarReadings(interaction, reading);
          break;
      }
    } catch (error) {
      logger.error('Select menu interaction error:', error);
      await interaction.reply({
        content: 'An error occurred while processing your request.',
        ephemeral: true
      });
    }
  }

  // Handle previous card navigation
  async handlePreviousCard(interaction, reading) {
    if (reading.currentCard > 0) {
      reading.currentCard--;
      const cardEmbed = this.createCardEmbed(reading.cards[reading.currentCard], reading.currentCard);
      const components = this.updateNavigationButtons(reading);
      
      await interaction.update({
        embeds: [cardEmbed],
        components
      });
    }
  }

  // Handle next card navigation
  async handleNextCard(interaction, reading) {
    if (reading.currentCard < reading.cards.length - 1) {
      reading.currentCard++;
      const cardEmbed = this.createCardEmbed(reading.cards[reading.currentCard], reading.currentCard);
      const components = this.updateNavigationButtons(reading);
      
      await interaction.update({
        embeds: [cardEmbed],
        components
      });
    }
  }

  // Handle overview display
  async handleOverview(interaction, reading) {
    const embeds = this.createReadingEmbeds(reading.cards, reading.readingType, reading.user, reading.options);
    await interaction.update({ embeds });
  }

  // Handle add note modal
  async handleAddNote(interaction, reading) {
    const modal = new ModalBuilder()
      .setCustomId(`note_modal_${reading.readingId}`)
      .setTitle('Add Note to Reading');

    const noteInput = new TextInputBuilder()
      .setCustomId('note_text')
      .setLabel('Your reflection or insight')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('What insights did you gain from this reading?')
      .setMaxLength(1000)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(noteInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  }

  // Handle AI insight generation
  async handleGetInsight(interaction, reading) {
    if (!this.ai.isAvailable()) {
      return await interaction.reply({
        content: 'AI insights are not available at the moment.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const currentCard = reading.cards[reading.currentCard];
      const insight = await this.ai.generateQuickInsight(currentCard);
      
      if (insight) {
        const embed = new EmbedBuilder()
          .setColor(0x4B0082)
          .setTitle('✨ AI Insight')
          .setDescription(insight.content)
          .setFooter({ text: 'AI-generated insight for reflection' });

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: 'Unable to generate AI insight at the moment. Please try again later.'
        });
      }
    } catch (error) {
      logger.error('AI insight error:', error);
      await interaction.editReply({
        content: 'An error occurred while generating the insight.'
      });
    }
  }

  // Update navigation buttons based on current position
  updateNavigationButtons(reading) {
    const readingId = reading.readingId || `reading_${reading.user.id}_${Date.now()}`;
    
    const navRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`prev_card_${readingId}`)
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⬅️')
          .setDisabled(reading.currentCard === 0),
        new ButtonBuilder()
          .setCustomId(`next_card_${readingId}`)
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('➡️')
          .setDisabled(reading.currentCard === reading.cards.length - 1),
        new ButtonBuilder()
          .setCustomId(`overview_${readingId}`)
          .setLabel('Overview')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📋')
      );

    return [navRow];
  }

  // Extract reading ID from custom ID
  extractReadingId(customId) {
    const match = customId.match(/reading_\d+_\d+/);
    return match ? match[0] : null;
  }

  // Get reading description
  getReadingDescription(readingType, language = 'en') {
    const descriptions = {
      single: 'A single card drawn for guidance and insight',
      three_card: 'Past, Present, and Future influences',
      celtic_cross: 'A comprehensive 10-card spread for deep insight',
      daily: 'Your daily guidance from the cards'
    };

    return descriptions[readingType] || 'A mystical tarot reading';
  }

  // Clean up expired reading sessions
  cleanupExpiredReadings() {
    const now = new Date();
    const expiredTime = 30 * 60 * 1000; // 30 minutes

    for (const [readingId, reading] of this.activeReadings) {
      if (now - reading.createdAt > expiredTime) {
        this.activeReadings.delete(readingId);
      }
    }
  }

  // Get crystal recommendations (placeholder)
  getCrystalRecommendations(cardName) {
    // This would integrate with the enhanced card data
    return null;
  }

  // Get meditation guidance (placeholder)
  getMeditationGuidance(cardName) {
    // This would integrate with the enhanced card data
    return null;
  }
}

module.exports = InteractiveReadingManager;
