/**
 * project-file-picker 插件的 Host 半。
 *
 * 客户端（Client）模块负责所有界面和文件浏览；这里只做一件客户端做不到的事：
 * 浏览器不允许页面直接拉起 `obsidian://` 协议时（Electron / 严格策略会拦），
 * 由 Host 替它调起系统打开器。
 *
 * 实现方式：注册一个本地 HTTP 路由，客户端 POST 过来，Host 用系统命令拉起 URL。
 * 路由是 exact + POST，只接受「绝对路径」或「vault 名」，不接收整条 URI，
 * 免得客户端能把任意协议塞进来。
 */
import { isAbsolute } from 'node:path';

/** 客户端 POST 的地址。 */
const ROUTE = '/x-project-file-picker/obsidian';

/** 简单 JSON 回应。 */
function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** 拼 obsidian:// 地址；只认两种模式，别的一律拒绝。 */
function buildUri(payload) {
  const mode = payload !== null && typeof payload === 'object' && typeof payload.mode === 'string' ? payload.mode : '';
  if (mode === 'vault') {
    const vault = typeof payload.vault === 'string' ? payload.vault.trim() : '';
    if (vault === '' || /[\u0000-\u001f]/.test(vault)) return { error: 'bad-vault' };
    return { uri: 'obsidian://open?vault=' + encodeURIComponent(vault) };
  }
  if (mode === 'path') {
    const target = typeof payload.target === 'string' ? payload.target.trim() : '';
    if (target === '' || !isAbsolute(target)) return { error: 'bad-path' };
    return { uri: 'obsidian://open?path=' + encodeURIComponent(target.replace(/\\/g, '/')) };
  }
  return { error: 'bad-mode' };
}

/** 各平台拉起一个协议 URL 的命令（argv 形式，不过 shell，避免拼串注入）。 */
function openerFor(uri) {
  if (process.platform === 'win32') return ['rundll32.exe', 'url.dll,FileProtocolHandler', uri];
  if (process.platform === 'darwin') return ['open', uri];
  return ['xdg-open', uri];
}

/** 处理一次请求。 */
async function handle(ctx, request) {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'method' });
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json(400, { ok: false, error: 'body' });
  }
  const built = buildUri(payload);
  if (built.error !== undefined) return json(400, { ok: false, error: built.error });

  const subprocess = ctx.get('subprocess');
  if (subprocess === undefined) return json(503, { ok: false, error: 'no-subprocess' });
  try {
    const child = subprocess.spawn({
      argv: openerFor(built.uri),
      cwd: process.cwd(),
      stdio: { stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' },
      graceMs: 2000,
    });
    // 打开器退出与否不影响结果，这里只丢掉 rejection。
    child.done.catch(() => {});
  } catch (error) {
    return json(500, { ok: false, error: 'spawn', message: String(error !== undefined && error !== null && error.message !== undefined ? error.message : error) });
  }
  return json(200, { ok: true, uri: built.uri });
}

export function apply(ctx) {
  ctx.inject(['webServer'], (scoped) => {
    scoped.effect(() => scoped.webServer.register({
      kind: 'exact',
      path: ROUTE,
      resource: (request) => handle(scoped, request),
    }), 'project-file-picker: open-in-obsidian route');
  });
}
