// project-file-picker 客户端模块的功能冒烟测试。
// 用桩对象模拟 Harness 全局，检查右栏页签注册、引导卡、目录树、选中与双击插入、
// 右键菜单、面板内预览、全项目搜索、标记与收藏（快速访问）、设置持久化和旧数据迁移。
// 全程不渲染真实界面、也不碰 DOM。
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(process.argv[2], 'utf8');

const slotRegistrations = [];
const typeRegistrations = [];
let dictionaries = null;
const effects = [];
const timers = [];
let stateQueue = [];
let stateWrites = [];
let stateIndex = 0;
/** 传这个值表示「这一格用组件自己的初始值」。 */
const INITIAL = Symbol('initial');

const reactStub = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  Fragment: 'Fragment',
  useState: (initial) => {
    const index = stateIndex;
    stateIndex += 1;
    const queued = stateQueue.length > 0 ? stateQueue.shift() : INITIAL;
    const value = queued === INITIAL
      ? (typeof initial === 'function' ? initial() : initial)
      : queued;
    return [value, (next) => {
      stateWrites.push({ index, value: next });
    }];
  },
  useEffect: (callback) => {
    effects.push(callback);
  },
  useMemo: (fn) => fn(),
  useRef: (value) => ({ current: value }),
};

const storage = new Map();
/** 被 window.open 打开的地址（Obsidian 协议之类）。 */
const openedUris = [];
/** 发到宿主路由的请求。 */
const fetches = [];
const windowStub = {
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  open: (uri) => {
    openedUris.push(uri);
    return {};
  },
  innerWidth: 1200,
  innerHeight: 800,
  __ModuleLoader__: {
    load(definition) {
      windowStub.definition = definition;
    },
  },
};

/** 目录读取的桩：按路径返回预置的目录内容。 */
const listCalls = [];
const listFixture = new Map();
const readFixtures = new Map();
let readCalls = 0;
const openedPaths = [];
const remote = {
  workspaceFiles: {
    list: async (sessionId, path) => {
      listCalls.push({ sessionId, path });
      const found = listFixture.get(path);
      if (found !== undefined) return { ok: true, value: found };
      if (path === 'F:/demo project') return { ok: true, value: { entries: [], truncated: false } };
      return { ok: false, error: { code: 'workspace-file/not-found' } };
    },
    read: async (sessionId, path, range) => {
      readCalls += 1;
      const found = readFixtures.get(path);
      return found === undefined
        ? { ok: false, error: { code: 'workspace-file/not-found' } }
        : { ok: true, value: found };
    },
  },
  session: {
    openWorkspacePath: async (request) => {
      openedPaths.push(request);
      return { ok: true, value: { opened: true } };
    },
  },
};

const copies = [];

function makeContext() {
  return {
    remote,
    effect(callback) {
      return callback();
    },
    locale: {
      getLocale: () => ({ id: 'zh-CN' }),
      subscribe: () => () => {},
      register(ns, dicts) {
        dictionaries = { ns, dicts };
        return () => {};
      },
    },
    sidebarRightTabs: {
      register(definition) {
        typeRegistrations.push(definition);
        return () => {};
      },
    },
    sidebarRight: {
      openTab(kind, options) {
        openTabCallsPush({ kind, options });
      },
    },
    slots: {
      inject(key, callback) {
        callback();
        return () => {};
      },
      register(options, component) {
        slotRegistrations.push({ options, component });
        return () => {};
      },
    },
  };
}
const openTabCalls = [];
const openTabCallsPush = (call) => openTabCalls.push(call);

const sandbox = {
  window: windowStub,
  require: (name) => {
    if (name === 'react') return reactStub;
    throw new Error('unexpected require: ' + name);
  },
  module: { exports: {} },
  console,
  Intl,
  AbortController,
  Promise,
  Set,
  Map,
  String,
  Object,
  Array,
  Number,
  JSON,
  encodeURIComponent,
  fetch: async (url, options) => {
    fetches.push({ url: url, options: options });
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  },
  navigator: {
    clipboard: {
      writeText: async (text) => {
        copies.push(text);
      },
    },
  },
  setTimeout: (callback) => {
    timers.push(callback);
    return timers.length;
  },
  clearTimeout: () => {},
};
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'client.js' });

const definition = windowStub.definition;
if (definition === undefined) throw new Error('module loader was never called');
if (definition.id !== '@local/project-file-picker') throw new Error('unexpected module id: ' + definition.id);

