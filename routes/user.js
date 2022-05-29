const express = require("express");
const cookiesMap = require("../cookies");
const { sqlQuery } = require("../mysql");
const router = express.Router();

router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const [user] = await sqlQuery(
      `SELECT userId FROM user WHERE mobile=${mobile} AND password=${password};`
    );
    if (!user) {
      res.send({
        success: false,
        description: "账号或密码错误",
      });
      return;
    }

    const userKey = `${mobile}_${Date.now()}`;

    cookiesMap.set(userKey, user.userId);
    res.cookie("id", userKey, {
      maxAge: 60 * 60 * 24 * 100,
      httpOnly: true,
      signed: true,
    });
    res.send({
      success: true,
      description: "登录成功",
    });
  } catch (_) {
    res.send({
      success: false,
      description: "登录失败",
    });
    return;
  }
});

module.exports = router;
