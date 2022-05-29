const express = require("express");
const router = express.Router();
const dayjs = require("../utils/dayjs");
const cookiesMap = require("../cookies");
const { sqlQuery } = require("../mysql");
const { USER_ID_MAP } = require("../constants");

const DATE_FORMAT = "YYYY-MM-DD";

function generateRecords(monday, userId) {
  return Array.from({ length: 7 }).map(
    (_, index) =>
      `('${dayjs(monday)
        .add(index, "d")
        .format(DATE_FORMAT)}', '${monday}', ${userId})`
  );
}

function handleValidate(req, res, next) {
  if (cookiesMap.has(req.signedCookies.id)) {
    next();
  } else {
    res.status(401).send({
      success: false,
      description: "未登录",
    });
  }
}

router.get("*", handleValidate);
router.post("*", handleValidate);

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
  const curMonday = currentMonday.format(DATE_FORMAT);

  const recordSql = `
    SELECT rd.*, ur.userName, DATE_FORMAT(date, '%Y-%m-%d') date, DATE_FORMAT(monday, '%Y-%m-%d') monday  
    FROM clockin_record rd LEFT JOIN user ur 
    ON rd.userId=ur.userId 
    WHERE monday='${curMonday}';`;

  // 创建每周的schedule
  // sqlQuery(`
  //   INSERT INTO clockin_schedule(\`date\`, \`punishment\`)
  //   SELECT '${curMonday}', '惩罚' FROM DUAL
  //   WHERE NOT EXISTS (SELECT * FROM clockin_schedule WHERE date='${curMonday}');
  // `)
  sqlQuery(`
    INSERT IGNORE INTO clockin_history (date, punishment) VALUES('${curMonday}', '洗衣服')
  `)
    .then(() => {
      // 查找有没有创建这周的签到表
      return sqlQuery(recordSql);
    })
    .then((data) => {
      // 有则返回
      if (data.length > 0) {
        return data;
      } else {
        // 没有则创建
        return sqlQuery(`
          INSERT INTO clockin_record (date, monday, userId) VALUES
          ${[
            ...generateRecords(curMonday, USER_ID_MAP.one),
            ...generateRecords(curMonday, USER_ID_MAP.two),
          ].join(",")}
        `).then(() =>
          // 再次查询这周的签到表
          sqlQuery(recordSql)
        );
      }
    })
    .then((data) => {
      const curUserId = cookiesMap.get(req.signedCookies.id);
      const mine = [],
        other = [];
      
      data.forEach((item) => {
        const newItem = {
          ...item,
          events: JSON.parse(item.events || "[]"),
        };

        item.userId === curUserId ? mine.push(newItem) : other.push(newItem);
      });

      const list = mine.map((item, index) => ({
        date: item.date,
        mine: item,
        other: other[index],
      }));

      res.send({
        success: true,
        data: {
          punishment: "洗衣服",
          list,
        },
      });
    })
    .catch((_) => {
      res.send({
        success: false,
        description: "请求失败",
      });
    });
});

router.get("/event", (_req, res) => {
  sqlQuery(`
    SELECT * FROM clockin_event;
  `)
    .then((data) => {
      res.send({
        success: true,
        data,
      });
    })
    .catch(() => {
      res.send({
        success: false,
        description: "请求失败",
      });
    });
});

router.post("/clockin", async (req, res) => {
  const { id } = req.body;
  let event, record;
  // 获取签到事件
  try {
    [event] = await sqlQuery(`SELECT * FROM clockin_event WHERE id=${id};`);
  } catch (_) {
    res.send({
      success: false,
      description: `签到事件id=${id}不存在`,
    });
    return;
  }

  const curDay = dayjs().format(DATE_FORMAT);
  const curUserId = cookiesMap.get(req.signedCookies.id);

  // 获取当天签到记录
  try {
    [record] = await sqlQuery(
      `SELECT * FROM clockin_record WHERE date='${curDay}' AND userId=${curUserId};`
    );
  } catch (_) {
    /* */
  }
  if (!record) {
    return res.send({
      success: false,
      description: `当天${curDay}签到记录不存在`,
    });
  }

  const events = JSON.parse(record.events || "[]", id);

  if (events.some((item) => item.id === +id)) {
    return res.send({
      success: false,
      description: `今天你已签到该事件`,
    });
  }

  events.push(event);

  // 更新当前签到记录
  try {
    await sqlQuery(
      `UPDATE clockin_record SET events='${JSON.stringify(
        events
      )}',score=${events.reduce(
        (a, b) => a + b.score,
        0
      )} WHERE date='${curDay}' AND userId=${curUserId};`
    );
    res.send({
      success: true,
      description: `签到成功`,
    });
  } catch (err) {
    res.send({
      success: false,
      description: `签到失败`,
    });
  }
});

module.exports = router;
