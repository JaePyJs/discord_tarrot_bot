const cron = require('node-cron');
const moment = require('moment-timezone');
const DatabaseManager = require('../database/DatabaseManager');
const logger = require('./logger');
const { EmbedBuilder } = require('discord.js');

class ReminderManager {
  constructor(client) {
    this.client = client;
    this.activeJobs = new Map();
    this.timezone = 'Asia/Manila';
    this.db = new DatabaseManager();
  }

  // Initialize reminder system
  async initialize() {
    try {
      logger.info('Initializing reminder system...');
      
      // Load all active reminders from database
      const reminders = await this.db.getAllActiveReminders();
      
      for (const reminder of reminders) {
        await this.scheduleReminder(reminder);
      }
      
      logger.success(`Initialized ${reminders.length} active reminders`);
    } catch (error) {
      logger.error('Failed to initialize reminder system:', error);
    }
  }

  // Schedule a reminder
  async scheduleReminder(reminder) {
    try {
      const { user_id, reminder_type, schedule, custom_message } = reminder;
      
      let cronExpression = '';
      
      if (reminder_type === 'daily') {
        // Daily reminder: schedule is in format "HH:MM"
        const [hours, minutes] = schedule.split(':');
        cronExpression = `${minutes} ${hours} * * *`;
      } else if (reminder_type === 'weekly') {
        // Weekly reminder: schedule is in format "day:HH:MM"
        const [day, time] = schedule.split(':');
        const [hours, minutes] = time.split(':');
        const dayNumber = this.getDayNumber(day);
        cronExpression = `${minutes} ${hours} * * ${dayNumber}`;
      }

      if (cronExpression) {
        const job = cron.schedule(cronExpression, async () => {
          await this.sendReminder(user_id, reminder_type, custom_message);
        }, {
          scheduled: true,
          timezone: this.timezone
        });

        // Store the job for later management
        const jobKey = `${user_id}_${reminder_type}`;
        this.activeJobs.set(jobKey, job);
        
        logger.debug(`Scheduled ${reminder_type} reminder for user ${user_id}`, {
          schedule: schedule,
          cronExpression: cronExpression
        });
      }
    } catch (error) {
      logger.error('Failed to schedule reminder:', error);
    }
  }

  // Send reminder to user
  async sendReminder(userId, reminderType, customMessage) {
    try {
      const user = await this.client.users.fetch(userId);
      
      if (!user) {
        logger.warn(`User ${userId} not found for reminder`);
        return;
      }

      const defaultMessages = {
        daily: '🔮 Time for your daily tarot reading! The cards are calling to you...',
        weekly: '✨ Your weekly tarot reading awaits! Discover what the cosmos has in store for you this week.'
      };

      const message = customMessage || defaultMessages[reminderType] || defaultMessages.daily;
      
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('🔔 Tarot Reading Reminder')
        .setDescription(message)
        .addFields(
          {
            name: '🎴 Quick Start',
            value: 'Use `/tarot single` for a quick reading or `/tarot daily` for daily guidance',
            inline: false
          },
          {
            name: '⚙️ Manage Reminders',
            value: 'Use `/reminder view` to see your reminders or `/reminder remove` to stop them',
            inline: false
          }
        )
        .setFooter({ text: 'May the cards guide your path today ✨' })
        .setTimestamp();

      await user.send({ embeds: [embed] });
      
      logger.info(`Sent ${reminderType} reminder to user ${userId}`);
    } catch (error) {
      logger.error(`Failed to send reminder to user ${userId}:`, error);
      
      // If user has DMs disabled or other error, we might want to disable the reminder
      if (error.code === 50007) { // Cannot send messages to this user
        logger.warn(`User ${userId} has DMs disabled, considering disabling reminder`);
        // Optionally disable the reminder here
      }
    }
  }

  // Add a new reminder
  async addReminder(userId, reminderType, schedule, customMessage = null) {
    try {
      // Save to database
      await this.db.setUserReminder(userId, reminderType, schedule, customMessage);
      
      // Schedule the reminder
      const reminder = {
        user_id: userId,
        reminder_type: reminderType,
        schedule: schedule,
        custom_message: customMessage
      };
      
      await this.scheduleReminder(reminder);
      
      logger.info(`Added ${reminderType} reminder for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to add reminder:', error);
      return false;
    }
  }

  // Remove a reminder
  async removeReminder(userId, reminderType) {
    try {
      // Remove from database
      const removed = await this.db.removeUserReminder(userId, reminderType);
      
      if (removed) {
        // Stop the scheduled job
        const jobKey = `${userId}_${reminderType}`;
        const job = this.activeJobs.get(jobKey);
        
        if (job) {
          job.stop();
          this.activeJobs.delete(jobKey);
        }
        
        logger.info(`Removed ${reminderType} reminder for user ${userId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to remove reminder:', error);
      return false;
    }
  }

  // Remove all reminders for a user
  async removeAllReminders(userId) {
    try {
      // Remove from database
      await this.db.removeAllUserReminders(userId);
      
      // Stop all scheduled jobs for this user
      const userJobs = Array.from(this.activeJobs.keys()).filter(key => key.startsWith(`${userId}_`));
      
      for (const jobKey of userJobs) {
        const job = this.activeJobs.get(jobKey);
        if (job) {
          job.stop();
          this.activeJobs.delete(jobKey);
        }
      }
      
      logger.info(`Removed all reminders for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove all reminders:', error);
      return false;
    }
  }

  // Get day number for cron (0 = Sunday, 1 = Monday, etc.)
  getDayNumber(dayName) {
    const days = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    
    return days[dayName.toLowerCase()] || 1; // Default to Monday
  }

  // Stop all reminders (for shutdown)
  stopAll() {
    logger.info('Stopping all reminder jobs...');
    
    for (const [jobKey, job] of this.activeJobs) {
      job.stop();
    }
    
    this.activeJobs.clear();
    logger.info('All reminder jobs stopped');
  }

  // Get reminder statistics
  getStats() {
    return {
      activeJobs: this.activeJobs.size,
      timezone: this.timezone
    };
  }

  // Test reminder (for debugging)
  async testReminder(userId, message = 'This is a test reminder') {
    try {
      await this.sendReminder(userId, 'test', message);
      return true;
    } catch (error) {
      logger.error('Test reminder failed:', error);
      return false;
    }
  }
}

module.exports = ReminderManager;
