var slugify = require('slugify');
const { koaBody } = require('koa-body');
const path = require('path');
const fs = require('fs');

const { generateSummary } = require('../utils/summary');
const MArticle = require('../models/articleModel.js');
const { logger } = require('../utils/logger');
class ArticleController {
  async getTags(ctx) {
    const ret = await MArticle.getTags();
    ctx.body = {
      code: 34,
      tags: ret
    };
  }
  async getCategories(ctx) {
    const ret = await MArticle.getCategories();
    ctx.body = {
      code: 34,
      categories: ret
    };
  }
  async getPublic(ctx) {
    let { page, limit } = ctx.request.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const res = await MArticle.getPublic(page, limit);
    ctx.body = { res: res };
  }
  async uploadContentImage(ctx) {
    const ciPath = path.join(__dirname, '../public/content/image/');
    const bodyParser = koaBody({
      multipart: true,
      formidable: {
        uploadDir: ciPath,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024,
        hashAlgorithm: 'md5',
        onFileBegin: (name, file) => {
          if (!fs.existsSync(ciPath)) {
            fs.mkdirSync(ciPath);
          }
        },
        onError: (error) => {
          console.log(error);
        }
      }
    });
    await new Promise((resolve) => bodyParser(ctx, resolve));
    const file = ctx.request.files?.file;
    if (file) {
      fs.renameSync(
        file.filepath,
        ciPath + file.hash + path.extname(file.newFilename)
      );
      ctx.body = {
        code: 34,
        url: `http://localhost:3000/content/image/${
          file.hash + path.extname(file.newFilename)
        }`
      };
    }
  }
  async uploadContentVideo(ctx) {
    const ciPath = path.join(__dirname, '../public/content/video/');
    const bodyParser = koaBody({
      multipart: true,
      formidable: {
        uploadDir: ciPath,
        keepExtensions: true,
        maxFileSize: 100 * 1024 * 1024,
        hashAlgorithm: 'md5',
        onFileBegin: (name, file) => {
          if (!fs.existsSync(ciPath)) {
            fs.mkdirSync(ciPath);
          }
        },
        onError: (error) => {
          console.log(error);
        }
      }
    });
    await new Promise((resolve) => bodyParser(ctx, resolve));
    const file = ctx.request.files?.file;
    console.log(file);
    if (file) {
      fs.renameSync(
        file.filepath,
        ciPath + file.hash + path.extname(file.newFilename)
      );
      ctx.body = {
        code: 34,
        url: `http://localhost:3000/content/video/${
          file.hash + path.extname(file.newFilename)
        }`
      };
    }
  }
  async getPublicDetail(ctx) {
    const { slug } = ctx.params;
    const data = await MArticle.getPublicDetail(slug);
    data.tags = data.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    ctx.body = {
      code: 34,
      data: data
    };
  }
  async searchTitle(ctx) {
    //
  }
  async newArticle(ctx) {
    //记住这里获取的status是布尔值，我在后面把它转换成字符串，记住了，回看代码的时候别忘记.
    let { title, content, summary, status, tag, category } = ctx.request.body;
    console.log(title, content, summary, status, tag, category);
    if (!title || !content) {
      ctx.body = {
        code: 67,
        msg: 'ERR_ARTICLE_OPTION'
      };
      return;
    }
    if (!summary) {
      summary = await generateSummary(content, 160);
    }
    let slug = slugify(title, {
      lower: true,
      strict: false, //true移除所有非单词字符
      locale: false,
      // remove: /[*+~.()'"!:@]/g,
      remove: /[*+~.()'"!:@?#<>\[\]{}|\\^`]/g,
      replacement: '-'
    });
    if (!Array.isArray(tag)) {
      ctx.body = {
        code: 44,
        msg: 'ERR_TAG_TYPE'
      };
      return;
    }
    if (tag.length == 0) {
      tag = [];
    }
    if (typeof value != 'number' && isNaN(category)) {
      category = 0;
    }
    if (status) {
      status = 'public';
    } else {
      status = 'private';
    }
    if (
      await MArticle.newArticle(
        title,
        slug,
        summary,
        content,
        ctx.state.user.username,
        status,
        tag,
        category
      )
    ) {
      ctx.body = {
        code: 34,
        msg: 'SUCC'
      };
    } else {
      ctx.body = {
        code: 44,
        msg: 'UNKNOWN'
      };
    }
  }
  async getPublicDevlog(ctx) {
    const ret = await MArticle.getPublicDevlog();
    ctx.body = {
      code: 34,
      log: ret
    };
    console.log(ret);
  }
  async test(ctx) {
    const { title, content } = ctx.request.body;
    let a = false;
    if (!a) {
      a = 'c';
    }
    ctx.body = {
      msg: 'summary'
    };
    console.log('-:', a);
  }
}

module.exports = new ArticleController();
