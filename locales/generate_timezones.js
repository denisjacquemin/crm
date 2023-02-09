// generate in './locales/en/timezones.json' the list of timezones
// the ouptut is a json file with the list of timezones
// example:
// {
//     "timezones": {
//         "Europe/Brussels": "Europe/Brussels (GMT+01:00)"
//         ...
//     }

const fs = require('fs');
const moment = require('moment-timezone');

const timezones = moment.tz.names();
const timezonesList = {};

timezones.forEach((timezone) => {
    timezonesList[timezone] = `${timezone} (${moment.tz(timezone).format('Z')})`;
});

fs.writeFileSync(
    './locales/en/timezones.json',
    JSON.stringify({ timezones: timezonesList }, null, 4)
);