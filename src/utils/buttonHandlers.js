const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getCardDescription } = require("./cardUtils");
const DatabaseManager = require("../database/DatabaseManager");
const GamificationManager = require("./gamification");
const logger = require("./logger");

class ButtonHandlers {
  constructor() {
    this.db = new DatabaseManager();
    this.gamification = new GamificationManager();
  }

  // Main handler function for all button interactions
  async handleButtonInteraction(interaction) {
    const customId = interaction.customId;

    // Navigation buttons
    if (
      customId.startsWith("prev_") ||
      customId.startsWith("next_") ||
      customId.startsWith("first_") ||
      customId.startsWith("last_") ||
      customId.startsWith("overview_") ||
      customId.startsWith("favorite_") ||
      customId.startsWith("share_")
    ) {
      return await this.handleReadingNavigation(interaction);
    }

    // Quest related buttons
    if (customId.startsWith("quest_")) {
      return await this.handleQuestButtons(interaction);
    }

    // Achievement related buttons
    if (customId.startsWith("achievement_")) {
      return await this.handleAchievementButtons(interaction);
    } // Other buttons can be handled here
    logger.warn(`Unhandled button interaction: ${customId}`);
    await interaction.reply({
      content:
        "🔮 This mystical button's power is still being channeled. Please try again later or use an alternative action.",
      ephemeral: true,
    });
  }

  // Handle button interactions for reading navigation
  async handleReadingNavigation(interaction) {
    try {
      const [action, readingId, cardIndex] = interaction.customId.split("_");
      const currentIndex = parseInt(cardIndex);

      // Get the reading data from the embed
      const embed = interaction.message.embeds[0];
      if (!embed || !embed.fields) {
        return await interaction.reply({
          content: "Reading data not found.",
          ephemeral: true,
        });
      }

      // Extract cards from embed fields
      const cards = this.extractCardsFromEmbed(embed);
      if (!cards || cards.length === 0) {
        return await interaction.reply({
          content: "No cards found in this reading.",
          ephemeral: true,
        });
      }

      let newIndex = currentIndex;

      switch (action) {
        case "prev":
          newIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
          break;
        case "next":
          newIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
          break;
        case "first":
          newIndex = 0;
          break;
        case "last":
          newIndex = cards.length - 1;
          break;
        case "overview":
          return await this.showReadingOverview(interaction, cards, embed);
        case "favorite":
          return await this.addCardToFavorites(
            interaction,
            cards[currentIndex]
          );
        case "share":
          return await this.shareReading(interaction, cards, embed);
        default:
          return await interaction.reply({
            content: "Unknown action.",
            ephemeral: true,
          });
      }

      // Create detailed card view
      const cardEmbed = await this.createDetailedCardEmbed(
        cards[newIndex],
        newIndex,
        cards.length,
        embed
      );
      const navigationRow = this.createNavigationButtons(
        readingId,
        newIndex,
        cards.length
      );

      await interaction.update({
        embeds: [cardEmbed],
        components: [navigationRow],
      });
    } catch (error) {
      logger.error("Error handling reading navigation:", error);
      await interaction
        .reply({
          content: "An error occurred while navigating the reading.",
          ephemeral: true,
        })
        .catch(() => {});
    }
  }

  // Extract cards from embed fields
  extractCardsFromEmbed(embed) {
    const cards = [];

    for (const field of embed.fields) {
      // Skip fields that don't contain card information
      if (field.name.includes("Position:") || field.name.includes("Card:")) {
        const lines = field.value.split("\n");
        let cardName = "";
        let position = "";
        let meaning = "";

        for (const line of lines) {
          if (line.startsWith("**Card:**")) {
            cardName = line.replace("**Card:**", "").trim();
          } else if (line.startsWith("**Position:**")) {
            position = line.replace("**Position:**", "").trim();
          } else if (line.startsWith("**Meaning:**")) {
            meaning = line.replace("**Meaning:**", "").trim();
          }
        }

        if (cardName) {
          cards.push({
            name: cardName,
            position: position || `Card ${cards.length + 1}`,
            meaning: meaning,
          });
        }
      }
    }

    return cards;
  }

