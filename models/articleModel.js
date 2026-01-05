const { getPublic } = require('../controller/articleController');
const db = require('../utils/dbHelper');
const bcrypt = require('bcryptjs');

const MArticle = {
  async getTags() {
    const sql = `select id, name from tag`;
    const rows = await db.query(sql);
    return rows || null;
  },
  async getCategories() {
    const sql = `select id, name from category`;
    const rows = await db.query(sql);
    return rows || null;
  },

  async newArticle(
    title,
    slug,
    summary,
    content,
    username,
    status,
    tag,
    category
  ) {
    if (!title || !content || !username) {
      return false;
    }
    let retryCount = 0;
    const maxRetries = 5;
    try {
      await db.transaction(async (conn) => {
        const [[{ id }]] = await conn.execute(
          'select id from user where user=?;',
          [username]
        );
        if (!id) {
          throw new error('get user id error');
        }
        const uid = id;
        let irows;
        while (true) {
          try {
            irows = await conn.execute(
              'insert into article (title, slug, summary, content, uid, status) values (?, ?, ?, ?, ?, ?);',
              [
                title,
                slug && slug.trim() !== '' ? slug : title,
                summary || 'empty summary',
                content,
                uid,
                status || 'normal'
              ]
            );
            break;
          } catch (error) {
            if (error.code === 'ER_DUP_ENTRY' && retryCount < maxRetries) {
              retryCount++;
              slug = `${slug}-1`;
            } else {
              throw new Error('insert article error');
              break;
            }
          }
        }
        const ainsert = irows[0];
        console.log(ainsert);
        if (ainsert.affectedRows <= 0) {
          throw new Error('insert article error, affectedRows < 0');
        }
        if (tag.length > 0 && ainsert.insertId) {
          const placeholders = tag.map(() => '(?, ?)').join(', ');
          console.log('3. placeholders:', placeholders);

          const values = tag.flatMap((id) => {
            const pair = [ainsert.insertId, id];
            console.log(`   id=${id} -> 生成对:`, pair);
            // 立即检查是否有 undefined
            if (pair.includes(undefined)) {
              console.error(
                `   ⚠️ 发现 undefined! ainsert.insertId=${ainsert.insertId}, id=${id}`
              );
            }
            return pair;
          });

          console.log('4. 最终 values 数组:', values);
          console.log('   检查 values 中的 undefined:');
          values.forEach((val, index) => {
            if (val === undefined) {
              console.error(`   ⚠️ values[${index}] = undefined`);
            }
          });

          // 5. 执行前验证
          const hasUndefined = values.some((v) => v === undefined);
          if (hasUndefined) {
            console.error('❌ 发现 undefined 在 values 中，终止执行');
            throw new Error('参数包含 undefined');
          }

          console.log('5. 执行 SQL...');
          await conn.execute(
            `insert into articleTag (aID, tID) values ${placeholders};`,
            values
          );
        }
        if (category > 0 && ainsert) {
          await conn.execute(
            `insert into articleCategory (aID, cID) values (?, ?);`,
            [ainsert.insertId, category]
          );
        }
      });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  },
  async getPublic(page, limit) {
    const offset = (page - 1) * limit;
    console.log('page: ', page, offset, limit);
    let rows;
    let total;
    await db.transaction(async (conn) => {
      try {
        rows = await conn.execute(
          `
        SELECT 
            a.id AS id,
            a.title AS title,
            u.user AS author,
            c.name as category,
            COALESCE(
                GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ', '),
                'null'
            ) AS tags,
            a.slug AS slug,
            a.summary AS summary,
            a.created_time AS time,
            SUM(CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END) AS tag_count
        FROM article a
        LEFT JOIN user u ON a.uid = u.id
        LEFT JOIN articleTag at ON a.id = at.aID
        LEFT JOIN tag t ON at.tID = t.id
        left join articleCategory ac on a.id = ac.aID
        left join category c on ac.cID = c.id
        GROUP BY a.id
        ORDER BY a.created_time DESC
        LIMIT ? OFFSET ?
    `,
          [limit, offset]
        );
        [[{ total }]] = await conn.execute(
          'SELECT COUNT(*) as total FROM article'
        );
      } catch (error) {
        console.log(error);
        throw new Error('get data error');
      }
    });
    const processedRows = rows[0].map((row) => ({
      ...row,
      // tags: row.tags === 'null' ? [] : row.tags.split(', '),
      tags: !row.tags || row.tags === 'null' ? [] : row.tags.split(', '),
      tag_count: parseInt(row.tag_count) || 0
    }));
    return {
      data: processedRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    };
  },
  async getPublicDevlog(page, limit) {
    const sql = `select title, author, slug, time from devlog`;
    const rows = await db.query(sql);
    return rows || null;
  },
  async getPublicDetail(slug) {
    const sql = `
    SELECT 
    a.title AS title,
    u.user AS author,
    c.name as category,
    COALESCE(
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ', '),
      ''
    ) AS tags,
    a.slug AS slug,
    a.summary AS summary,
    a.content AS content,
    a.updated_time AS time
    FROM article a
    LEFT JOIN user u ON a.uid = u.id
    LEFT JOIN articleTag at ON a.id = at.aID
    LEFT JOIN tag t ON at.tID = t.id
    LEFT JOIN articleCategory ac ON a.id = ac.aID
    LEFT JOIN category c ON ac.cID = c.id
    -- 添加WHERE条件
    WHERE a.slug=?
    GROUP BY a.id
    ORDER BY a.created_time DESC;`;
    const rows = await db.query(sql, [slug]);
    return rows[0] || null;
  }
};

module.exports = MArticle;
