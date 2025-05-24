const logger = require('./logger');
const moment = require('moment-timezone');

class PerformanceMonitor {
    constructor() {
        this.enabled = process.env.PERFORMANCE_MONITORING === 'true';
        this.metrics = new Map();
        this.alerts = new Map();
        this.thresholds = {
            commandExecution: 5000, // 5 seconds
            databaseQuery: 2000,    // 2 seconds
            memoryUsage: 512,       // 512 MB
            cpuUsage: 80,           // 80%
            errorRate: 5            // 5%
        };
        
        if (this.enabled) {
            this.startMonitoring();
        }
    }

    startMonitoring() {
        // Monitor system metrics every 30 seconds
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);

        // Clean old metrics every 5 minutes
        setInterval(() => {
            this.cleanOldMetrics();
        }, 300000);

        logger.info('Performance monitoring started');
    }

    // Start timing an operation
    startTimer(operationName) {
        if (!this.enabled) return null;
        
        return {
            name: operationName,
            startTime: process.hrtime.bigint(),
            startMemory: process.memoryUsage()
        };
    }

    // End timing and record metrics
    endTimer(timer, metadata = {}) {
        if (!this.enabled || !timer) return;

        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        
        const duration = Number(endTime - timer.startTime) / 1000000; // Convert to milliseconds
        const memoryDelta = endMemory.heapUsed - timer.startMemory.heapUsed;

        const metric = {
            operation: timer.name,
            duration,
            memoryDelta,
            timestamp: Date.now(),
            metadata
        };

        this.recordMetric(metric);
        
        // Check for performance issues
        this.checkPerformanceThresholds(metric);

        return metric;
    }

    // Record a performance metric
    recordMetric(metric) {
        const key = `${metric.operation}_${Date.now()}`;
        this.metrics.set(key, metric);

        logger.debug('Performance metric recorded', {
            operation: metric.operation,
            duration: `${metric.duration.toFixed(2)}ms`,
            memoryDelta: `${(metric.memoryDelta / 1024 / 1024).toFixed(2)}MB`
        });
    }

    // Collect system-wide metrics
    collectSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        const systemMetric = {
            operation: 'system',
            timestamp: Date.now(),
            memory: {
                heapUsed: memUsage.heapUsed / 1024 / 1024, // MB
                heapTotal: memUsage.heapTotal / 1024 / 1024,
                external: memUsage.external / 1024 / 1024,
                rss: memUsage.rss / 1024 / 1024
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: process.uptime()
        };

        this.recordMetric(systemMetric);
        
        // Check system thresholds
        if (systemMetric.memory.heapUsed > this.thresholds.memoryUsage) {
            this.triggerAlert('high_memory_usage', {
                current: systemMetric.memory.heapUsed,
                threshold: this.thresholds.memoryUsage
            });
        }
    }

    // Check if metrics exceed performance thresholds
    checkPerformanceThresholds(metric) {
        if (metric.operation === 'command' && metric.duration > this.thresholds.commandExecution) {
            this.triggerAlert('slow_command', {
                operation: metric.operation,
                duration: metric.duration,
                threshold: this.thresholds.commandExecution,
                metadata: metric.metadata
            });
        }

        if (metric.operation === 'database' && metric.duration > this.thresholds.databaseQuery) {
            this.triggerAlert('slow_database_query', {
                duration: metric.duration,
                threshold: this.thresholds.databaseQuery,
                metadata: metric.metadata
            });
        }
    }

    // Trigger performance alert
    triggerAlert(alertType, details) {
        const alertKey = `${alertType}_${Math.floor(Date.now() / 60000)}`; // Group by minute
        
        if (this.alerts.has(alertKey)) {
            return; // Don't spam alerts
        }

        this.alerts.set(alertKey, {
            type: alertType,
            details,
            timestamp: Date.now()
        });

        logger.warn(`Performance Alert: ${alertType}`, details);

        // Send to webhook if configured
        if (process.env.PERFORMANCE_WEBHOOK_URL) {
            this.sendPerformanceAlert(alertType, details);
        }
    }

    // Send performance alert to webhook
    async sendPerformanceAlert(alertType, details) {
        try {
            const embed = {
                title: `⚡ Performance Alert: ${alertType}`,
                description: 'Performance threshold exceeded',
                color: 0xFFA500, // Orange
                fields: [
                    {
                        name: 'Alert Type',
                        value: alertType,
                        inline: true
                    },
                    {
                        name: 'Timestamp',
                        value: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
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

            const response = await fetch(process.env.PERFORMANCE_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ embeds: [embed] })
            });

            if (!response.ok) {
                throw new Error(`Performance webhook failed: ${response.status}`);
            }

        } catch (error) {
            logger.error('Failed to send performance alert:', error);
        }
    }

    // Get performance statistics
    getPerformanceStats(timeRange = 3600000) { // Default: last hour
        const cutoff = Date.now() - timeRange;
        const recentMetrics = Array.from(this.metrics.values())
            .filter(metric => metric.timestamp > cutoff);

        if (recentMetrics.length === 0) {
            return null;
        }

        const stats = {
            totalOperations: recentMetrics.length,
            averageDuration: 0,
            maxDuration: 0,
            minDuration: Infinity,
            operationBreakdown: {},
            memoryStats: {
                averageDelta: 0,
                maxDelta: 0,
                minDelta: Infinity
            }
        };

        let totalDuration = 0;
        let totalMemoryDelta = 0;

        recentMetrics.forEach(metric => {
            if (metric.duration !== undefined) {
                totalDuration += metric.duration;
                stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
                stats.minDuration = Math.min(stats.minDuration, metric.duration);
            }

            if (metric.memoryDelta !== undefined) {
                totalMemoryDelta += metric.memoryDelta;
                stats.memoryStats.maxDelta = Math.max(stats.memoryStats.maxDelta, metric.memoryDelta);
                stats.memoryStats.minDelta = Math.min(stats.memoryStats.minDelta, metric.memoryDelta);
            }

            // Count operations by type
            if (!stats.operationBreakdown[metric.operation]) {
                stats.operationBreakdown[metric.operation] = 0;
            }
            stats.operationBreakdown[metric.operation]++;
        });

        stats.averageDuration = totalDuration / recentMetrics.length;
        stats.memoryStats.averageDelta = totalMemoryDelta / recentMetrics.length;

        return stats;
    }

    // Clean old metrics to prevent memory leaks
    cleanOldMetrics() {
        const cutoff = Date.now() - 3600000; // Keep last hour
        
        for (const [key, metric] of this.metrics.entries()) {
            if (metric.timestamp < cutoff) {
                this.metrics.delete(key);
            }
        }

        // Clean old alerts
        for (const [key, alert] of this.alerts.entries()) {
            if (alert.timestamp < cutoff) {
                this.alerts.delete(key);
            }
        }

        logger.debug('Old performance metrics cleaned', {
            remainingMetrics: this.metrics.size,
            remainingAlerts: this.alerts.size
        });
    }

    // Get current system status
    getCurrentSystemStatus() {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        return {
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024)
            },
            uptime: {
                seconds: Math.round(uptime),
                formatted: this.formatUptime(uptime)
            },
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        };
    }

    // Format uptime in human readable format
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
    }

    // Wrapper for timing async operations
    async timeAsync(operationName, asyncFunction, metadata = {}) {
        const timer = this.startTimer(operationName);
        
        try {
            const result = await asyncFunction();
            this.endTimer(timer, { ...metadata, success: true });
            return result;
        } catch (error) {
            this.endTimer(timer, { ...metadata, success: false, error: error.message });
            throw error;
        }
    }
}

module.exports = new PerformanceMonitor();
