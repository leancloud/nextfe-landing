'use strict';

const app = require('./app');
// 端口一定要从环境变量 `LEANCLOUD_APP_PORT` 中获取。
// LeanEngine 运行时会分配端口并赋值到该变量。
const PORT = parseInt(process.env.LEANCLOUD_APP_PORT || process.env.PORT || 3000, 10);
app.listen(PORT, () => {
  console.log('Node app is running on port:', PORT);
  // 注册全局未捕获异常处理器
  process.on('uncaughtException', (err) => {
    console.error('Caught exception:', err.stack);
  });
  process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason.stack);
  });
});
