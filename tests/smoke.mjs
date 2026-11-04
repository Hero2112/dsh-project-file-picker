// project-file-picker 客户端模块的功能冒烟测试。
// 用桩对象模拟 Harness 全局，检查右栏页签注册、引导卡、页签正文的目录树、
// 插入引用、打开预览、文件夹标记、一次性自动展开，以及按对话隔离的固定项。
// 全程不渲染真实界面、也不碰 DOM。
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(process.argv[2], 'utf8');

const slotRegistrations = [];
const typeRegistrations = [];
let dictionaries = null;
const effects = [];
const timers = [];
const openTabCalls = [];
let stateQueue = [];
let stateWrites = [];
let stateIndex = 0;

const reactStub = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  Fragment: 'Fragment',
  useState: (initial) => {
    const index = stateIndex;
    stateIndex += 1;
    const value = stateQueue.length > 0
      ? stateQueue.shift()
      : typeof initial === 'function' ? initial() : initial;
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
const windowStub = {
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1200,
  innerHeight: 800,
  __ModuleLoader__: {
    load(definition) {
      windowStub.definition = definition;
    },
  },
};

const remote = {
  workspaceFiles: {
    list: async () => ({ ok: true, value: { entries: [], truncated: false } }),
  },
};

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
        openTabCalls.push({ kind, options });
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
const required = ['slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'remote', 'remote.workspaceFiles'];
if (!Array.isArray(plugin.inject)) throw new Error('factory returned no inject array');
for (const service of required) if (plugin.inject.indexOf(service) < 0) throw new Error('inject is missing ' + service);

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
const opened = [];
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
  openResource: (address) => opened.push(address),
};
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
      { name: 'a b.txt', type: 'file' },
      { name: 'src', type: 'directory' },
      { name: 'socket', type: 'other' },
    ],
  },
};

