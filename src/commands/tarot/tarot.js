const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const cardUtils = require("../../utils/cardUtils");
const DatabaseManager = require("../../database/DatabaseManager");
const logger = require("../../utils/logger");
const analytics = require("../../utils/analytics");
const AstrologyUtils = require("../../utils/astrology");
const AIInterpretationEngine = require("../../utils/aiInterpretation");
const enhancedCardData = require("../../data/enhanced-card-data.json");

// Initialize AI Engine
const aiEngine = new AIInterpretationEngine();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tarot")
    .setDescription("Get a mystical tarot reading")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("single")
        .setDescription("Draw a single card for guidance")
        .addBooleanOption((option) =>
          option
            .setName("private")
            .setDescription("Make this reading private (only you can see it)")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("ai-enhanced")
            .setDescription("Get AI-enhanced interpretation (if available)")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("three-card")
        .setDescription("Past, Present, Future spread")
        .addBooleanOption((option) =>
          option
            .setName("private")
            .setDescription("Make this reading private")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("ai-enhanced")
            .setDescription("Get AI-enhanced interpretation")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("celtic-cross")
        .setDescription("Full 10-card Celtic Cross spread")
        .addBooleanOption((option) =>
          option
            .setName("private")
            .setDescription("Make this reading private")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("ai-enhanced")
            .setDescription("Get AI-enhanced interpretation")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("horseshoe")
        .setDescription("7-card Horseshoe spread for general guidance")
        .addBooleanOption((option) =>
          option
            .setName("private")
            .setDescription("Make this reading private")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("ai-enhanced")
            .setDescription("Get AI-enhanced interpretation")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("relationship")
        .setDescription("6-card spread focused on relationships")
        .addBooleanOption((option) =>
          option
            .setName("private")
            .setDescription("Make this reading private")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("ai-enhanced")
            .setDescription("Get AI-enhanced interpretation")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("yes-no")
        .setDescription("Simple yes/no answer to your question")
        .addBooleanOption((option) =>
          option
            .setName("private")
            .setDescription("Make this reading private")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("ai-enhanced")
            .setDescription("Get AI-enhanced interpretation")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("daily")
        .setDescription("Daily guidance card")
        .addBooleanOption((option) =>
          option
            .setName("private")
            .setDescription("Make this reading private")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("ai-enhanced")
            .setDescription("Get AI-enhanced interpretation")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("career")
        .setDescription("5-card spread for career guidance")
        .addBooleanOption((option) =>
          option
            .setName("private")
            .setDescription("Make this reading private")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("ai-enhanced")
            .setDescription("Get AI-enhanced interpretation")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Learn about tarot readings and available spreads")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;

    // Handle help command separately
    if (subcommand === "help") {
      return await this.handleHelp(interaction);
    }

    // Check cooldown
    if (cardUtils.isOnCooldown(userId)) {
      const remainingTime = cardUtils.getCooldownTime(userId);
      const maxCooldown = parseInt(process.env.COMMAND_COOLDOWN) || 30;
      const progress = Math.max(0, Math.round(((maxCooldown - remainingTime) / maxCooldown) * 10));
      const progressBar = "█".repeat(progress) + "░".repeat(10 - progress);
      
      const embed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle("🕐 The cards are recharging their mystical energy...")
        .setDescription(
          `**Time remaining:** ${remainingTime} seconds\n\n**Progress:** ${progressBar} ${Math.round(((maxCooldown - remainingTime) / maxCooldown) * 100)}%`
        )
        .addFields({
          name: "💡 While you wait",
          value: "• Use `/card <name>` to learn about specific cards\n• Check `/deck collection` to see your progress\n• Browse `/spread list` for custom layouts",
          inline: false,
        })
        .setFooter({ text: "Patience brings clarity to the mystical arts ✨" });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check daily limit
    const db = new DatabaseManager();
    try {
      const todayCount = await db.getTodayReadingCount(userId);
      const maxReadings = parseInt(process.env.MAX_READINGS_PER_DAY) || 10;

      if (todayCount >= maxReadings) {
        const nextReset = new Date();
        nextReset.setHours(24, 0, 0, 0);
        const hoursUntilReset = Math.ceil((nextReset - new Date()) / (1000 * 60 * 60));
        
        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setTitle("🌙 Daily cosmic energy limit reached")
          .setDescription(
            `You've completed all **${maxReadings} readings** for today. The cards need time to restore their mystical energy.`
          )
          .addFields(
            {
              name: "⏰ Reset Time",
              value: `**${hoursUntilReset} hours** until fresh readings are available`,
              inline: true,
            },
            {
              name: "📊 Today's Progress",
              value: `**${todayCount}/${maxReadings}** readings completed`,
              inline: true,
            },
            {
              name: "🎯 What you can still do",
              value: "• Learn about cards with `/card <name>`\n• Manage favorites with `/deck favorites`\n• Explore themes with `/deck theme`\n• Create custom spreads with `/spread create`",
              inline: false,
            }
          )
          .setFooter({ text: "Return tomorrow for fresh cosmic insights ✨" });

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Get options
      const isPrivate = interaction.options.getBoolean("private") || false;
      const aiEnhanced = interaction.options.getBoolean("ai-enhanced") || false;

      // Defer reply for longer operations with loading message
      const isComplexReading = ["celtic-cross", "horseshoe", "relationship", "career"].includes(subcommand);
      
      if (isComplexReading) {
        await interaction.deferReply({ ephemeral: isPrivate });
        
        // Send interim loading message for complex readings
        const loadingEmbed = new EmbedBuilder()
          .setColor(0x4b0082)
          .setTitle("🔮 Consulting the cosmic forces...")
          .setDescription(`Preparing your **${subcommand.replace('-', ' ')}** reading...`)
          .addFields({
            name: "✨ The spirits are working",
            value: "• Shuffling the mystical deck\n• Aligning cosmic energies\n• Drawing your cards",
            inline: false,
          })
          .setFooter({ text: "This may take a moment for complex spreads" });
          
        // For very complex readings, send a loading message first
        if (subcommand === "celtic-cross") {
          await interaction.editReply({ embeds: [loadingEmbed] });
        }
      } else {
        await interaction.deferReply({ ephemeral: isPrivate });
      }

      let cards = [];
      let readingType = "";

      // Perform the reading based on subcommand
      switch (subcommand) {
        case "single":
          cards = cardUtils.singleCardReading();
          readingType = "single";
          break;
        case "three-card":
          cards = cardUtils.threeCardReading();
          readingType = "three-card";
          break;
        case "celtic-cross":
          cards = cardUtils.celticCrossReading();
          readingType = "celtic-cross";
          break;
        case "horseshoe":
          cards = cardUtils.horseshoeReading();
          readingType = "horseshoe";
          break;
        case "relationship":
          cards = cardUtils.relationshipReading();
          readingType = "relationship";
          break;
        case "yes-no":
          cards = cardUtils.yesNoReading();
          readingType = "yes-no";
          break;
        case "daily":
          cards = cardUtils.dailyCardReading();
          readingType = "daily";
          break;
        case "career":
          cards = cardUtils.careerReading();
          readingType = "career";
          break;
      }

      // Save reading to database
      await db.saveReading(userId, guildId, readingType, cards);
      await db.updateLastReading(userId);

      // Set cooldown
      cardUtils.setCooldown(userId);

      // Track analytics
      const executionTime = Date.now() - Date.now(); // This will be set properly in the calling function
      await analytics.trackReading(
        userId,
        guildId,
        readingType,
        cards,
        executionTime
      );

      // Log the reading
      logger.logReading(userId, guildId, readingType, cards);

      // Get AI interpretation if requested and available
      let aiInterpretation = null;
      if (aiEnhanced && aiEngine.isAvailable()) {
        try {
          const userContext = await this.buildUserContext(userId, db);
          aiInterpretation = await aiEngine.generateInterpretation(
            cards,
            readingType,
            userContext
          );
        } catch (error) {
          logger.error("AI interpretation failed:", error);
        }
      }

      // Create response embeds with enhanced features
      const embeds = await this.createReadingEmbeds(
        cards,
        readingType,
        interaction.user,
        {
          aiInterpretation,
          isPrivate,
          aiEnhanced: aiEnhanced && aiEngine.isAvailable(),
        }
      );

      // Create navigation buttons for multi-card readings
      const components = [];

      // Add navigation buttons for multi-card spreads
      if (cards.length > 1 && !isPrivate) {
        const readingId = `${interaction.user.id}_${Date.now()}`;
        const navRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`prev_${readingId}_0`)
            .setLabel("◀ Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true), // Start disabled
          new ButtonBuilder()
            .setCustomId(`overview_${readingId}_0`)
            .setLabel("📋 Overview")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`next_${readingId}_0`)
            .setLabel("Next ▶")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(cards.length <= 1),
          new ButtonBuilder()
            .setCustomId(`favorite_${readingId}_0`)
            .setLabel("⭐ Favorite")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`share_${readingId}_0`)
            .setLabel("📤 Share")
            .setStyle(ButtonStyle.Secondary)
        );
        components.push(navRow);
      }

      // Create action buttons for community features
      const actionRow = this.createActionButtons(readingType, isPrivate);
      if (actionRow && !isPrivate) {
        components.push(actionRow);
      }

      const response = { embeds };
      if (components.length > 0) {
        response.components = components;
      }

      await interaction.editReply(response);    } catch (error) {
      console.error("Error in tarot command:", error);
      logger.error(`Tarot command error for user ${userId}:`, error);
      
      // Determine error type for better user messaging
      const isConnectionError = error.message?.includes('connection') || error.message?.includes('database');
      const isTimeoutError = error.message?.includes('timeout');
      
      let errorTitle = "🚫 The spirits are temporarily disturbed";
      let errorDescription = "Something mystical went wrong while consulting the cards.";
      let helpText = "Please try again in a moment. If the issue persists, the cosmic energies may be unstable.";
      
      if (isConnectionError) {
        errorTitle = "📡 Connection to the mystical realm lost";
        errorDescription = "Unable to connect to the spiritual database.";
        helpText = "This is usually temporary. Please try again in 30-60 seconds.";
      } else if (isTimeoutError) {
        errorTitle = "⏰ The cards are taking longer than usual";
        errorDescription = "The spiritual consultation is taking longer than expected.";
        helpText = "Try a simpler reading like `/tarot single` or wait a moment before trying again.";
      }

      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(errorTitle)
        .setDescription(errorDescription)
        .addFields({
          name: "🔧 What you can try",
          value: helpText + "\n\n**Alternative actions:**\n• Use `/card <name>` to learn about specific cards\n• Check `/deck collection` for your stats\n• Try `/tarot help` for guidance",
          inline: false,
        })
        .setFooter({ text: "The mystical energies will stabilize soon ✨" })
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } finally {
      if (db) {
        db.close();
      }
    }
  },

  async handleHelp(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x4b0082)
      .setTitle("🔮 Tarot Reading Guide & Commands")
      .setDescription(
        "Welcome to the mystical world of tarot! Choose from various spreads to gain cosmic insight."
      )
      .addFields(
        {
          name: "🌟 Popular Readings",
          value:
            "🔮 `/tarot single` - Quick daily guidance (30 sec)\n" +
            "🃏 `/tarot three-card` - Past/Present/Future (2 min)\n" +
            "❓ `/tarot yes-no` - Direct answers (30 sec)",
          inline: true,
        },
        {
          name: "📚 Advanced Spreads",
          value:
            "✨ `/tarot celtic-cross` - Deep insight (5-10 min)\n" +
            "🐴 `/tarot horseshoe` - Life guidance (3-5 min)\n" +
            "💕 `/tarot relationship` - Love matters (3-5 min)\n" +
            "💼 `/tarot career` - Professional path (3-5 min)",
          inline: true,
        },
        {
          name: "🎨 Personalization",
          value:
            "🎯 `/deck theme` - Change visual style\n" +
            "⭐ `/deck favorites` - Save meaningful cards\n" +
            "📊 `/deck collection` - Track your journey\n" +
            "⚙️ `/deck preferences` - Customize experience",
          inline: false,
        },
        {
          name: "🔍 Card Discovery",
          value:
            "🃏 `/card <name>` - Learn about any card\n" +
            "🎨 `/spread create` - Design custom layouts\n" +
            "📋 `/spread list` - Browse available spreads",
          inline: true,
        },
        {
          name: "⏰ Usage Information",
          value: `• **Cooldown:** ${
            process.env.COMMAND_COOLDOWN || 30
          } seconds between readings\n• **Daily Limit:** ${
            process.env.MAX_READINGS_PER_DAY || 10
          } readings per day\n• **AI Enhancement:** Available with \`ai-enhanced:true\``,
          inline: true,
        },
        {
          name: "💡 Pro Tips",
          value:
            "• Use `private:true` for personal readings\n• Try different spreads for various situations\n• Save meaningful cards to favorites\n• Create custom spreads for unique questions",
          inline: false,
        }
      )
      .setFooter({ text: "✨ Remember: Tarot is for entertainment and self-reflection only" })
      .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed] });
  },

  async createReadingEmbeds(cards, readingType, user, options = {}) {
    const embeds = [];
    const emoji = cardUtils.getReadingEmoji(readingType);
    const astrology = new AstrologyUtils();
    const { aiInterpretation, isPrivate, aiEnhanced } = options;

    // Enhanced main embed with modern styling
    const mainEmbed = new EmbedBuilder()
      .setColor(this.getThemeColor(readingType))
      .setTitle(
        `${emoji} ${this.getReadingTitle(readingType)} for ${user.displayName}`
      )
      .setDescription(this.getReadingDescription(readingType))
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()
      .setFooter({
        text: isPrivate
          ? "🔒 Private Reading • For entertainment purposes only"
          : "For entertainment purposes only",
      });

    // Add astrological influences with enhanced formatting
    if (readingType === "daily" || readingType === "single") {
      const astroInfo = astrology.getAstrologicalInfluence();
      const astroFormatted = astrology.formatAstrologyInfo(astroInfo);

      if (astroFormatted) {
        astroFormatted.fields.forEach((field) => {
          mainEmbed.addFields(field);
        });
      }
    }

    // Add reading overview for multi-card spreads
    if (cards.length > 1) {
      const cardList = cards
        .slice(0, 5)
        .map((card, index) => {
          const position = card.position || `Position ${index + 1}`;
          const orientation = card.isReversed ? " 🔄" : " ⬆️";
          return `**${position}**: ${card.name}${orientation}`;
        })
        .join("\n");

      if (cards.length > 5) {
        mainEmbed.addFields({
          name: "🎴 Cards in This Reading",
          value: cardList + `\n*... and ${cards.length - 5} more cards*`,
          inline: false,
        });
      } else {
        mainEmbed.addFields({
          name: "🎴 Cards in This Reading",
          value: cardList,
          inline: false,
        });
      }
    }

    // Add AI status indicator
    if (aiEnhanced) {
      mainEmbed.addFields({
        name: "🤖 AI Enhancement",
        value: aiInterpretation ? "✅ Included below" : "⚠️ Unavailable",
        inline: true,
      });
    }

    embeds.push(mainEmbed);

    // Add card embeds with enhanced styling
    const maxCards =
      readingType === "celtic-cross" ? 6 : Math.min(cards.length, 8);

    for (let i = 0; i < maxCards; i++) {
      const cardEmbed = cardUtils.formatCard(cards[i], true);
      const enhancedEmbed = new EmbedBuilder(cardEmbed).setColor(
        cards[i].isReversed ? 0x8b0000 : this.getThemeColor(readingType)
      );

      // Add enhanced formatting for mobile
      if (cards[i].position) {
        enhancedEmbed.setTitle(`🎯 ${cards[i].position}: ${cards[i].name}`);
      }

      embeds.push(enhancedEmbed);
    }

    // Add AI interpretation embed if available
    if (aiInterpretation && aiInterpretation.content) {
      const aiEmbed = new EmbedBuilder()
        .setColor(0x00d4aa)
        .setTitle("🤖 AI-Enhanced Interpretation")
        .setDescription(aiInterpretation.content)
        .setFooter({
          text: "✨ Enhanced with AI insights • For entertainment purposes only",
        });

      embeds.push(aiEmbed);
    }

    // Add summary embed for large spreads
    if (readingType === "celtic-cross" && cards.length > 6) {
      const remainingCards = cards.slice(6);
      const summaryEmbed = new EmbedBuilder()
        .setColor(0x4b0082)
        .setTitle("✨ Final Cards Summary")
        .setDescription("The remaining cards of your Celtic Cross spread:");

      remainingCards.forEach((card) => {
        const orientation = card.isReversed ? " (Reversed)" : "";
        summaryEmbed.addFields({
          name: `${card.position}: ${card.name}${orientation}`,
          value: card.isReversed
            ? card.reversed.keywords.join(", ")
            : card.upright.keywords.join(", "),
          inline: false,
        });
      });

      embeds.push(summaryEmbed);
    }

    return embeds;
  },

  // Build user context for AI interpretation
  async buildUserContext(userId, db) {
    try {
      const recentReadings = await db.getRecentReadings(userId, 5);
      const stats = await db.getUserCardStats(userId);
      const hour = new Date().getHours();

      return {
        recentReadings: recentReadings.map((r) => r.reading_type),
        readingHistory: {
          total: stats.totalReadings,
          favoriteType: this.getMostFrequentReadingType(recentReadings),
        },
        timeOfDay: hour,
        // Add more context as needed
      };
    } catch (error) {
      logger.error("Error building user context:", error);
      return {};
    }
  },

  // Get most frequent reading type
  getMostFrequentReadingType(readings) {
    const counts = {};
    readings.forEach((reading) => {
      counts[reading.reading_type] = (counts[reading.reading_type] || 0) + 1;
    });

    return Object.keys(counts).reduce(
      (a, b) => (counts[a] > counts[b] ? a : b),
      "single"
    );
  },

  // Create action buttons for community features
  createActionButtons(readingType, isPrivate) {
    if (isPrivate) return null;

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`share_reading_${Date.now()}`)
        .setLabel("Share Reading")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📤"),
      new ButtonBuilder()
        .setCustomId(`save_reading_${Date.now()}`)
        .setLabel("Save to Journal")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📖"),
      new ButtonBuilder()
        .setCustomId(`get_reflection_${Date.now()}`)
        .setLabel("Reflection Questions")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🤔")
    );

    // Add AI insight button if available
    if (aiEngine.isAvailable()) {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`ai_insight_${Date.now()}`)
          .setLabel("AI Insight")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🤖")
      );
    }

    return actionRow;
  },

  // Get theme color based on reading type
  getThemeColor(readingType) {
    const colors = {
      single: 0x4b0082, // Indigo
      "three-card": 0x6a0dad, // Purple
      "celtic-cross": 0x8a2be2, // BlueViolet
      horseshoe: 0x9370db, // MediumPurple
      relationship: 0xff69b4, // HotPink
      "yes-no": 0x32cd32, // LimeGreen
      daily: 0xffd700, // Gold
      career: 0x4169e1, // RoyalBlue
    };
    return colors[readingType] || 0x4b0082;
  },

  // Get enhanced reading title
  getReadingTitle(readingType) {
    const titles = {
      single: "Single Card Reading",
      "three-card": "Three-Card Spread",
      "celtic-cross": "Celtic Cross Reading",
      horseshoe: "Horseshoe Spread",
      relationship: "Relationship Reading",
      "yes-no": "Yes/No Oracle",
      daily: "Daily Guidance",
      career: "Career Guidance",
    };
    return titles[readingType] || "Tarot Reading";
  },

  getReadingDescription(readingType) {
    const descriptions = {
      single:
        "A single card has been drawn to provide guidance on your current path. Focus on its message and how it relates to your situation.",
      "three-card":
        "The cards reveal the flow of time - your past influences, present circumstances, and the future that awaits.",
      "celtic-cross":
        "The ancient Celtic Cross spread unveils the complex tapestry of your situation, revealing hidden influences and potential outcomes.",
      horseshoe:
        "The Horseshoe spread offers comprehensive guidance, examining your past, present, and the path forward with practical advice.",
      relationship:
        "The Relationship spread illuminates the dynamics between you and another, revealing needs, desires, and the potential future of your connection.",
      "yes-no":
        "The cards have been consulted for a direct answer to your question. Consider the guidance offered alongside the simple response.",
      daily:
        "Your daily guidance card offers insight and inspiration for the day ahead. Carry its wisdom with you.",
      career:
        "The Career spread examines your professional path, highlighting challenges, opportunities, and the potential outcomes of your efforts.",
    };
    return descriptions[readingType] || "The cards have spoken...";
  },
};
