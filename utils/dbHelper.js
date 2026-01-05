const mysql = require('mysql2/promise');
// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'user', // 用户名
  password: process.env.DB_PASSWORD || 'password', // 密码
  database: process.env.DB_NAME || 'database', // 数据库名
  waitForConnections: true,
  connectionLimit: 10, // 连接池最大连接数
  queueLimit: 0, // 无限制的排队请求
  enableKeepAlive: true, // 保持连接活性
  keepAliveInitialDelay: 0 // 保持连接心跳延迟
});

// 测试连接
pool
  .getConnection()
  .then((connection) => {
    console.log('MariaDB 连接成功！');
    connection.release(); // 释放连接回连接池
  })
  .catch((err) => {
    console.error('MariaDB 连接失败:', err.message);
  });

// 导出连接池，以便在应用其他部分使用
module.exports = {
  query: async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },
  transaction: async (callback) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await callback(connection);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};