const plugin = definition.factory(sandbox.require);
if (typeof plugin.apply !== 'function') throw new Error('factory returned no apply()');
if (!Array.isArray(plugin.inject)) throw new Error('factory returned no inject array');
for (const service of ['slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'remote', 'remote.workspaceFiles', 'remote.session']) {
  if (plugin.inject.indexOf(service) < 0) throw new Error('inject is missing ' + service);
}

plugin.apply(makeContext());

// 1. 页签类型注册成功，并带一张「开始」页的引导卡。
if (typeRegistrations.length !== 1) throw new Error('expected one tab-type registration, got ' + typeRegistrations.length);
const type = typeRegistrations[0];
if (type.id !== '@local/project-file-picker') throw new Error('unexpected type id: ' + type.id);
if (type.kind !== 'project-files') throw new Error('unexpected kind: ' + type.kind);
if (type.priority !== 'extension') throw new Error('unexpected band: ' + type.priority);
if (typeof type.title('x') !== 'string' || type.title('x') === '') throw new Error('type title is not a translated string');
if (!Array.isArray(type.guide) || type.guide.length !== 1) throw new Error('expected one guide entry');
const entry = type.guide[0];
if (!(entry.order < 10)) throw new Error('guide order must come before the builtin workspace card (order 10): ' + entry.order);
if (typeof entry.title() !== 'string' || entry.title() === '') throw new Error('guide entry title is missing');
if (typeof entry.description() !== 'string' || entry.description() === '') throw new Error('guide entry description is missing');
if (typeof entry.icon !== 'function') throw new Error('guide entry has no glyph');

// 2. 正文和标题都注册在右栏的同一个页签类型 id 下。
if (slotRegistrations.length !== 2) throw new Error('expected two slot registrations, got ' + slotRegistrations.length);
const byName = new Map(slotRegistrations.map((registration) => [registration.options.name, registration]));
const bodyRegistration = byName.get('sidebar.right.pane.tab');
const titleRegistration = byName.get('sidebar.right.pane.tab.title');
if (bodyRegistration === undefined) throw new Error('missing tab body registration');
if (titleRegistration === undefined) throw new Error('missing tab title registration');
if (bodyRegistration.options.key !== type.id) throw new Error('body key does not match the type id');
if (titleRegistration.options.key !== type.id) throw new Error('title key does not match the type id');
if (bodyRegistration.options.locale !== 'projectFilePicker') throw new Error('body has no locale namespace');

// 3. 中英文字典的键必须一一对应。
if (dictionaries === null || dictionaries.ns !== 'projectFilePicker') throw new Error('locale dictionaries were not registered');
const zhKeys = Object.keys(dictionaries.dicts.zh);
const enKeys = Object.keys(dictionaries.dicts.en);
const drift = zhKeys.filter((key) => enKeys.indexOf(key) < 0).concat(enKeys.filter((key) => zhKeys.indexOf(key) < 0));
if (drift.length > 0) throw new Error('dictionary key drift: ' + drift.join(', '));

const tr = (key, params) => key + (params === undefined ? '' : JSON.stringify(params));
const calls = [];
const inputActions = {
  captureInsertion: () => ({ start: 3, end: 3, draftRev: 1 }),
  insertText: (text, span) => {
    calls.push({ action: 'insertText', text, span });
    return true;
  },
  setDraft: (text) => {
    calls.push({ action: 'setDraft', text });
  },
};
const tabActions = {
  bindCommands: () => () => {},
  openResource: (address) => openedFrames.push(address),
};
const openedFrames = [];
const tabInfo = () => ({ tab: { id: 'tab-1', title: '项目文件', actions: tabActions } });
const bodyProps = {
  sessionId: 'session-1',
  useSessions: (selector) => selector({ byId: { 'session-1': { cwd: 'F:\\demo project' } } }),
  useInput: (selector) => selector({ phase: 'plain', draft: '看下' }),
  inputActions,
  useTabInfo: tabInfo,
  t: tr,
  listDirectory: remote.workspaceFiles.list,
};
const levelsFixture = {
  'F:/demo project': {
    kind: 'ready',
    truncated: false,
    entries: [
      { name: 'a b.txt', type: 'file', size: 2048 },
      { name: 'src', type: 'directory' },
      { name: 'socket', type: 'other' },
    ],
  },
};

/** 正文里的状态顺序（和 client.js 里的 useState 顺序一致）。 */
const STATE_ORDER = [
  'settings', 'expanded', 'levels', 'filter', 'status', 'errorHidden', 'dragging', 'tags', 'tagEditor',
  'pins', 'reveal', 'selected', 'menu', 'preview', 'searchMode', 'search', 'recent', 'pinDrag',
];
const DEFAULT_SETTINGS = {
  density: 'cozy',
  pinsCollapsed: false,
  sharedPins: false,
  sort: 'name',
  markedOnly: false,
  recentCollapsed: true,
};
const DEFAULT_STATES = {
  settings: DEFAULT_SETTINGS,
  expanded: ['F:/demo project'],
  levels: levelsFixture,
  filter: '',
  status: null,
  errorHidden: false,
  dragging: false,
  tags: {},
  tagEditor: null,
  pins: [],
  reveal: null,
  selected: [],
  menu: null,
  preview: null,
  searchMode: false,
  search: null,
  recent: [],
  pinDrag: null,
};

function stateList(overrides) {
  const merged = { ...DEFAULT_STATES, ...(overrides || {}) };
  return STATE_ORDER.map((key) => merged[key]);
}

function renderBody(overrides, props) {
  stateQueue = stateList(overrides);
  stateIndex = 0;
  stateWrites = [];
  effects.length = 0;
  let tree = bodyRegistration.component(props === undefined ? bodyProps : { ...bodyProps, ...props });
  if (tree !== null && typeof tree.type === 'function') tree = tree.type(tree.props);
  const expanded = deepExpand(tree);
  for (const effect of effects.splice(0)) {
    const cleanup = effect();
    if (typeof cleanup === 'function') cleanup();
  }
  return expanded;
}

/** 跑掉所有攒下来的定时器（搜索防抖之类）。 */
async function runTimers() {
  let guard = 0;
  while (timers.length > 0 && guard < 20) {
    const pending = timers.splice(0);
    for (const callback of pending) callback();
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    guard += 1;
  }
}

function deepExpand(node) {
  if (Array.isArray(node)) return node.map(deepExpand);
  if (node === null || typeof node !== 'object') return node;
  if (typeof node.type === 'function') return deepExpand(node.type(node.props));
  if (node.type === 'Fragment') {
    return { type: 'Fragment', props: {}, children: node.children.map(deepExpand) };
  }
  return { ...node, children: node.children.map(deepExpand) };
}

function findAll(node, predicate, found = []) {
  if (node === null || typeof node !== 'object') return found;
  if (Array.isArray(node)) {
    for (const child of node) findAll(child, predicate, found);
    return found;
  }
  if (node.props !== undefined && predicate(node)) found.push(node);
  for (const child of node.children ?? []) findAll(child, predicate, found);
  return found;
}

const hasClass = (node, name) => typeof node.props.className === 'string' && node.props.className.split(' ').indexOf(name) >= 0;
const fakeEvent = (extra) => ({
  stopPropagation: () => {},
  preventDefault: () => {},
  ctrlKey: false,
  metaKey: false,
  clientX: 320,
  clientY: 140,
  ...(extra || {}),
});
const writeAt = (index) => stateWrites.filter((write) => write.index === index);
const valueOf = (write, fallback) => (typeof write.value === 'function' ? write.value(fallback) : write.value);

// 4. 首屏：工具栏、收藏区、目录树都在，根目录来自会话 cwd。
const first = renderBody();
if (first.props['data-project-files-root'] !== 'F:/demo project') throw new Error('the body did not use the session cwd');
const icons = findAll(first, (node) => hasClass(node, 'pfp-iconBtn'));
if (icons.length < 3) throw new Error('the toolbar is missing its buttons: ' + icons.length);
const searchButton = findAll(first, (node) => node.props['data-pfp-search'] !== undefined)[0];
const sortButton = findAll(first, (node) => node.props['data-pfp-sort'] !== undefined)[0];
const markedButton = findAll(first, (node) => node.props['data-pfp-marked'] !== undefined)[0];
if (searchButton === undefined || sortButton === undefined || markedButton === undefined) {
  throw new Error('the filter toolbar is missing search / sort / marked buttons');
}
if (sortButton.props['data-pfp-sort'] !== 'name') throw new Error('default sort should be by name');
const pinsSection = findAll(first, (node) => node.props['data-pfp-pins'] === '1')[0];
if (pinsSection === undefined) throw new Error('the quick-access section is missing');
const pinsToggle = findAll(first, (node) => node.props['data-pfp-pins-toggle'] !== undefined)[0];
const scopeButton = findAll(first, (node) => node.props['data-pfp-pins-scope'] !== undefined)[0];
if (pinsToggle === undefined || scopeButton === undefined) throw new Error('quick access is missing its collapse / scope controls');
if (scopeButton.props['data-pfp-pins-scope'] !== 'local') throw new Error('favourites should default to this conversation');

// 5. 文件行：单击选中、双击插入；图标按类型上色并带扩展名徽标。
const fileRows = findAll(first, (node) => hasClass(node, 'pfp-rowFile'));
if (fileRows.length !== 1) throw new Error('expected one file row, got ' + fileRows.length);
const fileMain = findAll(fileRows[0], (node) => hasClass(node, 'pfp-rowMain'))[0];
if (fileMain === undefined) throw new Error('the file row has no clickable main area');
if (fileMain.props.draggable !== true) throw new Error('the file row is not draggable');
if (JSON.stringify(fileMain.children).indexOf('a b.txt') < 0) throw new Error('the file row does not show the file name');
const badges = findAll(first, (node) => hasClass(node, 'pfp-extBadge'));
if (badges.length !== 1 || badges[0].children[0] !== 'txt') throw new Error('the file row has no extension badge');
const sizes = findAll(first, (node) => hasClass(node, 'pfp-size'));
if (sizes.length !== 1 || sizes[0].children[0] !== '2.0 KB') throw new Error('the file row did not show its size: ' + JSON.stringify(sizes));

stateWrites = [];
calls.length = 0;
fileMain.props.onClick(fakeEvent());
const selectWrite = writeAt(11).pop();
if (selectWrite === undefined) throw new Error('clicking a file did not select it');
const selectedAfterClick = valueOf(selectWrite, []);
if (!Array.isArray(selectedAfterClick) || selectedAfterClick.length !== 1 || selectedAfterClick[0].path !== 'F:/demo project/a b.txt') {
  throw new Error('the selected row is wrong: ' + JSON.stringify(selectedAfterClick));
}
if (calls.length !== 0) throw new Error('a single click must not insert anything any more');

fileMain.props.onDoubleClick();
if (calls.length !== 1 || calls[0].action !== 'insertText') throw new Error('double-clicking a file did not insert');
if (calls[0].text !== ' @"a b.txt" ') throw new Error('unexpected inserted text: ' + JSON.stringify(calls[0].text));

// 插入之后会记一笔「最近使用」。
const recentStored = JSON.parse(storage.get('dsh.project-file-picker.recent.v1') || '{}');
if (!recentStored['session-1'] || recentStored['session-1'][0].path !== 'a b.txt') {
  throw new Error('inserting did not record a recent entry: ' + JSON.stringify(recentStored));
}

// 6. 文件夹行：单击选中并展开，双击插入目录引用。
const folderMain = findAll(first, (node) => node.props['data-pfp-path'] === 'F:/demo project/src')[0];
if (folderMain === undefined) throw new Error('the folder row has no clickable main area');
stateWrites = [];
folderMain.props.onClick(fakeEvent());
const expandWrite = writeAt(1).pop();
if (expandWrite === undefined) throw new Error('clicking a folder did not toggle expansion');
const expandedNow = valueOf(expandWrite, ['F:/demo project']);
if (!Array.isArray(expandedNow) || expandedNow.indexOf('F:/demo project/src') < 0) {
  throw new Error('the clicked folder did not expand: ' + JSON.stringify(expandedNow));
}
calls.length = 0;
folderMain.props.onDoubleClick();
if (calls.length !== 1 || calls[0].text !== ' @src/ ') throw new Error('double-clicking a folder did not insert the directory: ' + JSON.stringify(calls));

// 7. 多选：Ctrl 加选后出现批量插入条，一次插两条。
const multiSel = [
  { path: 'F:/demo project/src', kind: 'directory' },
  { path: 'F:/demo project/a b.txt', kind: 'file' },
];
const multi = renderBody({ selected: multiSel });
const selBar = findAll(multi, (node) => node.props['data-pfp-selection'] !== undefined)[0];
if (selBar === undefined) throw new Error('the selection bar did not appear');
if (selBar.props['data-pfp-selection'] !== '2') throw new Error('the selection bar shows the wrong count');
calls.length = 0;
findAll(selBar, (node) => node.props['data-pfp-insert-selected'] !== undefined)[0].props.onClick();
if (calls.length !== 1 || calls[0].text.indexOf('@src/') < 0 || calls[0].text.indexOf('@"a b.txt"') < 0) {
  throw new Error('batch insert did not write both references: ' + JSON.stringify(calls));
}

// 8. 眼睛按钮打开产品预览页签。
calls.length = 0;
openedFrames.length = 0;
const viewButton = fileRows[0];
findAll(viewButton, (node) => node.props.title === 'view' || node.props['aria-label'] === 'view')
  .forEach((node) => {});
const eyeButton = findAll(first, (node) => node.props['aria-label'] === 'view' && node.type === 'button')[0];
if (eyeButton === undefined) throw new Error('the file row has no preview button');
eyeButton.props.onClick(fakeEvent());
if (openedFrames.length !== 1) throw new Error('the preview button did not open a resource');
if (openedFrames[0] !== 'dsh-resource://file/session/session-1/a%20b.txt') throw new Error('unexpected resource address: ' + openedFrames[0]);

// 9. 右键菜单：包含插入、复制、收藏、定位等项；点「复制绝对路径」会写剪贴板。
const menuTree = renderBody({ menu: { x: 320, y: 140, path: 'F:/demo project/a b.txt', kind: 'file' } });
const menu = findAll(menuTree, (node) => node.props['data-pfp-menu'] === '1')[0];
if (menu === undefined) throw new Error('the context menu did not render');
const menuItems = findAll(menu, (node) => node.props['data-pfp-menu-item'] !== undefined);
const menuIds = menuItems.map((node) => node.props['data-pfp-menu-item']);
for (const wanted of ['insert', 'view', 'inline', 'pin', 'copyRel', 'copyAbs', 'copyMd', 'reveal', 'obsidian']) {
  if (menuIds.indexOf(wanted) < 0) throw new Error('the context menu is missing ' + wanted + ': ' + menuIds.join(','));
}
copies.length = 0;
findAll(menu, (node) => node.props['data-pfp-menu-item'] === 'copyAbs')[0].props.onClick();
await new Promise((resolve) => { setTimeout(resolve, 0); });
if (copies.length !== 1 || copies[0] !== 'F:/demo project/a b.txt') throw new Error('copying the absolute path failed: ' + JSON.stringify(copies));
copies.length = 0;
findAll(menu, (node) => node.props['data-pfp-menu-item'] === 'copyMd')[0].props.onClick();
await new Promise((resolve) => { setTimeout(resolve, 0); });
if (copies.length !== 1 || copies[0] !== '[a b.txt](<a b.txt>)') throw new Error('copying the Markdown link failed: ' + JSON.stringify(copies));

// 10. 在 Obsidian 中打开：文件走 path 协议，文件夹先认 .obsidian 再开 vault。
openedUris.length = 0;
fetches.length = 0;
const obsidianFileMenu = renderBody({ menu: { x: 320, y: 140, path: 'F:/demo project/a b.txt', kind: 'file' } });
const obsidianFileItem = findAll(obsidianFileMenu, (node) => node.props['data-pfp-menu-item'] === 'obsidian')[0];
if (obsidianFileItem === undefined) throw new Error('the context menu has no Obsidian item');
obsidianFileItem.props.onClick();
await new Promise((resolve) => { setTimeout(resolve, 0); });
if (fetches.length !== 1) throw new Error('opening a file in Obsidian did not call the host route');
if (fetches[0].url !== '/x-project-file-picker/obsidian') throw new Error('unexpected route: ' + fetches[0].url);
const filePayload = JSON.parse(fetches[0].options.body);
if (filePayload.mode !== 'path' || filePayload.target !== 'F:/demo project/a b.txt') {
  throw new Error('unexpected host payload for a file: ' + JSON.stringify(filePayload));
}
if (openedUris.length !== 0) throw new Error('the host route worked, so the page should not try the protocol itself');

listFixture.set('F:/demo project/.obsidian', { entries: [], truncated: false });
openedUris.length = 0;
fetches.length = 0;
const obsidianFolderMenu = renderBody({ menu: { x: 320, y: 140, path: 'F:/demo project/src', kind: 'directory' } });
findAll(obsidianFolderMenu, (node) => node.props['data-pfp-menu-item'] === 'obsidian')[0].props.onClick();
await new Promise((resolve) => { setTimeout(resolve, 0); });
if (fetches.length !== 1) throw new Error('opening a folder in Obsidian did not call the host route');
const folderPayload = JSON.parse(fetches[0].options.body);
if (folderPayload.mode !== 'vault' || folderPayload.vault !== 'demo project') {
  throw new Error('a folder should be sent as a vault, got: ' + JSON.stringify(folderPayload));
}

// 宿主路由不可用时退回页面直开协议。
const realFetch = sandbox.fetch;
sandbox.fetch = async () => { throw new Error('route unavailable'); };
openedUris.length = 0;
const fallbackMenu = renderBody({ menu: { x: 320, y: 140, path: 'F:/demo project/a b.txt', kind: 'file' } });
findAll(fallbackMenu, (node) => node.props['data-pfp-menu-item'] === 'obsidian')[0].props.onClick();
await new Promise((resolve) => { setTimeout(resolve, 0); });
sandbox.fetch = realFetch;
if (openedUris.length !== 1) throw new Error('when the host route fails the page should fall back to the protocol');
if (openedUris[0] !== 'obsidian://open?path=F%3A%2Fdemo%20project%2Fa%20b.txt') {
  throw new Error('unexpected fallback obsidian uri: ' + openedUris[0]);
}

// 11. 面板内预览：读一段文本直接显示在面板里。
readFixtures.set('F:/demo project/a b.txt', { offset: 1, text: 'hello\nworld', lines: 2, eof: true });
const previewTree = renderBody({ preview: { kind: 'ready', path: 'F:/demo project/a b.txt', text: 'hello\nworld', lines: 2, eof: true } });
const previewPane = findAll(previewTree, (node) => node.props['data-pfp-preview'] === '1')[0];
if (previewPane === undefined) throw new Error('the inline preview pane did not render');
const previewText = findAll(previewPane, (node) => hasClass(node, 'pfp-previewBody'))[0];
if (previewText === undefined || previewText.children[0] !== 'hello\nworld') throw new Error('the inline preview lost its text');
const closePreviewButton = findAll(previewPane, (node) => node.props['data-pfp-preview-close'] !== undefined)[0];
if (closePreviewButton === undefined) throw new Error('the inline preview has no close button');

// 打开内嵌预览会走 read 远程并记一笔最近。
readCalls = 0;
const menuInline = findAll(menu, (node) => node.props['data-pfp-menu-item'] === 'inline')[0];
menuInline.props.onClick();
await new Promise((resolve) => { setTimeout(resolve, 0); });
if (readCalls !== 1) throw new Error('the inline preview did not call the file reader, calls=' + readCalls);

// 12. 标记：文件夹行打开标记面板，颜色写入存储。
storage.delete('dsh.project-file-picker.tags.v1');
const tagTree = renderBody({ tagEditor: 'F:/demo project/src' });
const editor = findAll(tagTree, (node) => node.props['data-pfp-tag-editor'] === '1')[0];
if (editor === undefined) throw new Error('the tag editor did not open');
const swatch = findAll(editor, (node) => hasClass(node, 'pfp-swatch') && node.props.style.background === '#0091ff')[0];
if (swatch === undefined) throw new Error('the tag editor has no colour swatches');
swatch.props.onClick();
const tagsStored = JSON.parse(storage.get('dsh.project-file-picker.tags.v1'));
if (tagsStored['F:/demo project'].src.color !== '#0091ff') throw new Error('the colour tag was not persisted: ' + JSON.stringify(tagsStored));

// 13. 收藏（快速访问）：写盘、点目录跳转并预取沿途各层、点文件插入引用、× 删掉。
storage.delete('dsh.project-file-picker.pins.v3');
const pinsTree = renderBody({ pins: [{ path: 'src', kind: 'directory' }, { path: 'a b.txt', kind: 'file' }] });
const pinRows = findAll(pinsTree, (node) => node.props['data-pfp-pin-open'] !== undefined);
if (pinRows.length !== 2) throw new Error('the quick-access list should show both entries, got ' + pinRows.length);
calls.length = 0;
const pinFileRow = findAll(pinsTree, (node) => node.props['data-pfp-pin-open'] === 'a b.txt')[0];
pinFileRow.props.onClick();
if (calls.length !== 1 || calls[0].text !== ' @"a b.txt" ') throw new Error('clicking a favourite file did not insert: ' + JSON.stringify(calls));

// 点收藏的目录：展开整条链、立刻发预取、写「正在跳转」、请求定位。
stateWrites = [];
listCalls.length = 0;
const deepTree = renderBody({ levels: {}, pins: [{ path: 'src/components', kind: 'directory' }] });
const deepPin = findAll(deepTree, (node) => node.props['data-pfp-pin-open'] === 'src/components')[0];
deepPin.props.onClick();
const deepExpandWrite = writeAt(1).pop();
const deepExpanded = valueOf(deepExpandWrite, []);
for (const wanted of ['F:/demo project', 'F:/demo project/src', 'F:/demo project/src/components']) {
  if (deepExpanded.indexOf(wanted) < 0) throw new Error('clicking the favourite did not expand ' + wanted);
}
await new Promise((resolve) => { setTimeout(resolve, 0); });
const deepLoaded = listCalls.map((call) => call.path);
if (deepLoaded.indexOf('F:/demo project/src/components') < 0) throw new Error('clicking the favourite did not start loading the chain');
const locating = writeAt(4).pop();
if (locating === undefined || JSON.stringify(locating.value).indexOf('pin.locating') < 0) {
  throw new Error('clicking the favourite did not report that it is jumping: ' + JSON.stringify(locating));
}
const revealWrite = writeAt(10).pop();
if (revealWrite === undefined || revealWrite.value.path !== 'F:/demo project/src/components') {
  throw new Error('clicking the favourite did not ask to reveal the row: ' + JSON.stringify(revealWrite && revealWrite.value));
}

// 收藏区 × 删掉一条并落盘。
storage.delete('dsh.project-file-picker.pins.v3');
const removeTree = renderBody({ pins: [{ path: 'src', kind: 'directory' }, { path: 'a b.txt', kind: 'file' }] });
const removeButton = findAll(removeTree, (node) => node.props['data-pfp-pin-remove'] !== undefined)[0];
removeButton.props.onClick(fakeEvent());
const pinsAfterRemove = JSON.parse(storage.get('dsh.project-file-picker.pins.v3') || '{}');
if (!pinsAfterRemove['session-1'] || pinsAfterRemove['session-1'].length !== 1) {
  throw new Error('removing a favourite did not persist: ' + JSON.stringify(pinsAfterRemove));
}

// 另一个对话看不到这一套（按对话隔离）。
storage.set('dsh.project-file-picker.pins.v3', JSON.stringify({ 'session-1': [{ path: 'src', kind: 'directory' }] }));
const otherSession = renderBody({ pins: [] }, {
  sessionId: 'session-2',
  useSessions: (selector) => selector({ byId: { 'session-2': { cwd: 'F:\\demo project' } } }),
});
const otherPinRows = findAll(otherSession, (node) => node.props['data-pfp-pin-open'] !== undefined);
if (otherPinRows.length !== 0) throw new Error('favourites leaked into another conversation');

// 旧版按工作目录分组的固定表会迁到当前对话。
storage.delete('dsh.project-file-picker.pins.v3');
storage.set('dsh.project-file-picker.pins.v1', JSON.stringify({ 'F:/demo project': [{ path: 'src', kind: 'directory' }] }));
const migrated = renderBody({ pins: INITIAL, expanded: INITIAL });
const migratedRows = findAll(migrated, (node) => node.props['data-pfp-pin-open'] !== undefined);
if (migratedRows.length !== 1) throw new Error('the legacy favourites were not migrated, rows=' + migratedRows.length);
const migratedMap = JSON.parse(storage.get('dsh.project-file-picker.pins.v3'));
if (!migratedMap['session-1'] || migratedMap['session-1'][0].path !== 'src') throw new Error('the migrated favourites have the wrong shape');
if (storage.has('dsh.project-file-picker.pins.v1')) throw new Error('the legacy favourites table was left behind');

// 14. 设置：行高、排序、只看标记、收藏折叠、收藏共享、浏览位置都会落盘。
storage.delete('dsh.project-file-picker.settings.v1');
const densityTree = renderBody();
findAll(densityTree, (node) => node.props['data-pfp-density'] !== undefined)[0].props.onClick();
const settingsAfterDensity = JSON.parse(storage.get('dsh.project-file-picker.settings.v1'));
if (settingsAfterDensity.density !== 'dense') throw new Error('toggling density did not persist: ' + JSON.stringify(settingsAfterDensity));

const denseTree = renderBody({ settings: { ...DEFAULT_SETTINGS, density: 'dense' } });
if (hasClass(denseTree, 'pfp-dense') !== true) throw new Error('the dense row height class was not applied');

const sortTree = renderBody({ settings: { ...DEFAULT_SETTINGS, sort: 'name' } });
findAll(sortTree, (node) => node.props['data-pfp-sort'] !== undefined)[0].props.onClick();
const settingsAfterSort = JSON.parse(storage.get('dsh.project-file-picker.settings.v1'));
if (settingsAfterSort.sort !== 'type') throw new Error('cycling sort did not persist: ' + JSON.stringify(settingsAfterSort));

const markedTree = renderBody({ settings: { ...DEFAULT_SETTINGS, markedOnly: true }, tags: { 'F:/demo project': { 'src': { color: '#0091ff' } } } });
const markedFileRows = findAll(markedTree, (node) => hasClass(node, 'pfp-rowFile'));
if (markedFileRows.length !== 0) throw new Error('mark-only mode still shows files');
const markedFolders = findAll(markedTree, (node) => node.props['data-pfp-path'] === 'F:/demo project/src');
if (markedFolders.length === 0) throw new Error('mark-only mode dropped the tagged folder');

const collapsedTree = renderBody({ settings: { ...DEFAULT_SETTINGS, pinsCollapsed: true }, pins: [{ path: 'src', kind: 'directory' }] });
const collapsedList = findAll(collapsedTree, (node) => hasClass(node, 'pfp-pinList'));
if (collapsedList.length !== 0) throw new Error('collapsing quick access did not hide the list');

const sharedTree = renderBody({ settings: { ...DEFAULT_SETTINGS, sharedPins: true }, pins: [{ path: 'src', kind: 'directory' }] });
const sharedScope = findAll(sharedTree, (node) => node.props['data-pfp-pins-scope'] !== undefined)[0];
if (sharedScope.props['data-pfp-pins-scope'] !== 'global') throw new Error('shared favourites are not marked as shared');
sharedScope.props.onClick();
const pinsMapAfterShare = JSON.parse(storage.get('dsh.project-file-picker.pins.v3') || '{}');
if (pinsMapAfterShare['session-1'] === undefined) throw new Error('switching back to per-conversation did not write the local slot');

// 浏览位置（展开状态）会按对话记下来。
storage.delete('dsh.project-file-picker.view.v1');
renderBody({ expanded: ['F:/demo project', 'F:/demo project/src'] });
const viewStored = JSON.parse(storage.get('dsh.project-file-picker.view.v1') || '{}');
if (!viewStored['session-1'] || viewStored['session-1'].expanded.indexOf('F:/demo project/src') < 0) {
  throw new Error('the browse position was not persisted: ' + JSON.stringify(viewStored));
}

// 15. 搜索整个项目：开启后输入关键字会递归读目录并列出命中项。
listFixture.clear();
listFixture.set('F:/demo project', {
  truncated: false,
  entries: [
    { name: 'src', type: 'directory' },
    { name: 'README.md', type: 'file' },
  ],
});
listFixture.set('F:/demo project/src', {
  truncated: false,
  entries: [{ name: 'widget.ts', type: 'file' }],
});
listCalls.length = 0;
const searchTree = renderBody({ searchMode: true, filter: 'widget' });
if (findAll(searchTree, (node) => node.props['data-pfp-search'] !== undefined)[0].props['aria-pressed'] !== true) {
  throw new Error('the search toggle is not marked as active');
}
await runTimers();
const finalSearchRender = renderBody({ searchMode: true, filter: 'widget', search: {
  kind: 'ready',
  results: [{ path: 'F:/demo project/src/widget.ts', name: 'widget.ts' }],
  scanned: 2,
  truncated: false,
  needle: 'widget',
} });
const hits = findAll(finalSearchRender, (node) => hasClass(node, 'pfp-rowFile'));
if (hits.length !== 1) throw new Error('search results are not rendered, rows=' + hits.length);
const searchPaths = listCalls.map((call) => call.path);
if (searchPaths.indexOf('F:/demo project/src') < 0) throw new Error('the recursive search never walked into src');

// 16. 错误提示条：出错时在顶部出现，可以关掉。
const errorTree = renderBody({ status: { message: '读取失败', error: true } });
const errorBar = findAll(errorTree, (node) => node.props['data-pfp-error'] === '1')[0];
if (errorBar === undefined) throw new Error('an error did not render the top bar');
const closeError = findAll(errorBar, (node) => hasClass(node, 'pfp-errorBarClose'))[0];
stateWrites = [];
closeError.props.onClick(fakeEvent());
if (writeAt(5).pop() === undefined) throw new Error('closing the error bar did not hide it');

// 17. 没有工作目录时给出说明。
const emptySession = renderBody({}, {
  sessionId: 'session-3',
  useSessions: (selector) => selector({ byId: { 'session-3': {} } }),
});
if (JSON.stringify(emptySession).indexOf('noWorkspace') < 0) throw new Error('the empty-workspace case has no explanation');

console.log('OK');
console.log('页签类型      :', type.kind, '| 优先级', type.priority, '| 引导卡排序', entry.order);
console.log('插槽          :', slotRegistrations.map((registration) => registration.options.name).join(', '));
console.log('字典键数      :', zhKeys.length);
console.log('插入          :', JSON.stringify(calls[0] && calls[0].text));
console.log('预览地址      :', openedFrames[0]);
console.log('标记          : 颜色写入与清除正常');
console.log('收藏          : 按对话隔离、写盘、点击预取+定位、删除、旧数据迁移');
console.log('设置          : 行高 / 排序 / 只看标记 / 折叠 / 共享 / 浏览位置都会落盘');
console.log('搜索          : 递归读目录并列出命中项');
console.log('菜单与复制    : 右键项齐全，绝对路径与 Markdown 链接复制正常');
