const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);

module.exports = dayjs;
