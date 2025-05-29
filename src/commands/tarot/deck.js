const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const DatabaseManager = require("../../database/DatabaseManager");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deck")
    .setDescription("Customize your tarot deck experience")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("theme")
        .setDescription("Change your deck theme")
        .addStringOption((option) =>
          option
            .setName("style")
            .setDescription("Choose a deck theme")
            .setRequired(true)
            .addChoices(
              { name: "🌙 Classic Rider-Waite", value: "classic" },
              { name: "🌸 Ethereal Dreams", value: "ethereal" },
              { name: "🔮 Mystic Shadows", value: "mystic" },
              { name: "🌺 Tropical Paradise", value: "tropical" },
              { name: "🌌 Cosmic Journey", value: "cosmic" },
              { name: "🏛️ Ancient Wisdom", value: "ancient" },
              { name: "🌿 Nature's Path", value: "nature" },
              { name: "🎭 Art Nouveau", value: "nouveau" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("favorites")
        .setDescription("Manage your favorite cards")
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("What to do with favorites")
            .setRequired(true)
            .addChoices(
              { name: "View Favorites", value: "view" },
              { name: "Add Card", value: "add" },
              { name: "Remove Card", value: "remove" },
              { name: "Clear All", value: "clear" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("card")
            .setDescription("Card name (for add/remove actions)")
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("collection")
        .setDescription("View your card collection and statistics")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("preferences")
        .setDescription("Set reading preferences")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unlock")
        .setDescription("Unlock new deck themes and features")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const db = new DatabaseManager();

    try {
      switch (subcommand) {
        case "theme":
          await this.handleTheme(interaction, db, userId);
          break;
        case "favorites":
          await this.handleFavorites(interaction, db, userId);
          break;
        case "collection":
          await this.handleCollection(interaction, db, userId);
          break;
        case "preferences":
          await this.handlePreferences(interaction, db, userId);
          break;
        case "unlock":
          await this.handleUnlock(interaction, db, userId);
          break;
      }
    } catch (error) {
      logger.error("Error in deck command:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🎨 Deck Error")
        .setDescription(
          "There was an error with the deck system. Please try again later."
        )
        .setFooter({ text: "The mystical energies seem disrupted" });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },

  async handleTheme(interaction, db, userId) {
    const theme = interaction.options.getString("style");

    // Check if user has unlocked this theme
    const userPrefs = await db.getUserPreferences(userId);
    const unlockedThemes = userPrefs?.unlocked_themes || ["classic"];
    if (!unlockedThemes.includes(theme)) {
      const requirement = this.getUnlockRequirement(theme);
      const embed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle("🔒 Theme Locked")
        .setDescription(
          `The **${this.getThemeName(
            theme
          )}** theme awaits your dedication to the mystical arts.`
        )
        .addFields(
          {
            name: "🗝️ Unlock Requirement",
            value: requirement,
            inline: false,
          },
          {
            name: "💡 How to Progress",
            value:
              "• Complete more tarot readings\n• Explore different spread types\n• Build your card collection\n• Check your progress with `/deck collection`",
            inline: false,
          },
          {
            name: "🎨 Currently Available",
            value:
              unlockedThemes
                .map((t) => `✅ ${this.getThemeName(t)}`)
                .join("\n") || "Classic theme only",
            inline: true,
          }
        )
        .setFooter({
          text: "Your mystical journey unlocks beautiful new themes! ✨",
        });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Set the theme
    await db.setUserPreference(userId, "deck_theme", theme);

    const themeData = this.getThemeData(theme);
    const embed = new EmbedBuilder()
      .setColor(themeData.color)
      .setTitle(`🎨 Theme Successfully Changed`)
      .setDescription(
        `Your mystical aesthetic has been set to **${themeData.name}**`
      )
      .addFields(
        {
          name: "✨ Theme Features",
          value: themeData.description,
          inline: false,
        },
        {
          name: "🔮 What's New",
          value:
            "• All future readings will use this theme\n• Card embeds will reflect the new style\n• Enhanced visual experience awaits",
          inline: true,
        },
        {
          name: "🎯 Quick Actions",
          value:
            "• Try `/tarot single` to see your new theme\n• Check `/deck collection` for your progress\n• Explore `/deck unlock` for more themes",
          inline: true,
        }
      )
      .setThumbnail(themeData.preview)
      .setFooter({
        text: "Your readings will now have this beautiful new style ✨",
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async handleFavorites(interaction, db, userId) {
    const action = interaction.options.getString("action");
    const cardName = interaction.options.getString("card");

    switch (action) {
      case "view":
        await this.viewFavorites(interaction, db, userId);
        break;
      case "add":
        if (!cardName) {
          return await interaction.reply({
            content: "Please specify a card name to add to favorites.",
            ephemeral: true,
          });
        }
        await this.addFavorite(interaction, db, userId, cardName);
        break;
      case "remove":
        if (!cardName) {
          return await interaction.reply({
            content: "Please specify a card name to remove from favorites.",
            ephemeral: true,
          });
        }
        await this.removeFavorite(interaction, db, userId, cardName);
        break;
      case "clear":
        await this.clearFavorites(interaction, db, userId);
        break;
    }
  },
  async handleCollection(interaction, db, userId) {
    await interaction.deferReply();

    const stats = await db.getUserCardStats(userId);
    const favorites = await db.getUserFavorites(userId);
    const preferences = await db.getUserPreferences(userId);
    const recentReadings = await db.getRecentReadings(userId, 5);

    // Calculate additional stats
    const completionRate = Math.round((stats.uniqueCards / 78) * 100);
    const averageReadingsPerDay =
      stats.totalReadings > 0
        ? Math.round(
            stats.totalReadings /
              Math.max(
                1,
                Math.ceil(
                  (Date.now() - stats.firstReading) / (1000 * 60 * 60 * 24)
                )
              )
          )
        : 0;

    const embed = new EmbedBuilder()
      .setColor(0x4b0082)
      .setTitle("🃏 Your Mystical Tarot Journey")
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        {
          name: "📊 Collection Progress",
          value: `**Cards Discovered:** ${stats.uniqueCards}/78 (${completionRate}%)\n**Total Readings:** ${stats.totalReadings}\n**Favorite Cards:** ${favorites.length}/78`,
          inline: true,
        },
        {
          name: "🎨 Your Style",
          value: `**Current Theme:** ${this.getThemeName(
            preferences?.deck_theme || "classic"
          )}\n**Reading Style:** ${
            preferences?.reading_style || "Detailed"
          }\n**AI Enhanced:** ${preferences?.ai_insights ? "✅ Yes" : "❌ No"}`,
          inline: true,
        },
        {
          name: "📈 Journey Stats",
          value: `**Activity Level:** ${
            averageReadingsPerDay > 0
              ? `${averageReadingsPerDay}/day`
              : "Getting started"
          }\n**Recent Focus:** ${
            recentReadings.length > 0
              ? recentReadings[0].reading_type.replace("-", " ")
              : "None yet"
          }\n**Streak:** Track coming soon!`,
          inline: true,
        },
        {
          name: "🏆 Achievements Unlocked",
          value: this.getAchievements(stats),
          inline: false,
        }
      )
      .setFooter({
        text: "Continue your journey to unlock more mystical insights! ✨",
      });

    // Add progress bar for collection completion
    const progress = Math.round((stats.uniqueCards / 78) * 100);
    const progressBar = this.createProgressBar(progress);

    embed.addFields({
      name: "🔮 Collection Completion",
      value: `${progressBar} **${progress}%**\n*${
        78 - stats.uniqueCards
      } cards remaining to discover*`,
      inline: false,
    });

    // Add motivation based on progress
    let motivationText = "🌟 Keep exploring to discover new cards!";
    if (progress >= 80)
      motivationText = "🏆 Amazing! You're almost a complete master!";
    else if (progress >= 60)
      motivationText = "⭐ Excellent progress! You're becoming quite skilled!";
    else if (progress >= 40)
      motivationText = "🌙 Good work! You're on a great mystical path!";
    else if (progress >= 20)
      motivationText = "🌱 Nice start! Many mysteries await discovery!";

    embed.addFields({
      name: "💫 Motivation",
      value: motivationText,
      inline: false,
    });

    await interaction.editReply({ embeds: [embed] });
  },

  async handlePreferences(interaction, db, userId) {
    const preferences = await db.getUserPreferences(userId);

    // Create preference selection menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`deck_preferences_${userId}`)
      .setPlaceholder("Choose a preference to modify...")
      .addOptions([
        {
          label: "Reading Style",
          description: "Detailed vs. Quick readings",
          value: "reading_style",
          emoji: "📖",
        },
        {
          label: "Card Orientation",
          description: "Include reversed cards or not",
          value: "card_orientation",
          emoji: "🔄",
        },
        {
          label: "AI Insights",
          description: "Enable/disable AI-enhanced interpretations",
          value: "ai_insights",
          emoji: "✨",
        },
        {
          label: "Notifications",
          description: "Reading reminders and updates",
          value: "notifications",
          emoji: "🔔",
        },
        {
          label: "Language",
          description: "Choose your preferred language",
          value: "language",
          emoji: "🌍",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(0x4b0082)
      .setTitle("⚙️ Reading Preferences")
      .setDescription("Customize your tarot reading experience")
      .addFields(
        {
          name: "📖 Current Reading Style",
          value: preferences?.reading_style || "Detailed",
          inline: true,
        },
        {
          name: "🔄 Card Orientation",
          value: preferences?.allow_reversed
            ? "Include Reversed"
            : "Upright Only",
          inline: true,
        },
        {
          name: "✨ AI Insights",
          value: preferences?.ai_insights ? "Enabled" : "Disabled",
          inline: true,
        }
      )
      .setFooter({ text: "Select an option below to modify your preferences" });

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },

  async handleUnlock(interaction, db, userId) {
    await interaction.deferReply();

    const stats = await db.getUserCardStats(userId);
    const preferences = await db.getUserPreferences(userId);
    const unlockedThemes = preferences?.unlocked_themes || ["classic"];

    const allThemes = [
      "classic",
      "ethereal",
      "mystic",
      "tropical",
      "cosmic",
      "ancient",
      "nature",
      "nouveau",
    ];
    const lockedThemes = allThemes.filter(
      (theme) => !unlockedThemes.includes(theme)
    );

    const embed = new EmbedBuilder()
      .setColor(0x4b0082)
      .setTitle("🗝️ Unlock New Features")
      .setDescription(
        "Complete achievements to unlock new deck themes and features!"
      )
      .addFields({
        name: "🎨 Available Themes",
        value: unlockedThemes
          .map((theme) => `✅ ${this.getThemeName(theme)}`)
          .join("\n"),
        inline: true,
      });

    if (lockedThemes.length > 0) {
      embed.addFields({
        name: "🔒 Locked Themes",
        value: lockedThemes
          .map(
            (theme) =>
              `🔒 ${this.getThemeName(theme)}\n   *${this.getUnlockRequirement(
                theme
              )}*`
          )
          .join("\n"),
        inline: true,
      });
    }

    // Check for new unlocks
    const newUnlocks = this.checkForNewUnlocks(stats, unlockedThemes);
    if (newUnlocks.length > 0) {
      await db.unlockThemes(userId, newUnlocks);

      embed.addFields({
        name: "🎉 New Unlocks!",
        value: newUnlocks
          .map((theme) => `🆕 ${this.getThemeName(theme)}`)
          .join("\n"),
        inline: false,
      });

      embed.setColor(0x00ff00);
    }

    await interaction.editReply({ embeds: [embed] });
  },

  // Helper methods
  getThemeData(theme) {
    const themes = {
      classic: {
        name: "Classic Rider-Waite",
        description: "Traditional tarot imagery with timeless symbolism",
        color: 0x8b4513,
        preview: "https://example.com/classic-preview.jpg",
      },
      ethereal: {
        name: "Ethereal Dreams",
        description:
          "Soft, dreamy artwork with pastel colors and flowing designs",
        color: 0xe6e6fa,
        preview: "https://example.com/ethereal-preview.jpg",
      },
      mystic: {
        name: "Mystic Shadows",
        description: "Dark, mysterious imagery with deep purples and blacks",
        color: 0x4b0082,
        preview: "https://example.com/mystic-preview.jpg",
      },
      tropical: {
        name: "Tropical Paradise",
        description:
          "Vibrant tropical themes with lush greens and bright colors",
        color: 0x00ff7f,
        preview: "https://example.com/tropical-preview.jpg",
      },
      cosmic: {
        name: "Cosmic Journey",
        description:
          "Space-themed deck with stars, galaxies, and cosmic energy",
        color: 0x191970,
        preview: "https://example.com/cosmic-preview.jpg",
      },
      ancient: {
        name: "Ancient Wisdom",
        description:
          "Egyptian and ancient civilization themes with gold accents",
        color: 0xffd700,
        preview: "https://example.com/ancient-preview.jpg",
      },
      nature: {
        name: "Nature's Path",
        description: "Earth-based imagery with natural elements and seasons",
        color: 0x228b22,
        preview: "https://example.com/nature-preview.jpg",
      },
      nouveau: {
        name: "Art Nouveau",
        description:
          "Elegant Art Nouveau style with intricate decorative elements",
        color: 0x8b008b,
        preview: "https://example.com/nouveau-preview.jpg",
      },
    };

    return themes[theme] || themes.classic;
  },

  getThemeName(theme) {
    return this.getThemeData(theme).name;
  },

  getUnlockRequirement(theme) {
    const requirements = {
      ethereal: "Complete 25 readings",
      mystic: "Complete 50 readings",
      tropical: "Complete 10 daily readings",
      cosmic: "Complete 100 readings",
      ancient: "Encounter all Major Arcana cards",
      nature: "Complete 20 readings with nature-themed cards",
      nouveau: "Complete 200 readings",
    };

    return requirements[theme] || "Complete more readings";
  },

  checkForNewUnlocks(stats, currentUnlocks) {
    const newUnlocks = [];

    if (stats.totalReadings >= 25 && !currentUnlocks.includes("ethereal")) {
      newUnlocks.push("ethereal");
    }
    if (stats.totalReadings >= 50 && !currentUnlocks.includes("mystic")) {
      newUnlocks.push("mystic");
    }
    if (stats.dailyReadings >= 10 && !currentUnlocks.includes("tropical")) {
      newUnlocks.push("tropical");
    }
    if (stats.totalReadings >= 100 && !currentUnlocks.includes("cosmic")) {
      newUnlocks.push("cosmic");
    }
    if (stats.majorArcanaCount >= 22 && !currentUnlocks.includes("ancient")) {
      newUnlocks.push("ancient");
    }
    if (stats.totalReadings >= 200 && !currentUnlocks.includes("nouveau")) {
      newUnlocks.push("nouveau");
    }

    return newUnlocks;
  },

  createProgressBar(percentage) {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  },

  getAchievements(stats) {
    const achievements = [];

    if (stats.totalReadings >= 10) achievements.push("🌟 Novice Reader");
    if (stats.totalReadings >= 50) achievements.push("⭐ Experienced Reader");
    if (stats.totalReadings >= 100) achievements.push("🏆 Master Reader");
    if (stats.uniqueCards >= 39) achievements.push("🃏 Half Deck Explorer");
    if (stats.uniqueCards >= 78) achievements.push("🎯 Complete Collection");

    return achievements.length > 0
      ? achievements.join("\n")
      : "Start reading to earn achievements!";
  },

  async viewFavorites(interaction, db, userId) {
    const favorites = await db.getUserFavorites(userId);

    if (favorites.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x4b0082)
        .setTitle("⭐ Your Favorite Cards")
        .setDescription("You haven't added any favorite cards yet.")
        .setFooter({ text: "Use /deck favorites add <card> to add favorites" });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x4b0082)
      .setTitle("⭐ Your Favorite Cards")
      .setDescription(`You have ${favorites.length} favorite card(s)`)
      .addFields({
        name: "🃏 Favorite Cards",
        value: favorites.map((card) => `⭐ ${card.name}`).join("\n"),
        inline: false,
      })
      .setFooter({ text: "These cards hold special meaning for you" });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async addFavorite(interaction, db, userId, cardName) {
    const success = await db.addUserFavorite(userId, cardName);

    if (success) {
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("⭐ Card Added to Favorites")
        .setDescription(`**${cardName}** has been added to your favorites!`)
        .setFooter({
          text: "This card now holds special significance in your journey",
        });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({
        content: "This card is already in your favorites or doesn't exist.",
        ephemeral: true,
      });
    }
  },

  async removeFavorite(interaction, db, userId, cardName) {
    const success = await db.removeUserFavorite(userId, cardName);

    if (success) {
      const embed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle("💔 Card Removed from Favorites")
        .setDescription(`**${cardName}** has been removed from your favorites.`)
        .setFooter({ text: "You can always add it back later" });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({
        content: "This card is not in your favorites.",
        ephemeral: true,
      });
    }
  },

  async clearFavorites(interaction, db, userId) {
    // Create confirmation buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_clear_favorites_${userId}`)
        .setLabel("Yes, Clear All")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🗑️"),
      new ButtonBuilder()
        .setCustomId(`cancel_clear_favorites_${userId}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("❌")
    );

    const embed = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle("🗑️ Clear All Favorites")
      .setDescription(
        "Are you sure you want to remove all cards from your favorites?"
      )
      .addFields({
        name: "⚠️ Warning",
        value: "This action cannot be undone.",
        inline: false,
      })
      .setFooter({ text: "Choose carefully" });

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const cardUtils = require("../utils/cardUtils");

    const allCards = cardUtils.allCards || [];
    const filtered = allCards
      .filter((card) => card.name.toLowerCase().includes(focusedValue))
      .slice(0, 25)
      .map((card) => ({
        name: card.name,
        value: card.name,
      }));

    await interaction.respond(filtered);
  },
};
