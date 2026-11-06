// project-file-picker 的 Host 半冒烟测试。
// 直接加载 dev/index.js，用桩 ctx 抓路由注册和子进程调用，检查：
// 路由形状、POST 请求体校验、obsidian:// 地址拼装、各平台打开命令。
// 不需要真的启动 DSH，也不会真的打开 Obsidian。
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const target = path.resolve(process.argv[2] || 'dev/index.js');
// 先读一遍源码，顺便当语法检查。
readFileSync(target, 'utf8');
const module = await import(pathToFileURL(target).href);
if (typeof module.apply !== 'function') throw new Error('Host 半没有导出 apply()');

const routes = [];
const spawned = [];
const scoped = {
  effect(callback) {
    return callback();
  },
  webServer: {
    register(route) {
      routes.push(route);
      return () => {};
    },
  },
  get(name) {
    if (name !== 'subprocess') return undefined;
    return {
      spawn(spec) {
        spawned.push(spec);
        return { done: Promise.resolve({ exitCode: 0, signal: null }) };
      },
    };
  },
};
const ctx = {
  inject(deps, callback) {
    if (!Array.isArray(deps) || deps.indexOf('webServer') < 0) throw new Error('Host 半没有注入 webServer');
    callback(scoped);
  },
};

module.apply(ctx);

// 1. 路由注册。
if (routes.length !== 1) throw new Error('应该只注册一个路由，实际 ' + routes.length);
const route = routes[0];
if (route.kind !== 'exact') throw new Error('路由应该是 exact，实际 ' + route.kind);
if (route.path !== '/x-project-file-picker/obsidian') throw new Error('路由路径不对：' + route.path);
if (typeof route.resource !== 'function') throw new Error('路由没有 resource 处理器');

const post = (body) => new Request('http://127.0.0.1:1' + route.path, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

// 2. 文件：path 形式。
spawned.length = 0;
let response = await route.resource(post({ mode: 'path', target: 'F:/项目/笔记 a.md' }));
if (response.status !== 200) throw new Error('文件模式应该返回 200，实际 ' + response.status);
const fileResult = await response.json();
if (fileResult.ok !== true) throw new Error('文件模式没有返回 ok');
if (spawned.length !== 1) throw new Error('文件模式没有调用子进程');
const fileArgv = spawned[0].argv;
if (fileArgv.indexOf(encodeURIComponent('F:/项目/笔记 a.md')) >= 0) {
  throw new Error('argv 里不应该出现裸编码串');
}
if (fileArgv.indexOf('obsidian://open?path=' + encodeURIComponent('F:/项目/笔记 a.md')) < 0) {
  throw new Error('文件模式的 URI 不对：' + JSON.stringify(fileArgv));
}

// 3. 文件夹：vault 形式。
spawned.length = 0;
response = await route.resource(post({ mode: 'vault', vault: '我的 仓库' }));
if (response.status !== 200) throw new Error('vault 模式应该返回 200，实际 ' + response.status);
const vaultUri = 'obsidian://open?vault=' + encodeURIComponent('我的 仓库');
if (spawned[0].argv.indexOf(vaultUri) < 0) throw new Error('vault 模式的 URI 不对：' + JSON.stringify(spawned[0].argv));

// 4. 打开命令按平台选。
const opener = spawned[0].argv[0];
if (process.platform === 'win32' && opener !== 'rundll32.exe') throw new Error('Windows 应该用 rundll32，实际 ' + opener);
if (process.platform === 'darwin' && opener !== 'open') throw new Error('macOS 应该用 open，实际 ' + opener);
if (process.platform !== 'win32' && process.platform !== 'darwin' && opener !== 'xdg-open') {
  throw new Error('其它平台应该用 xdg-open，实际 ' + opener);
}

// 5. 非法请求。
const rejects = [
  [{ mode: 'path', target: '相对路径.md' }, 400],
  [{ mode: 'path' }, 400],
  [{ mode: 'vault' }, 400],
  [{ mode: 'vault', vault: '带\u0001控制字符' }, 400],
  [{ mode: 'http', target: 'https://example.com' }, 400],
  [{}, 400],
];
for (const [body, status] of rejects) {
  const failed = await route.resource(post(body));
  if (failed.status !== status) throw new Error('非法请求 ' + JSON.stringify(body) + ' 应该返回 ' + status + '，实际 ' + failed.status);
}
const getResponse = await route.resource(new Request('http://127.0.0.1:1' + route.path));
if (getResponse.status !== 405) throw new Error('GET 应该返回 405，实际 ' + getResponse.status);

// 6. 没有 subprocess 时不崩，返回 503。
const noSpawnCtx = {
  inject(deps, callback) {
    callback({
      effect: (callback2) => callback2(),
      webServer: { register: (r) => { routes.push(r); return () => {}; } },
      get: () => undefined,
    });
  },
};
module.apply(noSpawnCtx);
const noSpawnRoute = routes[routes.length - 1];
const noSpawnResponse = await noSpawnRoute.resource(post({ mode: 'path', target: 'F:/x.md' }));
if (noSpawnResponse.status !== 503) throw new Error('没有 subprocess 时应该返回 503，实际 ' + noSpawnResponse.status);

console.log('OK');
console.log('路由          :', route.kind, route.path);
console.log('文件 URI      :', 'obsidian://open?path=…');
console.log('vault URI     :', vaultUri);
console.log('打开命令      :', opener);
console.log('非法请求      :', rejects.length, '种都被拒绝，GET 405，无 subprocess 时 503');
