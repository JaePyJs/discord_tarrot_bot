const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.dirname(process.env.LOG_FILE_PATH || './logs/tarot-bot.log');
        this.logFile = process.env.LOG_FILE_PATH || './logs/tarot-bot.log';
        this.debugEnabled = process.env.ENABLE_DEBUG_LOGGING === 'true';
        
        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };
        
        return JSON.stringify(logEntry) + '\n';
    }

    writeToFile(level, message, data = null) {
        try {
            const formattedMessage = this.formatMessage(level, message, data);
            fs.appendFileSync(this.logFile, formattedMessage);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    info(message, data = null) {
        console.log(`ℹ️  ${message}`, data || '');
        this.writeToFile('INFO', message, data);
    }

    warn(message, data = null) {
        console.warn(`⚠️  ${message}`, data || '');
        this.writeToFile('WARN', message, data);
    }

    error(message, error = null) {
        console.error(`❌ ${message}`, error || '');
        this.writeToFile('ERROR', message, error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : null);
    }

    debug(message, data = null) {
        if (this.debugEnabled) {
            console.log(`🐛 ${message}`, data || '');
            this.writeToFile('DEBUG', message, data);
        }
    }

    success(message, data = null) {
        console.log(`✅ ${message}`, data || '');
        this.writeToFile('SUCCESS', message, data);
    }

    // Log reading activity
    logReading(userId, guildId, readingType, cards) {
        const readingData = {
            userId,
            guildId,
            readingType,
            cardCount: cards.length,
            cards: cards.map(card => ({
                name: card.name,
                isReversed: card.isReversed,
                position: card.position
            }))
        };

        this.info(`Tarot reading performed: ${readingType}`, readingData);
    }

    // Log command usage
    logCommand(commandName, userId, guildId, success = true, error = null) {
        const commandData = {
            command: commandName,
            userId,
            guildId,
            success,
            error: error ? error.message : null
        };

        if (success) {
            this.debug(`Command executed: /${commandName}`, commandData);
        } else {
            this.error(`Command failed: /${commandName}`, error);
        }
    }

    // Log performance metrics
    logPerformance(operation, duration, metadata = {}) {
        if (process.env.PERFORMANCE_MONITORING === 'true') {
            const perfData = {
                operation,
                duration: `${duration}ms`,
                ...metadata
            };

            this.debug(`Performance: ${operation}`, perfData);
        }
    }

    // Clean old logs
    cleanOldLogs() {
        try {
            const retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 90;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            // This is a simple implementation - in production you might want more sophisticated log rotation
            const stats = fs.statSync(this.logFile);
            if (stats.mtime < cutoffDate) {
                const archiveName = `${this.logFile}.${cutoffDate.toISOString().split('T')[0]}`;
                fs.renameSync(this.logFile, archiveName);
                this.info('Log file archived', { archiveName });
            }
        } catch (error) {
            this.error('Failed to clean old logs', error);
        }
    }
}

module.exports = new Logger();
