class PerformanceMonitor {
    static formatDuration(duration) {
        const durationNum = Number(duration);
        
        if (isNaN(durationNum)) {
            console.warn(`Invalid duration value: ${duration}`);
            return '0ms';
        }

        return `${durationNum.toFixed(2)}ms`;
    }

    static formatMemoryUsage() {
        const used = process.memoryUsage();
        return {
            heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(used.external / 1024 / 1024)}MB`,
            rss: `${Math.round(used.rss / 1024 / 1024)}MB`
        };
    }

    static logPerformanceIssue(queryName, duration, threshold, details = {}) {
        const durationNum = Number(duration);
        const thresholdNum = Number(threshold);

        console.warn(`
🔍 Performance Monitor Alert
--------------------------
Query: ${queryName}
Duration: ${this.formatDuration(durationNum)}
Threshold: ${this.formatDuration(thresholdNum)}
Timestamp: ${new Date().toISOString()}
Memory Usage: ${JSON.stringify(this.formatMemoryUsage(), null, 2)}
Details: ${JSON.stringify(details, null, 2)}
--------------------------`);
    }
}

module.exports = PerformanceMonitor;