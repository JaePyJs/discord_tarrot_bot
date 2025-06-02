const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
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
    const customId = interaction.customId; // Navigation buttons
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

    // Special reading buttons
    if (customId.startsWith("get_reflection_")) {
      const readingId = customId.split("_")[2];
      return await this.handleReflectionButton(interaction, readingId);
    }

    if (customId.startsWith("save_reading_")) {
      const readingId = customId.split("_")[2];
      return await this.handleSaveReadingButton(interaction, readingId);
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
      flags: MessageFlags.Ephemeral,
    });
  }

  // Handle button interactions for reading navigation
  async handleReadingNavigation(interaction) {
    try {
      const [action, readingId, cardIndex] = interaction.customId.split("_");
      const currentIndex = parseInt(cardIndex);

      // Get the reading data from all embeds
      const embeds = interaction.message.embeds;
      if (!embeds || embeds.length === 0) {
        return await interaction.reply({
          content: "Reading data not found.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Extract cards from embed fields - try main embed first, then individual card embeds
      let cards = this.extractCardsFromEmbed(embeds[0]);
      
      // If no cards found in main embed, try to extract from individual card embeds
      if (!cards || cards.length === 0) {
        cards = this.extractCardsFromAllEmbeds(embeds);
      }
      
      if (!cards || cards.length === 0) {
        // Enhanced error message with debugging info
        console.log("Button handler debug info:", {
          embedCount: embeds.length,
          firstEmbedTitle: embeds[0]?.title,
          firstEmbedFields: embeds[0]?.fields?.length || 0,
          allEmbedTitles: embeds.map(e => e.title)
        });
        
        return await interaction.reply({
          content: "Unable to find card information in this reading. This may be due to an older message format or a temporary issue. Please try generating a new reading.",
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

    try {
      // First, try to extract cards from the main embed's "🎴 Cards in This Reading" field
      if (embed.fields) {
        for (const field of embed.fields) {
          if (field.name === "🎴 Cards in This Reading") {
            const lines = field.value.split("\n");
            for (const line of lines) {
              // Parse format: "**Position**: Card Name ⬆️" or "**Position**: Card Name 🔄"
              const match = line.match(/\*\*(.*?)\*\*:\s*(.*?)(?:\s*[⬆️🔄])?$/);
              if (match) {
                const position = match[1].trim();
                const cardName = match[2].trim();
                if (cardName && !cardName.includes("... and")) {
                  cards.push({
                    name: cardName,
                    position: position,
                    meaning: "", // Will be filled from individual embeds if available
                  });
                }
              }
            }
            break;
          }
        }
      }

      // If no cards found in main embed, try to extract from legacy format
      if (cards.length === 0 && embed.fields) {
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
      }

      // Log for debugging
      if (cards.length === 0) {
        console.log("No cards extracted from embed. Embed structure:", {
          title: embed.title,
          fieldNames: embed.fields?.map(f => f.name) || [],
          fieldCount: embed.fields?.length || 0
        });
      }

    } catch (error) {
      console.error("Error extracting cards from embed:", error);
    }

    return cards;
  }

// Extract cards from all embeds (handles individual card embeds)
  extractCardsFromAllEmbeds(embeds) {
    const cards = [];

    try {
      for (let i = 1; i < embeds.length; i++) { // Skip first embed (main overview)
        const embed = embeds[i];
        
        // Skip AI interpretation and summary embeds
        if (embed.title?.includes("AI-Enhanced Interpretation") || 
            embed.title?.includes("Final Cards Summary")) {
          continue;
        }

        // Parse card embed title format: "🎯 Position: Card Name" or just "Card Name (Reversed)"
        if (embed.title) {
          let cardName = "";
          let position = "";
          let isReversed = false;

          // Check for position format: "🎯 Position: Card Name"
          const positionMatch = embed.title.match(/🎯\s*(.*?):\s*(.*?)(?:\s*\(Reversed\))?$/);
          if (positionMatch) {
            position = positionMatch[1].trim();
            cardName = positionMatch[2].trim();
            isReversed = embed.title.includes("(Reversed)");
          } else {
            // Fallback: just card name
            cardName = embed.title.replace(/\(Reversed\)$/, "").trim();
            isReversed = embed.title.includes("(Reversed)");
            position = `Card ${cards.length + 1}`;
          }

          if (cardName) {
            // Extract meaning from embed description
            const meaning = embed.description || "";

            cards.push({
              name: cardName,
              position: position,
              meaning: meaning,
              isReversed: isReversed,
              // Add additional fields from embed if available
              fields: embed.fields || []
            });
          }
        }
      }

      // Log for debugging
      if (cards.length === 0) {
        console.log("No cards extracted from individual embeds. Embed count:", embeds.length);
        console.log("Embed titles:", embeds.map(e => e.title));
      } else {
        console.log(`Extracted ${cards.length} cards from individual embeds`);
      }

    } catch (error) {
      console.error("Error extracting cards from all embeds:", error);
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

  // Handle reflection button interactions
  async handleReflectionButton(interaction, readingId) {
    try {
      const userId = interaction.user.id;
      const reading = await this.db.getReadingById(readingId);

      if (!reading) {
        return await interaction.reply({
          content: "❌ This reading could not be found.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Create a modal for user to enter reflection
      const modal = new ModalBuilder()
        .setCustomId(`reflection_modal_${readingId}`)
        .setTitle("Add Your Reflection");

      const reflectionInput = new TextInputBuilder()
        .setCustomId("reflection_text")
        .setLabel("What insights did you gain from this reading?")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(
          "Share your thoughts on how these cards relate to your situation..."
        )
        .setRequired(true)
        .setMaxLength(1000);

      const firstActionRow = new ActionRowBuilder().addComponents(
        reflectionInput
      );
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    } catch (error) {
      logger.error("Error handling reflection button:", error);
      await interaction.reply({
        content: "❌ An error occurred while processing your reflection.",
        ephemeral: true,
      });
    }
  }

  // Handle save reading button interactions
  async handleSaveReadingButton(interaction, readingId) {
    try {
      const userId = interaction.user.id;
      const reading = await this.db.getReadingById(readingId);

      if (!reading) {
        return await interaction.reply({
          content: "❌ This reading could not be found.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Save the reading to the user's journal
      await this.db.saveReadingToJournal(userId, readingId);

      // Add achievement progress
      await this.gamification.addProgress(userId, "journal_entries", 1);

      await interaction.reply({
        content:
          "✅ Reading saved to your journal! Use `/journal view` to see your saved readings.",
        ephemeral: true,
      });
    } catch (error) {
      logger.error("Error handling save reading button:", error);
      await interaction.reply({
        content: "❌ An error occurred while saving your reading.",
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
