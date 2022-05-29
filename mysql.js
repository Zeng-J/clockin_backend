const mysql = require("mysql");
const config = require("./.mysqlConfig");

const connection = mysql.createConnection(config);
connection.connect(); // 用参数与数据库进行连接

function sqlQuery(sql) {
  return new Promise((resolve, reject) => {
    connection.query(sql, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

exports.sqlQuery = sqlQuery;
