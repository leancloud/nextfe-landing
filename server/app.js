'use strict';

const express = require('express');
const timeout = require('connect-timeout');

const app = express();
app.use(express.static('./build'));
// 设置默认超时时间
app.use(timeout('15s'));

app.use((req, res, next) => {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  if (!res.headersSent) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use((err, req, res) => {
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  const statusCode = err.status || 500;
  if (statusCode === 500) {
    console.error(err.stack || err);
  }
  if (req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  let error = {};
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error
  });
});

module.exports = app;