  // Create detailed card embed
  async createDetailedCardEmbed(card, currentIndex, totalCards, originalEmbed) {
    const cardData = await getCardDescription(card.name);

    const embed = new EmbedBuilder()
      .setTitle(`${card.name} - Detailed View`)
      .setDescription(
        `**Position:** ${card.position}\n\n${
          cardData ? cardData.description : card.meaning
        }`
      )
      .setColor(originalEmbed.color || 0x9b59b6)
      .setFooter({
        text: `Card ${currentIndex + 1} of ${totalCards} • ${
          originalEmbed.footer?.text || "Tarot Reading"
        }`,
      })
      .setTimestamp(new Date(originalEmbed.timestamp));

    if (cardData) {
      if (cardData.keywords) {
        embed.addFields({
          name: "🔑 Keywords",
          value: cardData.keywords.join(", "),
          inline: false,
        });
      }

      if (cardData.upright) {
        embed.addFields({
          name: "⬆️ Upright Meaning",
          value: cardData.upright,
          inline: true,
        });
      }

      if (cardData.reversed) {
        embed.addFields({
          name: "⬇️ Reversed Meaning",
          value: cardData.reversed,
          inline: true,
        });
      }

      if (cardData.advice) {
        embed.addFields({
          name: "💡 Advice",
          value: cardData.advice,
          inline: false,
        });
      }
    }

    return embed;
  }

  // Create navigation buttons
  createNavigationButtons(readingId, currentIndex, totalCards) {
    const row = new ActionRowBuilder();

    // Previous button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`prev_${readingId}_${currentIndex}`)
        .setLabel("◀ Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(totalCards <= 1)
    );

    // Overview button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`overview_${readingId}_${currentIndex}`)
        .setLabel("📋 Overview")
        .setStyle(ButtonStyle.Primary)
    );

