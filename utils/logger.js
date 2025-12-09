// utils/logger.js
const path = require('path');
const log4js = require('log4js');

log4js.configure({
  appenders: {
    // HTTP访问日志
    access: {
      type: 'file',
      filename: path.join(__dirname, '../logs/access.log'),
      maxLogSize: 1 * 1024 * 1024, // 1MB
      backups: 5,
      keepFileExt: true,
      pattern: '-yyyy-MM-dd', // 滚动时重命名为 access.log-yyyy-MM-dd
      alwaysIncludePattern: false // 设为false，确保原始文件名不变
    },

    // 应用日志文件（INFO、WARN级别）
    appFile: {
      type: 'file',
      filename: path.join(__dirname, '../logs/application.log'),
      maxLogSize: 1 * 1024 * 1024, // 1MB
      backups: 5,
      keepFileExt: true,
      pattern: '-yyyy-MM-dd', // 滚动时重命名为 application.log-yyyy-MM-dd
      alwaysIncludePattern: false
    },

    // 错误日志文件（仅ERROR级别）
    errorFile: {
      type: 'file',
      filename: path.join(__dirname, '../logs/error.log'),
      maxLogSize: 1 * 1024 * 1024, // 1MB
      backups: 5,
      keepFileExt: true,
      pattern: '-yyyy-MM-dd', // 滚动时重命名为 error.log-yyyy-MM-dd
      alwaysIncludePattern: false
    },

    // 控制台输出
    console: {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '%[[%d{yyyy-MM-dd hh:mm:ss}] [%p] [%c]%] %m'
      }
    },

    // ========== 关键：使用过滤器分离日志 ==========

    // 应用日志过滤器（只接受 INFO 和 WARN）
    appFilter: {
      type: 'logLevelFilter',
      appender: 'appFile',
      level: 'info',
      maxLevel: 'warn' // 只让 INFO 和 WARN 通过
    },

    // 错误日志过滤器（只接受 ERROR）
    errorFilter: {
      type: 'logLevelFilter',
      appender: 'errorFile',
      level: 'error',
      maxLevel: 'error' // 只让 ERROR 通过
    },

    // 控制台过滤器（所有级别都显示）
    consoleFilter: {
      type: 'logLevelFilter',
      appender: 'console',
      level: 'info' // 从 INFO 开始显示
    }
  },

  categories: {
    // 访问日志分类（独立处理HTTP请求）
    access: {
      appenders: ['access', 'consoleFilter'],
      level: 'info'
    },

    // 主应用日志分类 - 关键：使用过滤器而不是直接绑定文件
    default: {
      appenders: ['appFilter', 'errorFilter', 'consoleFilter'],
      level: 'info',
      enableCallStack: true
    }
  }
});

// 自定义Koa访问日志中间件（保持不变）
const koaLogger = (logger) => {
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;

    const logMessage = {
      timestamp: new Date().toISOString(),
      method: ctx.method,
      url: ctx.originalUrl || ctx.url,
      status: ctx.status,
      responseTime: `${ms}ms`,
      ip: ctx.ip || ctx.request.ip,
      userAgent: ctx.get('User-Agent') || '-',
      userId: ctx.state.user ? ctx.state.user.id : 'anonymous'
    };

    const jsonLog = JSON.stringify(logMessage);
    const accessLogger = log4js.getLogger('access');

    if (ctx.status >= 500) {
      accessLogger.error(jsonLog);
    } else if (ctx.status >= 400) {
      accessLogger.warn(jsonLog);
    } else {
      accessLogger.info(jsonLog);
    }
  };
};

// 导出记录器
exports.accessLogger = () => koaLogger(log4js.getLogger('access'));
exports.logger = log4js.getLogger(); // 使用默认分类，过滤器会自动分离日志

// 初始化日志示例
const initLogger = log4js.getLogger();
initLogger.info(
  `info日志系统初始化，文件大小上限设置为1MB，首次运行日期: ${new Date().toISOString()}`
);
initLogger.warn(
  `warn日志系统初始化，文件大小上限设置为1MB，首次运行日期: ${new Date().toISOString()}`
);
initLogger.error(
  `error日志系统初始化，文件大小上限设置为1MB，首次运行日期: ${new Date().toISOString()}`
);
