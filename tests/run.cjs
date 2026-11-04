'use strict';
// 跑项目文件坞的冒烟测试。
// 用法：node tests/run.cjs dev/client.js
// 第二个参数是要测的 client.js 路径，不传就测 dev/client.js。
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const target = path.resolve(process.argv[2] || 'dev/client.js');
process.argv[2] = target;

import(pathToFileURL(path.join(__dirname, 'smoke.mjs')).href).catch((error) => {
  console.error(error);
  process.exit(1);
});
