const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cardUtils = require("../../utils/cardUtils");
const DatabaseManager = require("../../database/DatabaseManager");
const logger = require("../../utils/logger");
const analytics = require("../../utils/analytics");
const AstrologyUtils = require("../../utils/astrology");
const enhancedCardData = require("../../data/enhanced-card-data.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tarot")
    .setDescription("Get a mystical tarot reading")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("single")
        .setDescription("Draw a single card for guidance")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("three-card")
        .setDescription("Past, Present, Future spread")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("celtic-cross")
        .setDescription("Full 10-card Celtic Cross spread")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("horseshoe")
        .setDescription("7-card Horseshoe spread for general guidance")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("relationship")
        .setDescription("6-card spread focused on relationships")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("yes-no")
        .setDescription("Simple yes/no answer to your question")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("daily").setDescription("Daily guidance card")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("career")
        .setDescription("5-card spread for career guidance")
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
      const embed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle("🕐 The cards need time to recharge...")
        .setDescription(
          `Please wait ${remainingTime} seconds before requesting another reading.`
        )
        .setFooter({ text: "Patience brings clarity to the mystical arts" });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check daily limit
    const db = new DatabaseManager();
    try {
      const todayCount = await db.getTodayReadingCount(userId);
      const maxReadings = parseInt(process.env.MAX_READINGS_PER_DAY) || 10;

      if (todayCount >= maxReadings) {
        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setTitle("🌙 The cosmic energy is depleted")
          .setDescription(
            `You've reached your daily limit of ${maxReadings} readings. The cards need time to restore their mystical energy.`
          )
          .setFooter({ text: "Return tomorrow for fresh insights" });

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Defer reply for longer operations
      await interaction.deferReply();

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

      // Create response embeds with enhanced features
      const embeds = await this.createReadingEmbeds(
        cards,
        readingType,
        interaction.user
      );

      await interaction.editReply({ embeds });
    } catch (error) {
      console.error("Error in tarot command:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🚫 The spirits are disturbed")
        .setDescription(
          "Something went wrong while consulting the cards. Please try again later."
        )
        .setFooter({ text: "The mystical energies are unstable" });

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } finally {
      db.close();
    }
  },

  async handleHelp(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x4b0082)
      .setTitle("🔮 Tarot Reading Guide")
      .setDescription(
        "Welcome to the mystical world of tarot! Here are the available reading types:"
      )
      .addFields(
        {
          name: "🔮 Single Card",
          value:
            "`/tarot single` - Draw one card for quick guidance on your current situation",
          inline: false,
        },
        {
          name: "🃏 Three-Card Spread",
          value:
            "`/tarot three-card` - Past, Present, Future reading for deeper insight",
          inline: false,
        },
        {
          name: "✨ Celtic Cross",
          value:
            "`/tarot celtic-cross` - Comprehensive 10-card spread for complex situations",
          inline: false,
        },
        {
          name: "🐴 Horseshoe Spread",
          value: "`/tarot horseshoe` - 7-card spread for general life guidance",
          inline: false,
        },
        {
          name: "💕 Relationship Spread",
          value:
            "`/tarot relationship` - 6-card spread focused on love and relationships",
          inline: false,
        },
        {
          name: "❓ Yes/No Reading",
          value: "`/tarot yes-no` - Simple yes or no answer to your question",
          inline: false,
        },
        {
          name: "🌅 Daily Card",
          value:
            "`/tarot daily` - Single card for daily guidance and inspiration",
          inline: false,
        },
        {
          name: "💼 Career Spread",
          value:
            "`/tarot career` - 5-card spread for career and professional guidance",
          inline: false,
        },
        {
          name: "📚 About Tarot",
          value:
            "Tarot cards are used for entertainment and self-reflection. Each card has upright and reversed meanings that can offer different perspectives on life situations.",
          inline: false,
        },
        {
          name: "⏰ Usage Limits",
          value: `• ${
            process.env.COMMAND_COOLDOWN || 30
          } second cooldown between readings\n• ${
            process.env.MAX_READINGS_PER_DAY || 10
          } readings per day maximum`,
          inline: false,
        }
      )
      .setFooter({ text: "Remember: Tarot is for entertainment purposes only" })
      .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed] });
  },

  async createReadingEmbeds(cards, readingType, user) {
    const embeds = [];
    const emoji = cardUtils.getReadingEmoji(readingType);
    const astrology = new AstrologyUtils();

    // Main embed with reading info
    const mainEmbed = new EmbedBuilder()
      .setColor(0x4b0082)
      .setTitle(`${emoji} Tarot Reading for ${user.displayName}`)
      .setDescription(this.getReadingDescription(readingType))
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: "For entertainment purposes only" });

    // Add astrological influences for daily and single card readings
    if (readingType === "daily" || readingType === "single") {
      const astroInfo = astrology.getAstrologicalInfluence();
      const astroFormatted = astrology.formatAstrologyInfo(astroInfo);

      if (astroFormatted) {
        astroFormatted.fields.forEach((field) => {
          mainEmbed.addFields(field);
        });
      }
    }

    embeds.push(mainEmbed);

    // Add card embeds (limit to avoid Discord's 10 embed limit)
    const maxCards = readingType === "celtic-cross" ? 6 : cards.length; // Show first 6 cards for Celtic Cross

    for (let i = 0; i < Math.min(maxCards, cards.length); i++) {
      const cardEmbed = cardUtils.formatCard(cards[i], true);
      embeds.push(new EmbedBuilder(cardEmbed));
    }

    // If Celtic Cross, add a summary embed for remaining cards
    if (readingType === "celtic-cross" && cards.length > 6) {
      const remainingCards = cards.slice(6);
      const summaryEmbed = new EmbedBuilder()
        .setColor(0x4b0082)
        .setTitle("✨ Remaining Cards")
        .setDescription("The final cards of your Celtic Cross spread:");

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
