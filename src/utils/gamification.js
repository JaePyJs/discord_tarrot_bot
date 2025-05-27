const DatabaseManager = require("../database/DatabaseManager");
const logger = require("./logger");
const moment = require("moment-timezone");

class GamificationManager {
  constructor() {
    this.db = new DatabaseManager();
  }

  // Check and update daily streak
  async updateDailyStreak(userId) {
    try {
      const today = moment().format("YYYY-MM-DD");
      const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

      const lastReading = await this.db.getLastReadingDate(userId);
      const currentStreak = (await this.db.getUserStreak(userId)) || 0;

      let newStreak = 1;

      if (lastReading) {
        const lastReadingDate = moment(lastReading).format("YYYY-MM-DD");

        if (lastReadingDate === yesterday) {
          // Continue streak
          newStreak = currentStreak + 1;
        } else if (lastReadingDate === today) {
          // Already read today, maintain streak
          newStreak = currentStreak;
        } else {
          // Streak broken, reset to 1
          newStreak = 1;
        }
      }

      await this.db.updateUserStreak(userId, newStreak);
      return newStreak;
    } catch (error) {
      logger.error("Error updating daily streak:", error);
      return 1;
    }
  }

  // Get seasonal theme based on current date
  getSeasonalTheme() {
    const month = new Date().getMonth() + 1; // 1-12
    const day = new Date().getDate();

    // Halloween Season
    if (month === 10) {
      return {
        name: "🎃 Halloween Mystique",
        color: 0xff4500,
        description: "The veil between worlds is thin...",
        bonus: "Reversed cards are 20% more likely",
        active: true,
      };
    }

    // Winter Solstice
    if (month === 12 && day >= 20) {
      return {
        name: "❄️ Winter Solstice",
        color: 0x4682b4,
        description: "The longest night brings deepest wisdom",
        bonus: "Major Arcana cards appear more frequently",
        active: true,
      };
    }

    // Spring Equinox
    if (month === 3 && day >= 19 && day <= 22) {
      return {
        name: "🌸 Spring Awakening",
        color: 0x98fb98,
        description: "New beginnings bloom eternal",
        bonus: "Cups suit cards bring extra healing energy",
        active: true,
      };
    }

    // Summer Solstice
    if (month === 6 && day >= 19 && day <= 22) {
      return {
        name: "☀️ Summer Radiance",
        color: 0xffd700,
        description: "The sun's power illuminates all paths",
        bonus: "Wands suit cards burn brighter",
        active: true,
      };
    }

    // Full Moon bonus (approximate - every 29.5 days)
    const fullMoonDay = this.getNextFullMoon();
    if (Math.abs(day - fullMoonDay) <= 1) {
      return {
        name: "🌕 Full Moon Power",
        color: 0xc0c0c0,
        description: "Lunar energy enhances intuition",
        bonus: "All readings have enhanced spiritual clarity",
        active: true,
      };
    }

    return null;
  }

  // Simple full moon calculation (approximation)
  getNextFullMoon() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();

    // Simplified calculation - in production, use a proper lunar calendar API
    const approximateFullMoons = [14, 13, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5];

