const bcrypt = require('bcrypt');
const Joi = require('joi');
const logger = require('./logger');

class SecurityManager {
    constructor() {
        this.saltRounds = 12;
        this.maxRequestsPerMinute = 60;
        this.requestCounts = new Map();
        this.blacklistedUsers = new Set(
            (process.env.BLACKLISTED_USERS || '').split(',').filter(id => id.trim())
        );
        this.blacklistedServers = new Set(
            (process.env.BLACKLISTED_SERVERS || '').split(',').filter(id => id.trim())
        );
    }

    // Input validation schemas
    getValidationSchemas() {
        return {
            userId: Joi.string().pattern(/^\d{17,19}$/).required(),
            guildId: Joi.string().pattern(/^\d{17,19}$/).allow(null),
            readingType: Joi.string().valid(
                'single', 'three-card', 'celtic-cross', 'horseshoe', 
                'relationship', 'yes-no', 'daily', 'career'
            ).required(),
            cardName: Joi.string().min(1).max(50).required(),
            timezone: Joi.string().valid(
                'Asia/Manila', 'Asia/Singapore', 'UTC', 'America/New_York'
            ),
            dailyTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
            maxReadings: Joi.number().integer().min(1).max(50),
            cooldownSeconds: Joi.number().integer().min(5).max(300)
        };
    }

    // Validate input data
    validateInput(data, schemaName) {
        const schemas = this.getValidationSchemas();
        const schema = schemas[schemaName];
        
        if (!schema) {
            throw new Error(`Unknown validation schema: ${schemaName}`);
        }

        const { error, value } = schema.validate(data);
        
        if (error) {
            logger.warn('Input validation failed', {
                schemaName,
                error: error.details[0].message,
                input: data
            });
            throw new Error(`Invalid ${schemaName}: ${error.details[0].message}`);
        }

        return value;
    }

    // Check if user is blacklisted
    isUserBlacklisted(userId) {
        return this.blacklistedUsers.has(userId);
    }

    // Check if server is blacklisted
    isServerBlacklisted(guildId) {
        return this.blacklistedServers.has(guildId);
    }

    // Rate limiting check
    checkRateLimit(userId) {
        const now = Date.now();
        const userKey = `user_${userId}`;
        
        if (!this.requestCounts.has(userKey)) {
            this.requestCounts.set(userKey, { count: 1, resetTime: now + 60000 });
            return true;
        }

        const userData = this.requestCounts.get(userKey);
        
        if (now > userData.resetTime) {
            // Reset counter
            this.requestCounts.set(userKey, { count: 1, resetTime: now + 60000 });
            return true;
        }

        if (userData.count >= this.maxRequestsPerMinute) {
            logger.warn('Rate limit exceeded', { userId, count: userData.count });
            return false;
        }

        userData.count++;
        return true;
    }

    // Sanitize user input
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .substring(0, 1000); // Limit length
    }

    // Hash sensitive data
    async hashData(data) {
        try {
            return await bcrypt.hash(data, this.saltRounds);
        } catch (error) {
            logger.error('Failed to hash data:', error);
            throw new Error('Hashing failed');
        }
    }

    // Verify hashed data
    async verifyHash(data, hash) {
        try {
            return await bcrypt.compare(data, hash);
        } catch (error) {
            logger.error('Failed to verify hash:', error);
            return false;
        }
    }

    // Generate secure random token
    generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    // Check for suspicious activity
    detectSuspiciousActivity(userId, activity) {
        const suspiciousPatterns = [
            /bot/i,
            /script/i,
            /automated/i,
            /spam/i
        ];

        const activityString = JSON.stringify(activity);
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(activityString)) {
                logger.warn('Suspicious activity detected', {
                    userId,
                    activity,
                    pattern: pattern.toString()
                });
                return true;
            }
        }

        return false;
    }

    // Log security event
    logSecurityEvent(eventType, details) {
        logger.warn(`Security Event: ${eventType}`, details);
        
        // Could send to external security monitoring service
        if (process.env.SECURITY_WEBHOOK_URL) {
            this.sendSecurityAlert(eventType, details);
        }
    }

    // Send security alert (webhook)
    async sendSecurityAlert(eventType, details) {
        try {
            const embed = {
                title: `🚨 Security Alert: ${eventType}`,
                description: 'Potential security issue detected',
                color: 0xFF0000,
                fields: [
                    {
                        name: 'Event Type',
                        value: eventType,
                        inline: true
                    },
                    {
                        name: 'Timestamp',
                        value: new Date().toISOString(),
                        inline: true
                    },
                    {
                        name: 'Details',
                        value: JSON.stringify(details, null, 2).substring(0, 1000),
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString()
            };

            const response = await fetch(process.env.SECURITY_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ embeds: [embed] })
            });

            if (!response.ok) {
                throw new Error(`Security webhook failed: ${response.status}`);
            }

        } catch (error) {
            logger.error('Failed to send security alert:', error);
        }
    }

    // Clean up old rate limit data
    cleanupRateLimits() {
        const now = Date.now();
        
        for (const [key, data] of this.requestCounts.entries()) {
            if (now > data.resetTime) {
                this.requestCounts.delete(key);
            }
        }
    }

    // Middleware for command security
    async secureCommand(interaction, commandName) {
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id;

        // Validate IDs
        try {
            this.validateInput(userId, 'userId');
            if (guildId) {
                this.validateInput(guildId, 'guildId');
            }
        } catch (error) {
            this.logSecurityEvent('Invalid ID Format', { userId, guildId, error: error.message });
            return false;
        }

        // Check blacklists
        if (this.isUserBlacklisted(userId)) {
            this.logSecurityEvent('Blacklisted User', { userId, commandName });
            return false;
        }

        if (guildId && this.isServerBlacklisted(guildId)) {
            this.logSecurityEvent('Blacklisted Server', { guildId, commandName });
            return false;
        }

        // Check rate limits
        if (!this.checkRateLimit(userId)) {
            this.logSecurityEvent('Rate Limit Exceeded', { userId, commandName });
            return false;
        }

        // Check for suspicious activity
        const activity = {
            command: commandName,
            timestamp: Date.now(),
            userId,
            guildId
        };

        if (this.detectSuspiciousActivity(userId, activity)) {
            this.logSecurityEvent('Suspicious Activity', activity);
            // Don't block, just log for now
        }

        return true;
    }
}

module.exports = new SecurityManager();
