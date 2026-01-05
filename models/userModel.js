const db = require('../utils/dbHelper');
const bcrypt = require('bcryptjs');

const MUser = {
  // async register(username, password, email, bio, avat) {
  async register(user) {
    if (!user.username || !user.password) {
      return {
        code: 44,
        msg: 'USER_OR_PASSWORD_INVAILD'
      };
    }
    const sql1 = `SELECT * FROM user WHERE user = ?`;
    const rows = await db.query(sql1, [user.username]);
    if (rows.length > 0) {
      return {
        code: 45,
        msg: 'USER_EXISTS'
      };
    }
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;
    while (!success && attempts < maxAttempts) {
      try {
        const sql = `
      INSERT INTO user 
      (bid, user, auth, email, bio, avat) 
      SELECT 
      LPAD(
        CONV(
          (
            UNIX_TIMESTAMP() * 1000 + 
            CONNECTION_ID() * 100 + 
            FLOOR(RAND() * 1000)
          ) % 2176782336, 
          10, 36
        ), 
        6, '0'
      ), ?, ?, ?, ?, ?
    `;

        const passwordHash = await bcrypt.hash(user.password, 10);
        const params = [
          user.username,
          passwordHash,
          user.email || null,
          user.bio || null,
          user.avat || null
        ];
        await db.query(sql, params);
        success = true;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          attempts++;

          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 10 * attempts));
          }
        } else {
          throw error;
        }
      }
    }
    if (success) {
      return {
        code: 34,
        msg: 'succ'
      };
    } else {
      return {
        code: 44,
        msg: 'unknow'
      };
    }
  },
  async login(username) {
    const sql = `select * from user WHERE user = ?`;
    const rows = await db.query(sql, [username]);
    return rows[0] || null;
  },
  async findById(id) {
    const sql = `select bid, user, email, avat, bio from user WHERE bid = ?`;
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  },

  async findByUsername(username) {
    const sql = `select bid, username, email, avat, bio from user WHERE username = ?`;
    const rows = await db.query(sql, [username]);
    return rows[0] || null;
  },

  /**
   * 验证用户密码
   * @param {string} plainPassword - 明文密码
   * @param {string} hashedPassword - 哈希密码
   * @returns {Promise<boolean>} 是否匹配
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} updateData - 要更新的字段
   * @returns {Promise<boolean>} 是否成功
   */
  async update(id, updateData) {
    // 动态构建 SET 子句
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    const result = await db.query(sql, values);
    return result.affectedRows > 0;
  }
};

module.exports = MUser;