    // Next button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`next_${readingId}_${currentIndex}`)
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(totalCards <= 1)
    );

    // Favorite button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`favorite_${readingId}_${currentIndex}`)
        .setLabel("⭐ Favorite")
        .setStyle(ButtonStyle.Success)
    );

    // Share button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`share_${readingId}_${currentIndex}`)
        .setLabel("📤 Share")
        .setStyle(ButtonStyle.Secondary)
    );

    return row;
  }

  // Show reading overview
  async showReadingOverview(interaction, cards, originalEmbed) {
    const embed = new EmbedBuilder()
      .setTitle(originalEmbed.title || "Reading Overview")
      .setDescription(
        originalEmbed.description || "Your complete tarot reading"
      )
      .setColor(originalEmbed.color || 0x9b59b6)
      .setFooter(originalEmbed.footer)
      .setTimestamp(new Date(originalEmbed.timestamp));

    // Add all cards as fields
    cards.forEach((card, index) => {
      embed.addFields({
        name: `${index + 1}. ${card.position}`,
        value: `**${card.name}**\n${card.meaning.substring(0, 100)}${
          card.meaning.length > 100 ? "..." : ""
        }`,
        inline: true,
      });
    });

    // Create buttons for quick navigation
    const row = new ActionRowBuilder();

    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`first_reading_0`)
        .setLabel("📖 Detailed View")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  }

  // Add card to favorites
  async addCardToFavorites(interaction, card) {
    try {
      await this.db.query(
        this.db.dbType === "postgresql"
          ? "INSERT INTO user_favorites (user_id, card_name) VALUES ($1, $2) ON CONFLICT DO NOTHING"
          : "INSERT OR IGNORE INTO user_favorites (user_id, card_name) VALUES (?, ?)",
        [interaction.user.id, card.name]
      );

      await interaction.reply({
        content: `⭐ Added **${card.name}** to your favorites!`,
        ephemeral: true,
      });
    } catch (error) {
      logger.error("Error adding card to favorites:", error);
      await interaction.reply({
        content: "Failed to add card to favorites.",
        ephemeral: true,
      });
    }
  }

  // Share reading
  async shareReading(interaction, cards, originalEmbed) {
    const shareEmbed = new EmbedBuilder()
      .setTitle(`📤 ${interaction.user.displayName}'s Tarot Reading`)
      .setDescription(originalEmbed.description || "A shared tarot reading")
      .setColor(originalEmbed.color || 0x9b59b6)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    // Add summary of cards
    const cardSummary = cards
      .map((card, index) => `**${index + 1}.** ${card.name} - ${card.position}`)
      .join("\n");

    shareEmbed.addFields({
      name: "🃏 Cards Drawn",
      value: cardSummary,
      inline: false,
    });

    await interaction.reply({
      embeds: [shareEmbed],
    });
  }

  // Handle quest progress updates
  async updateQuestProgress(userId, questType, increment = 1) {
    try {
      const result = await this.gamification.updateQuestProgress(
        userId,
        questType,
        increment
      );

      if (result && result.completed) {
        return {
          questCompleted: true,
          quest: result.quest,
          embed: this.createQuestCompletionEmbed(result.quest),
        };
      }

      return { questCompleted: false };
    } catch (error) {
      logger.error("Error updating quest progress:", error);
      return { questCompleted: false };
    }
  }
  // Create quest completion embed
  createQuestCompletionEmbed(quest) {
    return new EmbedBuilder()
      .setTitle("🎉 Quest Completed!")
      .setDescription(`**${quest.name}**\n${quest.description}`)
      .setColor(0x00ff7f)
      .addFields({
        name: "🎁 Reward",
        value: quest.reward,
        inline: false,
      })
      .setTimestamp();
  }

  // Handle quest-related button interactions
  async handleQuestButtons(interaction) {
    const [, action, questId] = interaction.customId.split("_");
    const userId = interaction.user.id;

    try {
      switch (action) {
        case "accept":
          await this.gamification.acceptQuest(userId, questId);
          await interaction.reply({
            content: "✅ Quest accepted! Check your progress with `/profile`.",
            ephemeral: true,
          });
          break;
        case "complete":
          const result = await this.gamification.completeQuest(userId, questId);
          if (result.success) {
            await interaction.reply({
              embeds: [this.createQuestCompletionEmbed(result.quest)],
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content:
                "❌ Could not complete quest. Make sure you meet all requirements.",
              ephemeral: true,
            });
          }
          break;
        default:
          await interaction.reply({
            content: "Unknown quest action.",
            ephemeral: true,
          });
      }
    } catch (error) {
      logger.error("Error handling quest button:", error);
      await interaction.reply({
        content: "❌ An error occurred while processing the quest.",
        ephemeral: true,
      });
    }
  }

  // Handle achievement-related button interactions
  async handleAchievementButtons(interaction) {
    const [, action, achievementId] = interaction.customId.split("_");
    const userId = interaction.user.id;

    try {
      switch (action) {
        case "view":
          const achievement = await this.gamification.getAchievement(
            achievementId
          );
          if (achievement) {
            const embed = new EmbedBuilder()
              .setTitle(`🏆 ${achievement.name}`)
              .setDescription(achievement.description)
              .setColor(0xffd700)
              .addFields({
                name: "🎁 Reward",
                value: achievement.reward,
                inline: true,
              });

            await interaction.reply({
              embeds: [embed],
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: "Achievement not found.",
              ephemeral: true,
            });
          }
          break;
        default:
          await interaction.reply({
            content: "Unknown achievement action.",
            ephemeral: true,
          });
      }
    } catch (error) {
      logger.error("Error handling achievement button:", error);
      await interaction.reply({
        content: "❌ An error occurred while processing the achievement.",
        ephemeral: true,
      });
    }
  }
}

// Export the handler instance and main function
const buttonHandlers = new ButtonHandlers();

const handleButtonInteraction = async (interaction) => {
  return await buttonHandlers.handleButtonInteraction(interaction);
};

module.exports = { handleButtonInteraction, ButtonHandlers };