    return approximateFullMoons[month];
  }

  // Check for new achievements
  async checkAchievements(userId, stats, readingType) {
    const newAchievements = [];
    const currentAchievements =
      (await this.db.getUserAchievements(userId)) || [];

    const achievements = [
      {
        id: "first_reading",
        name: "🌟 First Steps",
        description: "Complete your first tarot reading",
        condition: () => stats.totalReadings >= 1,
        reward: "Unlocked basic deck themes",
      },
      {
        id: "week_warrior",
        name: "📅 Week Warrior",
        description: "Maintain a 7-day reading streak",
        condition: () => stats.currentStreak >= 7,
        reward: "Unlocked Mystic theme",
      },
      {
        id: "month_master",
        name: "🏆 Month Master",
        description: "Maintain a 30-day reading streak",
        condition: () => stats.currentStreak >= 30,
        reward: "Unlocked Cosmic theme",
      },
      {
        id: "card_collector",
        name: "🃏 Card Collector",
        description: "Encounter all 78 tarot cards",
        condition: () => stats.uniqueCards >= 78,
        reward: "Unlocked Ancient Wisdom theme",
      },
      {
        id: "major_arcana_master",
        name: "🎯 Major Arcana Master",
        description: "Encounter all 22 Major Arcana cards",
        condition: () => stats.majorArcanaCount >= 22,
        reward: "Unlocked premium card interpretations",
      },
      {
        id: "relationship_expert",
        name: "💕 Relationship Expert",
        description: "Complete 10 relationship readings",
        condition: () => stats.relationshipReadings >= 10,
        reward: "Unlocked advanced relationship spreads",
      },
      {
        id: "daily_devotee",
        name: "🌅 Daily Devotee",
        description: "Complete 50 daily readings",
        condition: () => stats.dailyReadings >= 50,
        reward: "Unlocked personalized daily affirmations",
      },
      {
        id: "century_club",
        name: "💯 Century Club",
        description: "Complete 100 total readings",
        condition: () => stats.totalReadings >= 100,
        reward: "Unlocked master reader badge",
      },
      {
        id: "seasonal_reader",
        name: "🌸 Seasonal Reader",
        description: "Read during all four seasonal events",
        condition: () => stats.seasonalReadings >= 4,
        reward: "Unlocked seasonal deck themes",
      },
    ];

    for (const achievement of achievements) {
      if (
        !currentAchievements.includes(achievement.id) &&
        achievement.condition()
      ) {
        newAchievements.push(achievement);
        await this.db.addUserAchievement(userId, achievement.id);
      }
    }

    return newAchievements;
  }

  // Generate achievement embed
  createAchievementEmbed(achievements, user) {
    if (achievements.length === 0) return null;

    const { EmbedBuilder } = require("discord.js");

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🎉 New Achievement Unlocked!")
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    achievements.forEach((achievement) => {
      embed.addFields({
        name: achievement.name,
        value: `${achievement.description}\n🎁 **Reward:** ${achievement.reward}`,
        inline: false,
      });
    });

    return embed;
  }

  // Get reading bonus based on streak and season
  getReadingBonuses(streak, readingType) {
    const bonuses = [];

    // Streak bonuses
    if (streak >= 7) {
      bonuses.push({
        type: "streak",
        name: "🔥 Week Warrior Bonus",
        description: "Enhanced card insight clarity",
      });
    }

    if (streak >= 30) {
      bonuses.push({
        type: "streak",
        name: "💎 Month Master Bonus",
        description: "Increased spiritual connection",
      });
    }

    // Seasonal bonuses
    const seasonalTheme = this.getSeasonalTheme();
    if (seasonalTheme && seasonalTheme.active) {
      bonuses.push({
        type: "seasonal",
        name: seasonalTheme.name,
        description: seasonalTheme.bonus,
      });
    }

    // Reading type bonuses
    if (readingType === "daily" && new Date().getHours() < 10) {
      bonuses.push({
        type: "timing",
        name: "🌅 Early Bird Bonus",
        description: "Morning readings carry extra wisdom",
      });
    }

    return bonuses;
  }

  // Create bonus display embed
  createBonusEmbed(bonuses) {
    if (bonuses.length === 0) return null;

    const { EmbedBuilder } = require("discord.js");

    const embed = new EmbedBuilder()
      .setColor(0x00ff7f)
      .setTitle("✨ Active Bonuses")
      .setDescription("Your reading is enhanced by these cosmic influences:");

    bonuses.forEach((bonus) => {
      embed.addFields({
        name: bonus.name,
        value: bonus.description,
        inline: true,
      });
    });

    return embed;
  }

  // Generate daily quest
  async generateDailyQuest(userId) {
    const quests = [
      {
        id: "draw_major_arcana",
        name: "🎯 Seek the Major Arcana",
        description: "Draw a Major Arcana card in any reading",
        reward: "Bonus spiritual insight",
        progress: 0,
        target: 1,
      },
      {
        id: "three_readings",
        name: "🃏 Triple Wisdom",
        description: "Complete 3 readings today",
        reward: "Unlock tomorrow's preview card",
        progress: 0,
        target: 3,
      },
      {
        id: "share_reading",
        name: "📤 Share the Wisdom",
        description: "Share a reading with the community",
        reward: "Community karma boost",
        progress: 0,
        target: 1,
      },
      {
        id: "try_new_spread",
        name: "🆕 Explore New Paths",
        description: "Try a spread you haven't used in 7 days",
        reward: "Expanded perspective bonus",
        progress: 0,
        target: 1,
      },
    ];

    // Randomly select a quest (in production, use more sophisticated selection)
    const questIndex = Math.floor(Math.random() * quests.length);
    const selectedQuest = quests[questIndex];

    await this.db.setUserDailyQuest(userId, selectedQuest);
    return selectedQuest;
  }

  // Update quest progress
  async updateQuestProgress(userId, questType, increment = 1) {
    try {
      const quest = await this.db.getUserDailyQuest(userId);
      if (!quest || quest.id !== questType) return null;

      quest.progress = Math.min(quest.progress + increment, quest.target);
      await this.db.updateUserDailyQuest(userId, quest);

      if (quest.progress >= quest.target) {
        await this.db.completeUserDailyQuest(userId);
        return { completed: true, quest };
      }

      return { completed: false, quest };
    } catch (error) {
      logger.error("Error updating quest progress:", error);
      return null;
    }
  }
}

module.exports = GamificationManager;
