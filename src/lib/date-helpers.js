const moment = require('moment-timezone');

class DateHelper {
    static toUtc(date) {
        return moment(date).utc().toDate();
    }

    static fromUtc(date, timezone) {
        if (!moment.tz.names().includes(timezone)) {
            throw new Error(`Invalid timezone: ${timezone}`);
        }

        return moment.utc(date).tz(timezone).toDate();
    }

    static format(date, format, timezone) {
        if (!moment.tz.names().includes(timezone)) {
            throw new Error(`Invalid timezone: ${timezone}`);
        }

        return moment(date).tz(timezone).format(format);
    }

    static getCurrentUtc() {
        return moment().utc().toDate();
    }

    static getCurrentTimezone(timezone) {
        if (!moment.tz.names().includes(timezone)) {
            throw new Error(`Invalid timezone: ${timezone}`);
        }

        return moment().tz(timezone).toDate();
    }

    static guess() {
        return moment.tz.guess();
    }

    static now(timezone) {
        if (!moment.tz.names().includes(timezone)) {
            throw new Error(`Invalid timezone: ${timezone}`);
        }

        return moment().tz(timezone).toDate();
    }

    static nowUtc() {
        const now = new Date();
        const utcNow = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds()
        ));
        return utcNow;
    }

    static toISO8601(date) {
        return moment(date).toISOString();
    }
}

module.exports = DateHelper;