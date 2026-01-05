const { marked } = require('marked');

/**
 * 从Markdown生成摘要 (修复版)
 * @param {string} markdown - 原始Markdown字符串
 * @param {number} maxLength - 摘要最大长度，默认150字符
 * @returns {Promise<string>} 生成的摘要
 */
async function generateSummary(markdown, maxLength = 150) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  let plainText = '';

  // 配置marked：使用walkTokens钩子收集所有“文本”类型的令牌
  marked.use({
    walkTokens(token) {
      // 只收集类型为 'text', 'code', 'codespan' 等实际包含文字内容的令牌
      // 注意：这里我们选择忽略 'code' 和 'codespan'，因为代码通常不作为摘要
      if (token.type === 'text') {
        plainText += token.text + ' ';
      }
      // 如果你想在摘要中包含代码块内的文字，可以取消下面这行的注释
      // if (token.type === 'code' || token.type === 'codespan') {
      //   plainText += token.text + ' ';
      // }
    }
  });

  // 解析Markdown（walkTokens会在解析过程中被调用）
  await marked.parse(markdown, { async: true });

  // 清理并截取文本
  const cleanedText = plainText.replace(/\s+/g, ' ').trim();

  if (!cleanedText) {
    return ''; // 如果没有提取到文本，返回空字符串
  }

  if (cleanedText.length <= maxLength) {
    return cleanedText;
  }

  // 智能截断
  let summary = cleanedText.substr(0, maxLength);
  const lastSpace = summary.lastIndexOf(' ');
  const lastPeriod = Math.max(
    summary.lastIndexOf('。'),
    summary.lastIndexOf('.')
  );
  const cutIndex = Math.max(lastSpace, lastPeriod);

  if (cutIndex > maxLength * 0.5) {
    // 如果找到合适的截断点
    summary = summary.substr(0, cutIndex);
  }

  return summary + '...';
}

module.exports = { generateSummary };
