const { EmbedBuilder } = require("discord.js");
const cardUtils = require("./cardUtils");
const logger = require("./logger");
const cron = require("node-cron");
const moment = require("moment-timezone");

class DailyCardManager {
  constructor(client) {
    this.client = client;
    this.isEnabled = process.env.DAILY_CARD_ENABLED === "true";
    this.dailyTime = process.env.DAILY_CARD_TIME || "09:00";
    this.timezone = process.env.TIMEZONE || "Asia/Manila";
    this.channelId = process.env.DAILY_CARD_CHANNEL;

    if (this.isEnabled && this.channelId) {
      this.scheduleDailyCard();
      logger.info("Daily card system initialized", {
        time: this.dailyTime,
        timezone: this.timezone,
        channel: this.channelId,
      });
    }
  }

  scheduleDailyCard() {
    // Parse time (HH:MM format)
    const [hour, minute] = this.dailyTime.split(":").map(Number);

    // Create cron expression (minute hour * * *)
    const cronExpression = `${minute} ${hour} * * *`;

    cron.schedule(
      cronExpression,
      async () => {
        await this.postDailyCard();
      },
      {
        timezone: this.timezone,
      }
    );

    logger.info(`Daily card scheduled for ${this.dailyTime} ${this.timezone}`);
  }

  async postDailyCard() {
    try {
      const channel = await this.client.channels.fetch(this.channelId);
      if (!channel) {
        logger.error("Daily card channel not found", {
          channelId: this.channelId,
        });
        return;
      }

      // Draw daily card
      const cards = cardUtils.dailyCardReading();
      const card = cards[0];

      // Get Philippines date and time
      const philippinesDate = moment().tz(this.timezone);
      const formattedDate = philippinesDate.format("dddd, MMMM Do, YYYY");
      const formattedTime = philippinesDate.format("h:mm A");

      // Create special daily card embed
      const embed = new EmbedBuilder()
        .setColor(parseInt(process.env.COLOR_UPRIGHT) || 0x4b0082)
        .setTitle("🌅 Daily Card of Guidance")
        .setDescription(
          `**${formattedDate}**\n*${formattedTime} Philippines Time*\n\nThe universe has drawn a card to guide your day...`
        )
        .addFields(
          {
            name: `${card.name}${card.isReversed ? " (Reversed)" : ""}`,
            value: card.isReversed
              ? card.reversed.meaning
              : card.upright.meaning,
            inline: false,
          },
          {
            name: "Keywords",
            value: card.isReversed
              ? card.reversed.keywords.join(", ")
              : card.upright.keywords.join(", "),
            inline: true,
          },
          {
            name: "Daily Reflection",
            value: this.getDailyReflection(card),
            inline: false,
          }
        )
        .setThumbnail(card.image_url || null)
        .setFooter({
          text: "Carry this wisdom with you today • For entertainment purposes only",
        })
        .setTimestamp();

      await channel.send({ embeds: [embed] });

      logger.success("Daily card posted successfully", {
        cardName: card.name,
        isReversed: card.isReversed,
        channelId: this.channelId,
      });
    } catch (error) {
      logger.error("Failed to post daily card", error);
    }
  }

  getDailyReflection(card) {
    const reflections = {
      upright: [
        "How can you embody this card's energy today?",
        "What opportunities does this card reveal?",
        "How might this guidance serve your highest good?",
        "What positive action can you take inspired by this card?",
        "How can you share this card's wisdom with others?",
      ],
      reversed: [
        "What internal work does this card suggest?",
        "What patterns might you need to release today?",
        "How can you transform this challenge into growth?",
        "What healing does this card offer?",
        "What shadow aspect asks for your attention?",
      ],
    };

    const pool = card.isReversed ? reflections.reversed : reflections.upright;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Manual daily card posting (for testing or admin use)
  async postManualDailyCard(channel) {
    try {
      const cards = cardUtils.dailyCardReading();
      const card = cards[0];

      const embed = new EmbedBuilder()
        .setColor(parseInt(process.env.COLOR_UPRIGHT) || 0x4b0082)
        .setTitle("🔮 Special Daily Card Reading")
        .setDescription("A mystical card has been drawn for guidance...")
        .addFields(
          {
            name: `${card.name}${card.isReversed ? " (Reversed)" : ""}`,
            value: card.isReversed
              ? card.reversed.meaning
              : card.upright.meaning,
            inline: false,
          },
          {
            name: "Keywords",
            value: card.isReversed
              ? card.reversed.keywords.join(", ")
              : card.upright.keywords.join(", "),
            inline: true,
          }
        )
        .setThumbnail(card.image_url || null)
        .setFooter({
          text: process.env.READING_FOOTER || "For entertainment purposes only",
        })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      return card;
    } catch (error) {
      logger.error("Failed to post manual daily card", error);
      throw error;
    }
  }

  // Get next scheduled time
  getNextScheduledTime() {
    const now = new Date();
    const [hour, minute] = this.dailyTime.split(":").map(Number);

    const next = new Date();
    next.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  // Check if daily card system is active
  isActive() {
    return this.isEnabled && this.channelId && this.client.isReady();
  }

  // Update settings
  updateSettings(settings) {
    if (settings.enabled !== undefined) {
      this.isEnabled = settings.enabled;
    }
    if (settings.time) {
      this.dailyTime = settings.time;
    }
    if (settings.channelId) {
      this.channelId = settings.channelId;
    }
    if (settings.timezone) {
      this.timezone = settings.timezone;
    }

    logger.info("Daily card settings updated", settings);
  }
}

module.exports = DailyCardManager;