function renderBody(states, overrides) {
  stateQueue = states.slice();
  stateIndex = 0;
  stateWrites = [];
  effects.length = 0;
  let tree = bodyRegistration.component(overrides === undefined ? bodyProps : { ...bodyProps, ...overrides });
  if (tree !== null && typeof tree.type === 'function') tree = tree.type(tree.props);
  const expanded = deepExpand(tree);
  for (const effect of effects.splice(0)) {
    const cleanup = effect();
    if (typeof cleanup === 'function') cleanup();
  }
  return expanded;
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
const fakeEvent = () => ({ stopPropagation: () => {}, currentTarget: { getBoundingClientRect: () => ({ left: 300, top: 120, bottom: 144 }) } });

// 4. 首屏渲染：从目录树插入、拖拽、打开预览。
const first = renderBody([['F:/demo project'], levelsFixture, '', null, false, {}, null]);
if (first.props['data-project-files-root'] !== 'F:/demo project') throw new Error('the body did not use the session cwd');

const fileRows = findAll(first, (node) => hasClass(node, 'pfp-rowFile'));
if (fileRows.length !== 1) throw new Error('expected one file row, got ' + fileRows.length);
const fileMain = findAll(fileRows[0], (node) => hasClass(node, 'pfp-rowMain'))[0];
if (fileMain === undefined) throw new Error('the file row has no clickable main area');
if (fileMain.props.draggable !== true) throw new Error('the file row is not draggable');
if (JSON.stringify(fileMain.children).indexOf('a b.txt') < 0) throw new Error('the file row does not show the file name');

fileMain.props.onClick();
if (calls.length !== 1 || calls[0].action !== 'insertText') throw new Error('clicking a file did not insert');
if (calls[0].text !== ' @"a b.txt" ') throw new Error('unexpected inserted text: ' + JSON.stringify(calls[0].text));
const fileMention = calls[0].text;

const drop = { effectAllowed: '', values: {}, setData: (kind, value) => { drop.values[kind] = value; } };
fileMain.props.onDragStart({ dataTransfer: drop });
if (drop.values['text/plain'] !== '@"a b.txt" ') throw new Error('drag data is not a mention: ' + JSON.stringify(drop.values['text/plain']));
if (drop.values['application/x-dsh-project-file'] !== 'F:/demo project/a b.txt') throw new Error('drag data lost the absolute path');

const viewButton = findAll(fileRows[0], (node) => node.type === 'button' && node.props.title === 'view')[0];
if (viewButton === undefined) throw new Error('the file row has no preview button');
viewButton.props.onClick(fakeEvent());
if (opened.length !== 1) throw new Error('the preview button did not open a resource');
if (opened[0] !== 'dsh-resource://file/session/session-1/a%20b.txt') {
  throw new Error('unexpected file address: ' + opened[0]);
}

const dirRows = findAll(first, (node) => hasClass(node, 'pfp-rowMain') && node.props['aria-expanded'] === false);
if (dirRows.length !== 1) throw new Error('expected one directory row, got ' + dirRows.length);
if (dirRows[0].props.draggable !== true) throw new Error('the directory row is not draggable');
dirRows[0].props.onClick();
const otherRow = findAll(first, (node) => hasClass(node, 'pfp-rowOther'))[0];
if (otherRow === undefined) throw new Error('an unknown entry kind was not shown as a plain row');

// 文件夹插入的是带尾斜杠的目录引用。
const folderInsert = findAll(first, (node) => node.type === 'button' && node.props['data-pfp-insert-dir'] === '1')[0];
if (folderInsert === undefined) throw new Error('the folder row has no insert button');
if (folderInsert.props.title !== 'insertDir') throw new Error('the folder insert button has no label');
folderInsert.props.onClick(fakeEvent());
if (calls.length !== 2 || calls[1].action !== 'insertText') throw new Error('the folder insert did not reach the editor');
if (calls[1].text !== ' @src/ ') throw new Error('unexpected folder mention: ' + JSON.stringify(calls[1].text));

const folderDrop = { effectAllowed: '', values: {}, setData: (kind, value) => { folderDrop.values[kind] = value; } };
dirRows[0].props.onDragStart({ dataTransfer: folderDrop });
if (folderDrop.values['text/plain'] !== '@src/ ') throw new Error('dragged folder is not a directory mention: ' + JSON.stringify(folderDrop.values['text/plain']));
if (folderDrop.values['application/x-dsh-project-directory'] !== 'F:/demo project/src') {
  throw new Error('dragged folder lost its absolute path');
}

// 路径里带空格的文件夹用带引号的闭合写法。
calls.length = 0;
const spacedLevels = {
  'F:/demo project': { kind: 'ready', truncated: false, entries: [{ name: 'my dir', type: 'directory' }] },
};
const spaced = renderBody([['F:/demo project'], spacedLevels, '', null, false, {}, null]);
const spacedInsert = findAll(spaced, (node) => node.type === 'button' && node.props['data-pfp-insert-dir'] === '1')[0];
if (spacedInsert === undefined) throw new Error('the spaced folder row has no insert button');
spacedInsert.props.onClick(fakeEvent());
if (calls[0] === undefined || calls[0].text !== ' @"my dir/" ') {
  throw new Error('unexpected spaced folder mention: ' + JSON.stringify(calls[0] && calls[0].text));
}

// 5. 被标记的文件夹会渲染出颜色和 emoji，标记面板负责写回数据。
storage.set('dsh.project-file-picker.tags.v1', JSON.stringify({
  'F:/demo project': { src: { color: '#e5484d', emoji: '🔥' } },
}));
const menuState = 'F:/demo project/src';
const renderTagged = () => {
  const currentTags = JSON.parse(storage.get('dsh.project-file-picker.tags.v1') || '{}');
  return renderBody([['F:/demo project'], levelsFixture, '', null, false, currentTags, menuState]);
};

const tagged = renderTagged();
const emoji = findAll(tagged, (node) => hasClass(node, 'pfp-emoji'))[0];
if (emoji === undefined || emoji.children[0] !== '🔥') throw new Error('the folder emoji tag was not rendered');
const tinted = findAll(tagged, (node) => node.type === 'svg' && node.props.style !== undefined && node.props.style.color === '#e5484d');
if (tinted.length === 0) throw new Error('the folder colour tag did not tint the folder glyph');

const menu = findAll(tagged, (node) => hasClass(node, 'pfp-tagEditor'))[0];
if (menu === undefined) throw new Error('the inline tag editor was not rendered');
if (menu.props['data-pfp-tag-editor'] !== '1') throw new Error('the tag editor lost its identity attribute');

const swatch = findAll(menu, (node) => hasClass(node, 'pfp-swatch') && node.props.style.background === '#0091ff')[0];
if (swatch === undefined) throw new Error('the tag menu has no colour swatches');
swatch.props.onClick();
const afterColor = JSON.parse(storage.get('dsh.project-file-picker.tags.v1'));
if (afterColor['F:/demo project'].src.color !== '#0091ff') throw new Error('the colour tag was not persisted: ' + JSON.stringify(afterColor));
if (afterColor['F:/demo project'].src.emoji !== '🔥') throw new Error('setting a colour dropped the emoji: ' + JSON.stringify(afterColor));

const afterColorMenu = findAll(renderTagged(), (node) => hasClass(node, 'pfp-tagEditor'))[0];
const emojiButton = findAll(afterColorMenu, (node) => hasClass(node, 'pfp-emojiBtn') && node.children[0] === '🎯')[0];
if (emojiButton === undefined) throw new Error('the tag menu has no emoji choices');
emojiButton.props.onClick();
const afterEmoji = JSON.parse(storage.get('dsh.project-file-picker.tags.v1'));
if (afterEmoji['F:/demo project'].src.emoji !== '🎯') throw new Error('the emoji tag was not persisted: ' + JSON.stringify(afterEmoji));
if (afterEmoji['F:/demo project'].src.color !== '#0091ff') throw new Error('setting an emoji dropped the colour: ' + JSON.stringify(afterEmoji));

const afterEmojiMenu = findAll(renderTagged(), (node) => hasClass(node, 'pfp-tagEditor'))[0];
const clearButton = findAll(afterEmojiMenu, (node) => node.type === 'button' && node.children[0] === 'tag.clear')[0];
if (clearButton === undefined) throw new Error('the tag menu has no clear button');
clearButton.props.onClick();
const afterClear = JSON.parse(storage.get('dsh.project-file-picker.tags.v1'));
if (afterClear['F:/demo project'] !== undefined) throw new Error('clearing the tags left a record: ' + JSON.stringify(afterClear));

const tagButton = findAll(tagged, (node) => node.type === 'button' && node.props['data-pfp-tag'] === '1')[0];
if (tagButton === undefined) throw new Error('the folder row has no tag button');
tagButton.props.onClick(fakeEvent());

// 预览打不开时必须报错提示，而不是抛异常。
const throwing = renderBody([['F:/demo project'], levelsFixture, '', null, false, {}, null]);
const throwingView = findAll(throwing, (node) => node.type === 'button' && node.props.title === 'view')[0];
const originalOpen = tabActions.openResource;
tabActions.openResource = () => {
  throw new Error('preview unavailable');
};
try {
  throwingView.props.onClick(fakeEvent());
} finally {
  tabActions.openResource = originalOpen;
}

// 6. 页签标题显示捕获到的名字。
const chip = titleRegistration.component({ useTabInfo: tabInfo });
if (chip === null) throw new Error('the chip title rendered nothing');
if (JSON.stringify(chip).indexOf('项目文件') < 0) throw new Error('the chip title does not show the tab label');

// 7. 首次运行只自动展开页签一次，之后不再展开。
if (timers.length !== 1) throw new Error('expected one reveal timer, got ' + timers.length);
timers[0]();
if (openTabCalls.length !== 1 || openTabCalls[0].kind !== 'project-files') throw new Error('the reveal did not open the tab');
if (storage.get('dsh.project-file-picker.seeded') !== '1') throw new Error('the reveal was not recorded');

timers.length = 0;
plugin.apply(makeContext());
if (timers.length !== 0) throw new Error('the reveal repeats after it already happened');

// 8. 没有工作目录时给出说明，而不是渲染目录树。
stateQueue = [[], {}, '', null, false, {}, null];
const noRoot = bodyRegistration.component({
  ...bodyProps,
  useSessions: (selector) => selector({ byId: { 'session-1': {} } }),
});
const noRootTree = noRoot !== null && typeof noRoot.type === 'function' ? noRoot.type(noRoot.props) : noRoot;
if (JSON.stringify(noRootTree).indexOf('noWorkspace') < 0) throw new Error('a missing workspace root was not explained');

// 9. 固定项按对话隔离：固定区照常渲染、点图钉写盘（只写当前会话这一格）、
//    点固定的文件插入引用、点固定的深目录展开整条祖先链、× 删掉后不留空记录，
//    并且另一个对话看不到这一套。
const PINS = 'dsh.project-file-picker.pins.v3';
const LEGACY_PINS = 'dsh.project-file-picker.pins.v1';
const pinsMap = () => {
  const raw = storage.get(PINS);
  return raw === undefined ? {} : JSON.parse(raw);
};
const sessionPins = (session = 'session-1') => {
  const stored = pinsMap()[session];
  return Array.isArray(stored) ? stored : [];
};
const pinRows = (tree) => findAll(tree, (node) => node.props['data-pfp-pin-open'] !== undefined);
const pinButtons = (tree) => findAll(tree, (node) => node.type === 'button' && node.props['data-pfp-pin'] === '1');

storage.delete(PINS);
storage.delete(LEGACY_PINS);
const emptyPins = renderBody([['F:/demo project'], levelsFixture, '', null, false, {}, null, []]);
const emptySection = findAll(emptyPins, (node) => hasClass(node, 'pfp-pins'))[0];
if (emptySection === undefined) throw new Error('the pins section is missing');
if (JSON.stringify(emptySection).indexOf('pin.empty') < 0) throw new Error('an empty pins section has no hint');
if (pinRows(emptyPins).length !== 0) throw new Error('an empty pins section rendered rows');

// 行上的图钉按钮存的是相对路径 + 类型，只写到当前这个会话那一格。
calls.length = 0;
const rowPins = pinButtons(emptyPins);
if (rowPins.length !== 2) throw new Error('expected a pin button on the file and the folder row, got ' + rowPins.length);
if (rowPins[0].props['aria-pressed'] !== false) throw new Error('an unpinned row claims to be pinned');
rowPins[0].props.onClick(fakeEvent());
let pinnedNow = sessionPins();
if (pinnedNow.length !== 1) throw new Error('pinning a file did not persist: ' + JSON.stringify(pinsMap()));
if (pinnedNow[0].path !== 'src' || pinnedNow[0].kind !== 'directory') throw new Error('the first row is the folder, so the pin should be a directory: ' + JSON.stringify(pinnedNow));
if (Object.keys(pinsMap()).length !== 1) throw new Error('a pin wrote entries for more than one conversation: ' + JSON.stringify(pinsMap()));
// 真实界面里每次点击都会重渲染、状态跟着更新，所以这里也重新渲染一次再点第二个按钮。
const secondPass = renderBody([['F:/demo project'], levelsFixture, '', null, false, {}, null, sessionPins()]);
pinButtons(secondPass)[1].props.onClick(fakeEvent());
pinnedNow = sessionPins();
if (pinnedNow.length !== 2) throw new Error('pinning a second row did not persist: ' + JSON.stringify(pinsMap()));
if (pinnedNow[0].path !== 'a b.txt' || pinnedNow[0].kind !== 'file') throw new Error('the newest pin should come first: ' + JSON.stringify(pinnedNow));
if (pinnedNow[1].path !== 'src') throw new Error('the older pin was lost: ' + JSON.stringify(pinnedNow));

// 目录树里的行本身也要显示固定态。
const pinnedTree = renderBody([['F:/demo project'], levelsFixture, '', null, false, {}, null, sessionPins()]);
const pressed = pinButtons(pinnedTree).filter((node) => node.props['aria-pressed'] === true);
if (pressed.length !== 2) throw new Error('the pinned rows were not marked as pinned, pressed=' + pressed.length);
if (pressed[0].props.title !== 'pin.unpin') throw new Error('a pinned row still offers "pin" instead of "unpin"');
if (pinRows(pinnedTree).length !== 2) throw new Error('the pins section did not list both entries');

// 固定的文件点一下就直接插进输入框。
calls.length = 0;
const pinnedFile = findAll(pinnedTree, (node) => node.props['data-pfp-pin-open'] === 'a b.txt')[0];
if (pinnedFile === undefined) throw new Error('a pinned file has no row in the pins section');
pinnedFile.props.onClick();
if (calls.length !== 1 || calls[0].text !== ' @"a b.txt" ') throw new Error('a pinned file did not insert its mention: ' + JSON.stringify(calls));

// 另一个对话——哪怕工作目录一样——也是另一套空表。
const sessionsBoth = (selector) => selector({ byId: {
  'session-1': { cwd: 'F:\\demo project' },
  'session-2': { cwd: 'F:\\demo project' },
} });
const otherConversation = renderBody(
  [['F:/demo project'], levelsFixture, '', null, false, {}, null, []],
  { sessionId: 'session-2', useSessions: sessionsBoth },
);
if (pinRows(otherConversation).length !== 0) throw new Error('pins leaked into another conversation');
const otherEmpty = findAll(otherConversation, (node) => hasClass(node, 'pfp-pins'))[0];
if (JSON.stringify(otherEmpty).indexOf('pin.empty') < 0) throw new Error('the other conversation does not start with an empty pins section');

// 在那边固定只留在那边，不影响第一个对话。
const otherPinButtons = pinButtons(otherConversation);
otherPinButtons[0].props.onClick(fakeEvent());
if (sessionPins('session-2').length !== 1) throw new Error('a pin in the second conversation was not stored: ' + JSON.stringify(pinsMap()));
if (sessionPins('session-1').length !== 2) throw new Error('pinning in one conversation changed another: ' + JSON.stringify(pinsMap()));

// 固定的深目录会把整条祖先链一次性展开，所以树是开在那一层的。
storage.set(PINS, JSON.stringify({ ...pinsMap(), 'session-1': [{ path: 'src/components/widgets', kind: 'directory' }] }));
const stackedLevels = {
  'F:/demo project': { kind: 'ready', truncated: false, entries: [{ name: 'src', type: 'directory' }] },
  'F:/demo project/src': { kind: 'ready', truncated: false, entries: [{ name: 'components', type: 'directory' }] },
  'F:/demo project/src/components': { kind: 'ready', truncated: false, entries: [{ name: 'widgets', type: 'directory' }] },
};
const deepPins = renderBody([['F:/demo project'], stackedLevels, '', null, false, {}, null, sessionPins()]);
const expandWrite = stateWrites.filter((write) => write.index === 0).pop();
if (expandWrite === undefined) throw new Error('a pinned deep folder expanded nothing');
const expandedAfter = typeof expandWrite.value === 'function' ? expandWrite.value([]) : expandWrite.value;
for (const wanted of ['F:/demo project', 'F:/demo project/src', 'F:/demo project/src/components', 'F:/demo project/src/components/widgets']) {
  if (expandedAfter.indexOf(wanted) < 0) throw new Error('the pinned folder did not expand ' + wanted + ': ' + JSON.stringify(expandedAfter));
}

// 点固定的目录会请求把那一行滚进可见区域。
stateWrites = [];
calls.length = 0;
const deepPinRow = findAll(deepPins, (node) => node.props['data-pfp-pin-open'] === 'src/components/widgets')[0];
if (deepPinRow === undefined) throw new Error('the deep pinned folder has no row');
deepPinRow.props.onClick();
const revealWrite = stateWrites.filter((write) => write.index === 8).pop();
if (revealWrite === undefined || revealWrite.value === null) throw new Error('clicking a pinned folder did not ask to reveal it');
if (revealWrite.value.path !== 'F:/demo project/src/components/widgets') throw new Error('the reveal target is wrong: ' + JSON.stringify(revealWrite.value));
if (calls.length > 0) throw new Error('clicking a pinned folder inserted text instead of opening it');

// 固定区的 × 删掉一条；删到最后一条时不留空记录。
const removable = renderBody([['F:/demo project'], stackedLevels, '', null, false, {}, null, [
  { path: 'src', kind: 'directory' },
  { path: 'src/components', kind: 'directory' },
]]);
const removeButtons = findAll(removable, (node) => node.props['data-pfp-pin-remove'] !== undefined);
if (removeButtons.length !== 2) throw new Error('expected a remove button per pinned row, got ' + removeButtons.length);
removeButtons[0].props.onClick(fakeEvent());
if (sessionPins().length !== 1) throw new Error('removing one pin kept too many: ' + JSON.stringify(pinsMap()));
const removableAgain = renderBody([['F:/demo project'], stackedLevels, '', null, false, {}, null, sessionPins()]);
const lastRemove = findAll(removableAgain, (node) => node.props['data-pfp-pin-remove'] !== undefined);
if (lastRemove.length !== 1) throw new Error('the pins section did not shrink after a removal, rows=' + lastRemove.length);
lastRemove[0].props.onClick(fakeEvent());
if (pinsMap()['session-1'] !== undefined) throw new Error('removing the last pin left a record: ' + JSON.stringify(pinsMap()));
if (sessionPins('session-2').length !== 1) throw new Error('removing a pin in one conversation touched another: ' + JSON.stringify(pinsMap()));

// 重新挂载会从存储里读回这个对话的固定项。
storage.set(PINS, JSON.stringify({ 'session-1': [{ path: 'src/components', kind: 'directory' }] }));
const reloaded = renderBody([['F:/demo project'], levelsFixture, '', null, false, {}, null]);
const reloadedRows = pinRows(reloaded);
if (reloadedRows.length !== 1) throw new Error('pins were not restored from storage, rows=' + reloadedRows.length);
if (JSON.stringify(reloadedRows[0]).indexOf('components') < 0) throw new Error('the restored pin lost its name');
const reloadedPath = findAll(reloaded, (node) => hasClass(node, 'pfp-pinPath'))[0];
if (reloadedPath === undefined || reloadedPath.children[0] !== 'src/components') throw new Error('the restored pin lost its full relative path');

// 旧的按工作目录分组的固定表，归给第一个打开它的对话。
storage.delete(PINS);
storage.set(LEGACY_PINS, JSON.stringify({ 'F:/demo project': [{ path: 'src', kind: 'directory' }], 'D:/other': [{ path: 'x', kind: 'file' }] }));
const migrated = renderBody([['F:/demo project'], levelsFixture, '', null, false, {}, null]);
const migratedRows = pinRows(migrated);
if (migratedRows.length !== 1) throw new Error('the legacy pins were not migrated, rows=' + migratedRows.length);
if (sessionPins().length !== 1 || sessionPins()[0].path !== 'src') throw new Error('the migrated pin has the wrong shape: ' + JSON.stringify(pinsMap()));
const legacyLeft = JSON.parse(storage.get(LEGACY_PINS));
if (legacyLeft['F:/demo project'] !== undefined) throw new Error('the migrated workspace was left in the legacy table');
if (legacyLeft['D:/other'] === undefined) throw new Error('migration dropped another workspace from the legacy table');
if (sessionPins('session-2').length !== 0) throw new Error('the migration leaked into another conversation: ' + JSON.stringify(pinsMap()));

console.log('OK');
console.log('页签类型      :', type.kind, '| 优先级', type.priority, '| 引导卡排序', entry.order);
console.log('插槽          :', slotRegistrations.map((registration) => registration.options.name).join(', '));
console.log('字典键数      :', zhKeys.length);
console.log('insert        :', JSON.stringify(fileMention));
console.log('预览地址      :', opened[0]);
console.log('标记          : 颜色 + emoji 写入与清除都正常');
console.log('固定项        : 按对话隔离、写盘、深目录展开、定位、删除、旧数据迁移');
console.log('自动展开      :', JSON.stringify(openTabCalls[0].kind));
