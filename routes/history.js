const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");
const { sqlQuery } = require("../mysql");
dayjs.extend(isoWeek);

const DATE_FORMAT = "YYYY-MM-DD";

function generateRecords(monday, userId) {
  return Array.from({ length: 7 }).map(
    (_, index) =>
      `('${dayjs(monday)
        .add(index, "d")
        .format(DATE_FORMAT)}', '${monday}', ${userId})`
  );
}

router.get("/index", (req, res) => {
  const { query } = req;
  const { date } = query;
  const currentMonday = dayjs(+date).isoWeekday(1);
  if (!date || !currentMonday.isValid()) {
    res.send({
      success: false,
      description: "请选择有效的时间",
    });
    return;
  }
  const dateFormat = currentMonday.format(DATE_FORMAT);

  // 创建每周表
  sqlQuery(`
      SELECT * FROM clockin_schedule WHERE date='${dateFormat}';
  `)
    .then(() => {
      // 查找有没有创建这周的签到表
      return sqlQuery(
        `SELECT * FROM clockin_record WHERE monday='${dateFormat}';`
      );
    })
    .then((data) => {
      res.send({
        success: true,
        data,
      });
    })
    .catch((err) => {
      console.error(err);
      res.send({
        success: false,
        description: "请求失败",
      });
    });
});

// router("/history", (req, res) => {
//   res.send("history");
// });

module.exports = router;
