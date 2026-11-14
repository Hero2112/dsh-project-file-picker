// project-file-picker 的 Host 半冒烟测试。
// 1.6.1 起 Host 半是空实现：Obsidian 的本地路由随功能一起移除，插件只做界面。
// 这里检查导出形状、以及 apply() 不注册路由、不取服务、不抛异常。
// 不需要真的启动 DSH，也不会拉起任何外部程序。
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const target = path.resolve(process.argv[2] || 'dev/index.js');
// 先读一遍源码，顺便当语法检查。
readFileSync(target, 'utf8');
const module = await import(pathToFileURL(target).href);
if (typeof module.apply !== 'function') throw new Error('Host 半没有导出 apply()');

// 只要 apply() 去碰 ctx 的任何东西，下面的桩就会炸。
const touched = [];
const trap = () => {
  touched.push(new Error().stack);
  throw new Error('Host 半不应该再使用 ctx');
};
const ctx = new Proxy({}, {
  get() { trap(); },
  has() { trap(); },
  apply() { trap(); },
});

const result = module.apply(ctx);
if (result !== undefined) throw new Error('apply() 不应该有返回值');
if (touched.length !== 0) throw new Error('apply() 不应该访问 ctx');
module.apply(undefined);

console.log('OK');
console.log('Host 半 : 空实现，apply() 不注册路由、不取服务、不订阅事件');
