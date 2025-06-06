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

  // Main handler for all button interactions
  async handleButtonInteraction(interaction) {
    try {
      const { customId } = interaction;
      logger.info(`Processing button interaction: ${customId}`);

      // Route to appropriate handler based on button customId
      if (customId.startsWith('nav_next_') || customId.startsWith('nav_prev_')) {
        return this.handleReadingNavigation(interaction);
      } else if (customId.startsWith('reflection_')) {
        return this.handleReflectionButton(interaction, customId.split('_')[1]);
      } else if (customId.startsWith('save_')) {
        return this.handleSaveReadingButton(interaction, customId.split('_')[1]);
      } else if (customId.startsWith('quest_')) {
        return this.handleQuestButtons(interaction);
      } else if (customId.startsWith('achievement_')) {
        return this.handleAchievementButtons(interaction);
      }

      // If we get here, no handler was found
      logger.warn(`No handler found for button: ${customId}`);
      return interaction.reply({
        content: "This button isn't working right now. Please try again later.",
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error in handleButtonInteraction:', error);
      if (!interaction.replied) {
        return interaction.reply({
          content: "An error occurred while processing your request.",
          ephemeral: true
        });
      }
    }
  }

  // Handle reading navigation
  async handleReadingNavigation(interaction) {
    try {
      const [nav, direction, readingId, cardIndex] = interaction.customId.split("_");
      const currentIndex = parseInt(cardIndex, 10);

      logger.info('Processing navigation', { direction, readingId, currentIndex });

      const embeds = interaction.message.embeds;
      if (!embeds || embeds.length === 0) {
        return interaction.reply({
          content: "Reading data not found.",
          ephemeral: true
        });
      }

      // Update the view based on the action
      let newIndex = currentIndex;
      if (action === 'next') {
        newIndex++;
      } else if (action === 'prev') {
        newIndex--;
      }

      // Update the message with the new card
      await interaction.update({
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`nav_prev_${readingId}_${newIndex}`)
              .setLabel('Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(newIndex <= 0),
            new ButtonBuilder()
              .setCustomId(`nav_next_${readingId}_${newIndex}`)
              .setLabel('Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(newIndex >= embeds.length - 1)
          )
        ]
      });
    } catch (error) {
      logger.error('Error in handleReadingNavigation:', error);
      if (!interaction.replied) {
        return interaction.reply({
          content: "An error occurred while navigating the reading.",
          ephemeral: true
        });
      }
    }
  }

  // Handle reflection button
  async handleReflectionButton(interaction, readingId) {
    try {
      const modal = new ModalBuilder()
        .setCustomId(`reflection_modal_${readingId}`)
        .setTitle('Add Your Reflection');

      const reflectionInput = new TextInputBuilder()
        .setCustomId('reflection_text')
        .setLabel('Share your thoughts about this reading')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('What insights did you gain from this reading?')
        .setRequired(true)
        .setMaxLength(1000);

      const actionRow = new ActionRowBuilder().addComponents(reflectionInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    } catch (error) {
      logger.error('Error in handleReflectionButton:', error);
      if (!interaction.replied) {
        return interaction.reply({
          content: "An error occurred while opening the reflection form.",
          ephemeral: true
        });
      }
    }
  }

  // Handle save reading button
  async handleSaveReadingButton(interaction, readingId) {
    try {
      const userId = interaction.user.id;
      await this.db.saveReadingToJournal(userId, readingId);
      
      // Update gamification
      await this.gamification.addProgress(userId, 'journal_entries', 1);
      
      return interaction.reply({
        content: '✅ Reading saved to your journal!',
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error in handleSaveReadingButton:', error);
      if (!interaction.replied) {
        return interaction.reply({
          content: 'An error occurred while saving your reading.',
          ephemeral: true
        });
      }
    }
  }

  // Handle quest buttons
  async handleQuestButtons(interaction) {
    try {
      const [_, action, questId] = interaction.customId.split('_');
      const userId = interaction.user.id;
      
      switch (action) {
        case 'accept':
          await this.gamification.acceptQuest(userId, questId);
          return interaction.reply({
            content: '✅ Quest accepted! Check your progress with `/profile`.'
          });
        case 'complete':
          const result = await this.gamification.completeQuest(userId, questId);
          if (result.success) {
            return interaction.reply({
              embeds: [this.createQuestCompletionEmbed(result.quest)],
              ephemeral: true
            });
          }
          return interaction.reply({
            content: '❌ Could not complete quest. Make sure you meet all requirements.',
            ephemeral: true
          });
        default:
          return interaction.reply({
            content: 'Unknown quest action.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error in handleQuestButtons:', error);
      if (!interaction.replied) {
        return interaction.reply({
          content: 'An error occurred while processing the quest.',
          ephemeral: true
        });
      }
    }
  }

  // Handle achievement buttons
  async handleAchievementButtons(interaction) {
    try {
      const [_, action, achievementId] = interaction.customId.split('_');
      
      if (action === 'view') {
        const achievement = await this.gamification.getAchievement(achievementId);
        if (!achievement) {
          return interaction.reply({
            content: 'Achievement not found.',
            ephemeral: true
          });
        }
        
        const embed = new EmbedBuilder()
          .setTitle(`🏆 ${achievement.name}`)
          .setDescription(achievement.description)
          .setColor(0xffd700);
          
        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }
      
      return interaction.reply({
        content: 'Unknown achievement action.',
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error in handleAchievementButtons:', error);
      if (!interaction.replied) {
        return interaction.reply({
          content: 'An error occurred while processing the achievement.',
          ephemeral: true
        });
      }
    }
  }

  // Helper to create quest completion embed
  createQuestCompletionEmbed(quest) {
    return new EmbedBuilder()
      .setTitle('🎉 Quest Completed!')
      .setDescription(`**${quest.name}**\n${quest.description}`)
      .setColor(0x00ff7f)
      .addFields({
        name: '🎁 Reward',
        value: quest.reward || 'No reward specified',
        inline: false
      });
  }
}

// Create and export a singleton instance
const buttonHandlers = new ButtonHandlers();

// Export the main handler function
async function handleButtonInteraction(interaction) {
  return buttonHandlers.handleButtonInteraction(interaction);
}

module.exports = { handleButtonInteraction, ButtonHandlers };
