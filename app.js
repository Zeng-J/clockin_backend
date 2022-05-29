const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const port = 3000;

const recordRouter = require("./routes/record");
const userRouter = require("./routes/user");

app.all("*", function (req, res, next) {
  //这里是设置请求头设置为可以跨域  不懂的朋友可以看看ajax的同源策略
  // res.header("Access-Control-Allow-Origin", req.headers.origin); //*表示可以跨域任何域名都行（包括直接存在本地的html文件）出于安全考虑最好只设置 你信任的来源也可以填域名表示只接受某个域名
  res.header("Access-Control-Allow-Origin", 'http://test.zengjie.com:10086'); //*表示可以跨域任何域名都行（包括直接存在本地的html文件）出于安全考虑最好只设置 你信任的来源也可以填域名表示只接受某个域名
  // res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type"); //可以支持的消息首部列表
  res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type"); //可以支持的消息首部列表
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS"); //可以支持的提交方式
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Content-Type", "application/json;charset=utf-8"); //响应头中定义的类型
  next();
});

app.listen(port, () => {
  console.log(`clockin backend app listening on port ${port}`);
});

// 为了通过res.body可获取post请求的数据
app.use(express.json());

app.use(cookieParser('secrete')) // 其参数用于加签名、解签名时

app.use("/api/record", recordRouter);
app.use("/api/user", userRouter);
