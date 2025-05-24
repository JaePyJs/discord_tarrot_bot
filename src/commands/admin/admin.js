const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const logger = require("../../utils/logger");
const analytics = require("../../utils/analytics");
const cardUtils = require("../../utils/cardUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Admin commands for bot management")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("daily-card")
        .setDescription("Post a daily card manually")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("analytics")
        .setDescription("Generate analytics report")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("status").setDescription("Check bot system status")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("cleanup").setDescription("Clean old data and logs")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Check if user has admin permissions
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🚫 Access Denied")
        .setDescription(
          "You need Administrator permissions to use this command."
        )
        .setFooter({ text: "Admin commands are restricted" });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      switch (subcommand) {
        case "daily-card":
          await this.handleDailyCard(interaction);
          break;
        case "analytics":
          await this.handleAnalytics(interaction);
          break;
        case "status":
          await this.handleStatus(interaction);
          break;
        case "cleanup":
          await this.handleCleanup(interaction);
          break;
      }
    } catch (error) {
      logger.error("Error in admin command:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🚫 Admin Command Failed")
        .setDescription("An error occurred while executing the admin command.")
        .setFooter({ text: "Check logs for details" });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  async handleDailyCard(interaction) {
    try {
      const cards = cardUtils.dailyCardReading();
      const card = cards[0];

      const embed = new EmbedBuilder()
        .setColor(0x4b0082)
        .setTitle("🌅 Admin Daily Card")
        .setDescription("Daily card posted by administrator")
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
          text: "Posted by admin • For entertainment purposes only",
        })
        .setTimestamp();

      // Post to current channel
      await interaction.channel.send({ embeds: [embed] });

      const successEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Daily Card Posted")
        .setDescription(`Successfully posted daily card: **${card.name}**`)
        .setFooter({ text: "Admin action completed" });

      await interaction.editReply({ embeds: [successEmbed] });

      logger.info("Admin daily card posted", {
        adminId: interaction.user.id,
        guildId: interaction.guild.id,
        cardName: card.name,
      });
    } catch (error) {
      logger.error("Failed to post admin daily card:", error);
      throw error;
    }
  },

  async handleAnalytics(interaction) {
    try {
      const report = await analytics.generateDailyReport();

      if (!report) {
        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setTitle("📊 Analytics Unavailable")
          .setDescription("Analytics are disabled or no data available.")
          .setFooter({ text: "Check ENABLE_ANALYTICS setting" });

        return await interaction.editReply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(0x4b0082)
        .setTitle("📊 Bot Analytics Report")
        .setDescription(`Analytics for ${report.date}`)
        .addFields(
          {
            name: "🔮 Total Readings",
            value: report.totalReadings.toString(),
            inline: true,
          },
          {
            name: "⚡ Total Commands",
            value: report.totalCommands.toString(),
            inline: true,
          },
          {
            name: "👥 Unique Users",
            value: report.uniqueUsers.toString(),
            inline: true,
          },
          {
            name: "🏠 Unique Servers",
            value: report.uniqueServers.toString(),
            inline: true,
          },
          {
            name: "⏱️ Avg Response Time",
            value: `${report.averageExecutionTime}ms`,
            inline: true,
          },
          {
            name: "❌ Error Rate",
            value: `${report.errorRate}%`,
            inline: true,
          }
        )
        .setFooter({ text: "Admin analytics report" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      logger.info("Admin analytics report generated", {
        adminId: interaction.user.id,
        guildId: interaction.guild.id,
      });
    } catch (error) {
      logger.error("Failed to generate admin analytics:", error);
      throw error;
    }
  },

  async handleStatus(interaction) {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      const guildCount = interaction.client.guilds.cache.size;
      const userCount = interaction.client.users.cache.size;

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("🤖 Bot System Status")
        .setDescription("Current system status and performance metrics")
        .addFields(
          {
            name: "⏰ Uptime",
            value: this.formatUptime(uptime),
            inline: true,
          },
          {
            name: "🏠 Servers",
            value: guildCount.toString(),
            inline: true,
          },
          {
            name: "👥 Users",
            value: userCount.toString(),
            inline: true,
          },
          {
            name: "💾 Memory Usage",
            value: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            inline: true,
          },
          {
            name: "📊 Analytics",
            value:
              process.env.ENABLE_ANALYTICS === "true"
                ? "✅ Enabled"
                : "❌ Disabled",
            inline: true,
          },
          {
            name: "🌅 Daily Cards",
            value:
              process.env.DAILY_CARD_ENABLED === "true"
                ? "✅ Enabled"
                : "❌ Disabled",
            inline: true,
          },
          {
            name: "🃏 Total Cards",
            value: cardUtils.allCards.length.toString(),
            inline: true,
          },
          {
            name: "🔧 Node Version",
            value: process.version,
            inline: true,
          },
          {
            name: "🌐 Environment",
            value: process.env.NODE_ENV || "development",
            inline: true,
          }
        )
        .setFooter({ text: "System status check" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      logger.info("Admin status check performed", {
        adminId: interaction.user.id,
        guildId: interaction.guild.id,
      });
    } catch (error) {
      logger.error("Failed to get system status:", error);
      throw error;
    }
  },

  async handleCleanup(interaction) {
    try {
      // Clean old logs
      logger.cleanOldLogs();

      // Clean old analytics data
      await analytics.cleanOldData();

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("🧹 Cleanup Complete")
        .setDescription("Successfully cleaned old logs and analytics data")
        .addFields(
          {
            name: "📝 Logs",
            value: "Old log files archived",
            inline: true,
          },
          {
            name: "📊 Analytics",
            value: "Old analytics data removed",
            inline: true,
          }
        )
        .setFooter({ text: "Cleanup operation completed" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      logger.info("Admin cleanup performed", {
        adminId: interaction.user.id,
        guildId: interaction.guild.id,
      });
    } catch (error) {
      logger.error("Failed to perform cleanup:", error);
      throw error;
    }
  },

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  },
};
