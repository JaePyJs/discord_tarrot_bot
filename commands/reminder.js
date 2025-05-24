const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/DatabaseManager');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Set up personal tarot reading reminders')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a daily reading reminder')
        .addStringOption(option =>
          option
            .setName('time')
            .setDescription('Time for daily reminder (24-hour format, e.g., 09:00)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('Custom reminder message (optional)')
            .setMaxLength(200)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('weekly')
        .setDescription('Set a weekly reading reminder')
        .addStringOption(option =>
          option
            .setName('day')
            .setDescription('Day of the week')
            .setRequired(true)
            .addChoices(
              { name: 'Monday', value: 'monday' },
              { name: 'Tuesday', value: 'tuesday' },
              { name: 'Wednesday', value: 'wednesday' },
              { name: 'Thursday', value: 'thursday' },
              { name: 'Friday', value: 'friday' },
              { name: 'Saturday', value: 'saturday' },
              { name: 'Sunday', value: 'sunday' }
            )
        )
        .addStringOption(option =>
          option
            .setName('time')
            .setDescription('Time for weekly reminder (24-hour format, e.g., 09:00)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('Custom reminder message (optional)')
            .setMaxLength(200)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your current reminders')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a reminder')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Type of reminder to remove')
            .setRequired(true)
            .addChoices(
              { name: 'Daily', value: 'daily' },
              { name: 'Weekly', value: 'weekly' },
              { name: 'All', value: 'all' }
            )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const db = new DatabaseManager();

    try {
      switch (subcommand) {
        case 'set':
          await this.handleSetDaily(interaction, db, userId);
          break;
        case 'weekly':
          await this.handleSetWeekly(interaction, db, userId);
          break;
        case 'view':
          await this.handleView(interaction, db, userId);
          break;
        case 'remove':
          await this.handleRemove(interaction, db, userId);
          break;
      }
    } catch (error) {
      logger.error('Error in reminder command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('⏰ Reminder Error')
        .setDescription('There was an error managing your reminders. Please try again later.')
        .setFooter({ text: 'The cosmic clock seems temporarily disrupted' });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },

  async handleSetDaily(interaction, db, userId) {
    const timeString = interaction.options.getString('time');
    const customMessage = interaction.options.getString('message');

    // Validate time format
    if (!this.isValidTime(timeString)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('⏰ Invalid Time Format')
        .setDescription('Please use 24-hour format (e.g., 09:00, 14:30, 23:15)')
        .setFooter({ text: 'Time flows in mysterious ways' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const [hours, minutes] = timeString.split(':').map(Number);
    const reminderTime = moment.tz('Asia/Manila').set({ hour: hours, minute: minutes, second: 0 });

    // Save reminder to database
    await db.setUserReminder(userId, 'daily', timeString, customMessage);

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('⏰ Daily Reminder Set')
      .setDescription('Your daily tarot reading reminder has been configured!')
      .addFields(
        {
          name: '🕐 Time',
          value: `${reminderTime.format('h:mm A')} (Philippines Time)`,
          inline: true
        },
        {
          name: '📅 Frequency',
          value: 'Daily',
          inline: true
        },
        {
          name: '💬 Message',
          value: customMessage || 'Time for your daily tarot reading! 🔮',
          inline: false
        }
      )
      .setFooter({ text: 'The cards will call to you at the appointed time' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async handleSetWeekly(interaction, db, userId) {
    const day = interaction.options.getString('day');
    const timeString = interaction.options.getString('time');
    const customMessage = interaction.options.getString('message');

    // Validate time format
    if (!this.isValidTime(timeString)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('⏰ Invalid Time Format')
        .setDescription('Please use 24-hour format (e.g., 09:00, 14:30, 23:15)')
        .setFooter({ text: 'Time flows in mysterious ways' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const [hours, minutes] = timeString.split(':').map(Number);
    const reminderTime = moment.tz('Asia/Manila').set({ hour: hours, minute: minutes, second: 0 });

    // Save reminder to database
    await db.setUserReminder(userId, 'weekly', `${day}:${timeString}`, customMessage);

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('⏰ Weekly Reminder Set')
      .setDescription('Your weekly tarot reading reminder has been configured!')
      .addFields(
        {
          name: '📅 Day',
          value: day.charAt(0).toUpperCase() + day.slice(1),
          inline: true
        },
        {
          name: '🕐 Time',
          value: `${reminderTime.format('h:mm A')} (Philippines Time)`,
          inline: true
        },
        {
          name: '💬 Message',
          value: customMessage || 'Time for your weekly tarot reading! 🔮',
          inline: false
        }
      )
      .setFooter({ text: 'The weekly cosmic cycle will guide your readings' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async handleView(interaction, db, userId) {
    const reminders = await db.getUserReminders(userId);

    if (reminders.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('⏰ Your Reminders')
        .setDescription('You have no active reminders set.')
        .setFooter({ text: 'Use /reminder set to create your first reminder' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('⏰ Your Active Reminders')
      .setDescription('Your scheduled tarot reading reminders')
      .setFooter({ text: 'The cosmic schedule guides your practice' });

    for (const reminder of reminders) {
      let scheduleText = '';
      let timeText = '';

      if (reminder.reminder_type === 'daily') {
        const [hours, minutes] = reminder.schedule.split(':').map(Number);
        const time = moment.tz('Asia/Manila').set({ hour: hours, minute: minutes });
        scheduleText = 'Daily';
        timeText = time.format('h:mm A');
      } else if (reminder.reminder_type === 'weekly') {
        const [day, time] = reminder.schedule.split(':');
        const [hours, minutes] = time.split(':').map(Number);
        const timeObj = moment.tz('Asia/Manila').set({ hour: hours, minute: minutes });
        scheduleText = `Every ${day.charAt(0).toUpperCase() + day.slice(1)}`;
        timeText = timeObj.format('h:mm A');
      }

      embed.addFields({
        name: `${reminder.reminder_type === 'daily' ? '📅' : '📆'} ${scheduleText}`,
        value: `**Time:** ${timeText} (Philippines Time)\n**Message:** ${reminder.custom_message || 'Default reminder message'}`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async handleRemove(interaction, db, userId) {
    const type = interaction.options.getString('type');

    if (type === 'all') {
      await db.removeAllUserReminders(userId);
      
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('⏰ All Reminders Removed')
        .setDescription('All your tarot reading reminders have been removed.')
        .setFooter({ text: 'The cosmic schedule has been cleared' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const removed = await db.removeUserReminder(userId, type);

    if (!removed) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('⏰ No Reminder Found')
        .setDescription(`You don't have a ${type} reminder set.`)
        .setFooter({ text: 'Check your active reminders with /reminder view' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('⏰ Reminder Removed')
      .setDescription(`Your ${type} tarot reading reminder has been removed.`)
      .setFooter({ text: 'The cosmic schedule has been updated' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  isValidTime(timeString) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }
};
