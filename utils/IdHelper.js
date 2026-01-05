// 第一位：固定为 E → 1种
// 第2-3位：日期编码 [1-9A-C][0-3] → 12种 × 4种 = 48种
// 第4-6位: 随机数 001-999 → 999
//理论最大数量: 1 × 48 × 999 = 47952
/**
 * 业务ID生成器
 * 格式：E + 2位日期 + 3位随机数
 * 检查内存中的重复（防止短时间内重复）
 */

// 存储最近生成的ID（防止同一请求中重复）
const recentIds = new Set();
const MAX_RECENT_SIZE = 1000;

/**
 * 生成唯一业务ID（带重复检查）
 * @returns {string} 6位业务ID
 */
function idGenerator() {
  let id;
  let attempts = 0;
  const maxAttempts = 10; // 最多尝试10次

  do {
    // 生成ID
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // 2位日期编码
    const dateCode = `${month}${Math.floor(day / 10)}`.slice(0, 2);

    // 3位随机数
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const randomStr = randomNum.toString().padStart(3, '0');

    id = `E${dateCode}${randomStr}`;

    attempts++;

    // 如果尝试次数太多，加时间戳避免死循环
    if (attempts >= maxAttempts) {
      const timestamp = Date.now().toString().slice(-2);
      id = `E${dateCode}${timestamp}${randomStr.slice(1)}`;
      break;
    }
  } while (recentIds.has(id)); // 检查是否重复

  // 添加到最近ID集合
  recentIds.add(id);

  // 控制集合大小
  if (recentIds.size > MAX_RECENT_SIZE) {
    const first = recentIds.values().next().value;
    recentIds.delete(first);
  }

  return id;
}

// 导出
module.exports = { idGenerator };
