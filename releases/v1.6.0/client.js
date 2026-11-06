window.__ModuleLoader__.load({
  id: '@local/project-file-picker',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState } = React;

    /** 本插件独占的文案命名空间。 */
    const NS = 'projectFilePicker';
    /** 本实现在页签系统里的身份，也是页签主体注册时用的 key。 */
    const TAB_ID = '@local/project-file-picker';
    /** 本插件拥有的页面类型。 */
    const TAB_KIND = 'project-files';
    /** 记录「首次自动展开」已经在本 profile 上做过。 */
    const SEED_KEY = 'dsh.project-file-picker.seeded';
    /** 文件夹标记按 profile 存：一张以工作目录为根键的 JSON 表。 */
    const TAGS_KEY = 'dsh.project-file-picker.tags.v1';
    /**
     * 固定的文件 / 文件夹：**按对话（会话）各存一套**，互不相关。
     * 一条记录是 `{ path, kind }`，path 相对该对话的工作目录。
     */
    const PINS_KEY = 'dsh.project-file-picker.pins.v3';
    /** 早期版本按工作目录分组的旧表，首次读取时归到当前对话。 */
    const LEGACY_PINS_KEY = 'dsh.project-file-picker.pins.v1';
    /** 「所有对话共用收藏」这个模式下的收藏存放格。 */
    const SHARED_PINS_SLOT = '*';
    /** 面板设置（行高、排序、收藏是否共享…），整个 profile 一份。 */
    const SETTINGS_KEY = 'dsh.project-file-picker.settings.v1';
    /** 每个对话的浏览位置（展开到哪、滚到哪），按会话存。 */
    const VIEW_KEY = 'dsh.project-file-picker.view.v1';
    /** 每个对话的「最近使用」记录。 */
    const RECENT_KEY = 'dsh.project-file-picker.recent.v1';
    /** 所有文件地址共用的协议与类型前缀。 */
    const FILE_ADDRESS_PREFIX = 'dsh-resource://file/';
    /** 递归搜索时直接跳过的目录名：基本都是产物或依赖，扫进去只会变慢。 */
    const SEARCH_SKIP = [
      'node_modules', '.git', '.svn', '.hg', 'dist', 'build', '.next', '.nuxt', 'out',
      '.cache', '.venv', 'venv', '__pycache__', 'target', 'obj', 'bin', '.idea', '.vs',
      'coverage', '.turbo', '.parcel-cache',
    ];
    /** 递归搜索的上限，防止在超大仓库里把界面拖死。 */
    const SEARCH_LIMITS = { dirs: 400, results: 300, depth: 8, concurrent: 4 };
    /** 面板内预览一次最多读多少行 / 字节。 */
    const PREVIEW_LIMITS = { lines: 400 };

    /** 标记面板给出的文件夹颜色。 */
    const COLORS = [
      { id: 'red', value: '#e5484d' },
      { id: 'orange', value: '#f76b15' },
      { id: 'yellow', value: '#e2a336' },
      { id: 'green', value: '#30a46c' },
      { id: 'teal', value: '#12a594' },
      { id: 'blue', value: '#0091ff' },
      { id: 'purple', value: '#8e4ec6' },
      { id: 'gray', value: '#8b8d98' },
    ];

    /** 标记面板给出的文件夹表情。 */
    const EMOJIS = ['🔥', '⭐', '❗', '✅', '📌', '🧪', '📦', '🎯', '🚧', '💡', '🧩', '📚', '🎨', '⚙️', '🛠️', '🧠'];

    const zh = {
      'type.label': '项目文件坞',
      'guide.title': '项目文件坞',
      'guide.description': '浏览项目文件，拖进对话框或点击插入；可预览内容、给文件夹上色',
      'hint.drag': '双击文件插入引用，双击文件夹插入目录；也可以直接拖进输入框',
      'hint.dragging': '松开鼠标，放进输入框',
      noWorkspace: '这个会话还没有工作目录',
      loading: '正在读取…',
      empty: '空目录',
      truncated: '条目太多，只显示了一部分',
      'noMatch': '没有匹配的文件',
      reload: '重新读取',
      filter: '筛选已加载的文件…',
      'search.whole': '搜索整个项目',
      'search.hint': '输入关键字，搜索整个项目…',
      'search.searching': '搜索中… 已扫 {dirs} 个目录',
      'search.done': '找到 {n} 个结果（扫了 {dirs} 个目录）',
      'search.none': '没有找到匹配的文件',
      'search.limit': '到上限了，结果可能不全',
      'search.stop': '停止搜索',
      'sort.name': '按名称排序',
      'sort.type': '按类型排序',
      'sort.size': '按大小排序',
      'sort.state': '排序方式：{mode}',
      'sort.name.short': '名称',
      'sort.type.short': '类型',
      'sort.size.short': '大小',
      'marked.only': '只看有标记的文件夹',
      'marked.all': '显示全部',
      'density.compact': '切到紧凑行高',
      'density.cozy': '切到舒适行高',
      'selected.n': '已选 {n} 项',
      'selected.insert': '插入引用',
      'selected.inserted': '已插入 {n} 个引用',
      'selected.clear': '取消选择',
      'menu.insert': '插入引用',
      'menu.insertDir': '插入此文件夹',
      'menu.view': '查看内容（预览页签）',
      'menu.inline': '在面板里预览',
      'menu.pin': '收藏',
      'menu.unpin': '取消收藏',
      'menu.copyRel': '复制相对路径',
      'menu.copyAbs': '复制绝对路径',
      'menu.copyMd': '复制 Markdown 链接',
      'menu.reveal': '在文件管理器中显示',
      'menu.obsidian': '在 Obsidian 中打开',
      'menu.tag': '标记颜色和表情',
      'copied': '已复制{what}',
      'copyFailed': '复制失败',
      'revealFailed': '打不开文件管理器',
      'revealed': '已在文件管理器中显示',
      'obsidian.requested': '已请求在 Obsidian 中打开 {name}',
      'obsidian.blocked': '浏览器拦住了 obsidian:// 协议，看下地址栏右侧的提示并允许一次',
      'obsidian.failed': '发不出 obsidian:// 请求，确认本机装了 Obsidian',
      'obsidian.vaultHint': '已打开 vault {vault}（Obsidian 不支持定位到子文件夹）',
      'preview.title': '预览',
      'preview.loading': '正在读取…',
      'preview.truncated': '只显示前 {n} 行',
      'preview.openTab': '用预览页签打开',
      'preview.close': '关闭预览',
      'preview.failed': '读不了这个文件',
      'preview.binary': '这是二进制文件，请用预览页签打开',
      'preview.lines': '{n} 行',
      'recent.section': '最近',
      'recent.empty': '还没有最近用过的位置',
      'recent.clear': '清空最近',
      'pins.collapse': '收起快速访问',
      'pins.expand': '展开快速访问',
      'pins.more': '更多收藏操作',
      'pins.scopeLocal': '只属于本对话（点一下改成所有对话共用）',
      'pins.scopeGlobal': '所有对话共用（点一下改成只属于本对话）',
      'pins.scopeShortLocal': '本对话',
      'pins.scopeShortGlobal': '共用',
      'pins.export': '导出收藏',
      'pins.import': '导入收藏',
      'pins.imported': '已导入 {n} 条收藏',
      'pins.importFailed': '导入失败',
      'pins.exported': '已导出收藏',
      'pins.moved': '收藏顺序已更新',
      'pins.sharedOn': '收藏已改成所有对话共用',
      'pins.sharedOff': '收藏已改成只属于本对话',
      inserted: '已插入 {name}',
      insertedFolder: '已插入文件夹 {name}',
      insertDir: '插入此文件夹',
      insertFailed: '无法插入到输入框',
      count: '已加载 {n} 个文件',
      view: '查看内容',
      'view.opened': '已打开 {name} 的预览',
      viewFailed: '打不开这个文件的预览',
      'tag.button': '标记颜色和表情',
      'tag.color': '颜色',
      'tag.emoji': '表情',
      'tag.clear': '清除标记',
      'tag.close': '关闭',
      'pin.button': '收藏此位置',
      'pin.unpin': '取消收藏',
      'pin.section': '快速访问',
      'pin.pinned': '已收藏 {name}',
      'pin.unpinned': '已取消收藏 {name}',
      'pin.jumped': '已跳转到 {name}',
      'pin.locating': '正在跳转到 {name}…',
      'pin.empty': '还没有收藏。点目录 / 文件行上的图钉收藏，之后点一下就跳过去',
      'pin.localOnly': '收藏只属于当前这个对话，换个对话是另一套',
      'pin.jumpHint': '点一下：展开并跳到这个目录',
      'error.notFound': '目录已不存在',
      'error.outsideWorkspace': '目录在工作区之外',
      'error.notDirectory': '这不是一个目录',
      'error.unavailable': '读取失败：{message}',
      'error.unknown': '读取失败',
    };

    const en = {
      'type.label': 'Project file dock',
      'guide.title': 'Project file dock',
      'guide.description': 'Browse project files, drag or click to insert; preview content and tag folders',
      'hint.drag': 'Double-click a file to insert it, a folder to insert the directory; dragging works too',
      'hint.dragging': 'Release to drop it into the message',
      noWorkspace: 'This session has no workspace directory',
      loading: 'Reading…',
      empty: 'Empty directory',
      truncated: 'Too many entries, only some are shown',
      'noMatch': 'No matching files',
      reload: 'Reload',
      filter: 'Filter the loaded files…',
      'search.whole': 'Search the whole project',
      'search.hint': 'Type to search the whole project…',
      'search.searching': 'Searching… {dirs} folders scanned',
      'search.done': '{n} results ({dirs} folders scanned)',
      'search.none': 'No matching files',
      'search.limit': 'Hit the limit; results may be incomplete',
      'search.stop': 'Stop searching',
      'sort.name': 'Sort by name',
      'sort.type': 'Sort by type',
      'sort.size': 'Sort by size',
      'sort.state': 'Sorted by {mode}',
      'sort.name.short': 'name',
      'sort.type.short': 'type',
      'sort.size.short': 'size',
      'marked.only': 'Only folders with a tag',
      'marked.all': 'Show everything',
      'density.compact': 'Switch to compact rows',
      'density.cozy': 'Switch to comfortable rows',
      'selected.n': '{n} selected',
      'selected.insert': 'Insert references',
      'selected.clear': 'Clear selection',
      'menu.insert': 'Insert reference',
      'menu.insertDir': 'Insert this folder',
      'menu.view': 'Open in a preview tab',
      'menu.inline': 'Preview inside this panel',
      'menu.pin': 'Add to favourites',
      'menu.unpin': 'Remove from favourites',
      'menu.copyRel': 'Copy relative path',
      'menu.copyAbs': 'Copy absolute path',
      'menu.copyMd': 'Copy as Markdown link',
      'menu.reveal': 'Show in file manager',
      'menu.obsidian': 'Open in Obsidian',
      'menu.tag': 'Colour and emoji',
      'copied': 'Copied {what}',
      'copyFailed': 'Copy failed',
      'revealFailed': 'Could not open the file manager',
      'obsidian.requested': 'Asked Obsidian to open {name}',
      'obsidian.blocked': 'The browser blocked obsidian:// — allow it once from the address bar prompt',
      'obsidian.failed': 'Could not send the obsidian:// request; check that Obsidian is installed',
      'obsidian.vaultHint': 'Opened vault {vault} (Obsidian cannot focus a sub-folder)',
      'preview.title': 'Preview',
      'preview.loading': 'Reading…',
      'preview.truncated': 'Only the first {n} lines are shown',
      'preview.openTab': 'Open in a preview tab',
      'preview.close': 'Close preview',
      'preview.failed': 'Could not read this file',
      'preview.binary': 'This is a binary file — use a preview tab',
      'preview.lines': '{n} lines',
      'recent.section': 'Recent',
      'recent.empty': 'Nothing used yet',
      'recent.clear': 'Clear recent',
      'pins.collapse': 'Collapse quick access',
      'pins.expand': 'Expand quick access',
      'pins.more': 'More favourite actions',
      'pins.scopeLocal': 'This conversation only (click to share with all conversations)',
      'pins.scopeGlobal': 'Shared with all conversations (click to use per conversation)',
      'pins.scopeShortLocal': 'This one',
      'pins.scopeShortGlobal': 'Shared',
      'pins.export': 'Export favourites',
      'pins.import': 'Import favourites',
      'pins.imported': 'Imported {n} favourites',
      'pins.importFailed': 'Import failed',
      'pins.exported': 'Favourites exported',
      'pins.moved': 'Favourite order updated',
      'pins.sharedOn': 'Favourites are now shared with all conversations',
      'pins.sharedOff': 'Favourites are now this conversation only',
      'selected.inserted': 'Inserted {n} references',
      revealed: 'Shown in the file manager',
      inserted: 'Inserted {name}',
      insertedFolder: 'Inserted folder {name}',
      insertDir: 'Insert this folder',
      insertFailed: 'Could not insert into the message',
      count: '{n} files loaded',
      view: 'View content',
      'view.opened': 'Opened the preview of {name}',
      viewFailed: 'Could not open the preview for this file',
      'tag.button': 'Colour and emoji',
      'tag.color': 'Colour',
      'tag.emoji': 'Emoji',
      'tag.clear': 'Clear tags',
      'tag.close': 'Close',
      'pin.button': 'Favourite this location',
      'pin.unpin': 'Remove from favourites',
      'pin.section': 'Quick access',
      'pin.pinned': 'Added {name} to favourites',
      'pin.unpinned': 'Removed {name} from favourites',
      'pin.jumped': 'Jumped to {name}',
      'pin.locating': 'Jumping to {name}…',
      'pin.empty': 'No favourites yet — press the pin on a folder or file row to add one',
      'pin.localOnly': 'Favourites belong to this conversation only; other conversations have their own',
      'pin.jumpHint': 'Click to expand this folder and jump to it',
      'error.notFound': 'That directory is gone',
      'error.outsideWorkspace': 'That directory is outside the workspace',
      'error.notDirectory': 'That is not a directory',
      'error.unavailable': 'Read failed: {message}',
      'error.unknown': 'Read failed',
    };

    const CSS = [
      '.pfp-root{box-sizing:border-box;height:100%;min-height:0;color:var(--dsw-alias-label-primary);font-size:var(--dsh-content-font-size-secondary,13px);line-height:1.5;display:flex;flex-direction:column;flex:auto}',
      '.pfp-header{box-sizing:border-box;border-bottom:.5px solid var(--dsw-alias-border-l3);flex:none;align-items:center;gap:4px;height:38px;padding:0 6px 0 16px;display:flex}',
      '.pfp-path{min-width:0;flex:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);direction:rtl;text-align:left;margin-right:8px}',
      '.pfp-tool{width:28px;height:28px;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:6px;line-height:1;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:var(--dsw-radius-sm,6px);cursor:pointer}',
      '.pfp-tool svg{width:15px;height:15px}',
      '.pfp-tool:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}',
      '.pfp-tool:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.pfp-filterRow{flex:none;padding:8px 10px 4px 16px}',
      '.pfp-filter{box-sizing:border-box;width:100%;height:26px;padding:0 8px;font:inherit;font-size:12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,6px);outline:none}',
      '.pfp-filter::placeholder{color:var(--dsw-alias-label-tertiary)}',
      '.pfp-filter:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.pfp-body{scrollbar-gutter:stable;flex:auto;min-height:0;margin-right:2px;padding:4px 4px 8px 8px;overflow:auto}',
      '.pfp-body::-webkit-scrollbar-track{margin:2px}',
      '.pfp-level{list-style:none;margin:0;padding:0}',
      '.pfp-level .pfp-level{padding-left:16px}',
      '.pfp-item{margin:0;padding:0}',
      '.pfp-row{display:flex;align-items:center;gap:2px;min-width:0;border-radius:var(--dsw-radius-md,6px)}',
      '.pfp-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.pfp-rowMain{flex:1;min-width:0;display:flex;align-items:center;gap:6px;padding:5px 4px 5px 10px;font:inherit;text-align:left;color:inherit;background:none;border:0;border-radius:inherit;cursor:pointer}',
      '.pfp-rowMain:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.pfp-rowFile .pfp-rowMain{cursor:grab}',
      '.pfp-rowFile .pfp-rowMain:active{cursor:grabbing}',
      '.pfp-rowAction{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-right:4px;padding:0;line-height:1;color:var(--dsw-alias-label-tertiary);background:none;border:0;border-radius:var(--dsw-radius-sm,6px);cursor:pointer;opacity:0}',
      '.pfp-row:hover .pfp-rowAction{opacity:1}',
      '.pfp-rowAction:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.pfp-rowAction:focus-visible{opacity:1;outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.pfp-rowOther{color:var(--dsw-alias-label-tertiary);cursor:default;padding:5px 10px}',
      '.pfp-rowOther:hover{background:none}',
      '.pfp-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pfp-emoji{flex:none;font-size:12px;line-height:1}',
      '.pfp-icon{flex:none;color:var(--dsw-alias-label-tertiary)}',
      '.pfp-chevron{flex:none;width:12px;height:12px;color:var(--dsw-alias-label-tertiary);transition:transform .12s ease}',
      '.pfp-chevron-open{transform:rotate(90deg)}',
      '.pfp-note{margin:0;padding:3px 10px;color:var(--dsw-alias-label-tertiary);font-size:12px}',
      '.pfp-note-error{color:var(--dsw-alias-state-error-primary)}',
      '.pfp-status{display:flex;flex-direction:column;padding:14px 16px}',
      '.pfp-statusLine{margin:0;color:var(--dsw-alias-label-secondary);font-size:var(--dsh-content-font-size-secondary,13px);line-height:1.6}',
      '.pfp-foot{flex:none;display:flex;align-items:center;gap:8px;border-top:.5px solid var(--dsw-alias-border-l3);padding:5px 16px;min-height:27px;color:var(--dsw-alias-label-tertiary);font-size:12px}',
      '.pfp-footMsg{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pfp-footMsg-error{color:var(--dsw-alias-state-error-primary)}',
      '.pfp-tagEditor{margin:2px 0 6px;padding:8px 10px 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.4}',
      '.pfp-menuPath{color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px}',
      '.pfp-menuLabel{color:var(--dsw-alias-label-secondary);margin:4px 0 4px}',
      '.pfp-swatches{display:flex;flex-wrap:wrap;gap:6px}',
      '.pfp-swatch{width:22px;height:22px;padding:0;border-radius:50%;border:2px solid transparent;cursor:pointer}',
      '.pfp-swatch-active{border-color:var(--dsw-alias-label-primary);box-shadow:0 0 0 1px var(--dsw-alias-bg-overlay,#fff) inset}',
      '.pfp-emojis{display:flex;flex-wrap:wrap;gap:2px}',
      '.pfp-emojiBtn{width:26px;height:26px;padding:0;line-height:1;font-size:15px;background:none;border:1px solid transparent;border-radius:6px;cursor:pointer}',
      '.pfp-emojiBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.pfp-emojiBtn-active{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.pfp-menuFoot{display:flex;justify-content:flex-end;gap:6px;margin-top:10px}',
      '.pfp-menuBtn{height:24px;padding:0 8px;font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);background:none;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;cursor:pointer}',
      '.pfp-menuBtn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}',
      '.pfp-menuBtn-primary{color:var(--dsw-alias-label-primary);border-color:transparent;background:var(--dsw-alias-bg-layer-2)}',
      '.pfp-pins{flex:none;border-bottom:.5px solid var(--dsw-alias-border-l3);padding:6px 10px 5px 16px}',
      '.pfp-pinsHead{display:flex;align-items:center;gap:4px;color:var(--dsw-alias-label-tertiary);font-size:11px;margin-bottom:3px}',
      '.pfp-pinsHead svg{width:12px;height:12px}',
      '.pfp-pinList{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:1px;max-height:138px;overflow:auto}',
      '.pfp-pinItem{display:flex;align-items:center;min-width:0;border-radius:var(--dsw-radius-md,6px)}',
      '.pfp-pinItem:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.pfp-pinMain{flex:1;min-width:0;display:flex;align-items:center;gap:5px;padding:3px 4px 3px 6px;font:inherit;text-align:left;color:inherit;background:none;border:0;border-radius:inherit;cursor:pointer}',
      '.pfp-pinMain:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.pfp-pinName{flex:none;max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}',
      '.pfp-pinPath{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:rtl;text-align:left;font-size:11px;color:var(--dsw-alias-label-tertiary)}',
      '.pfp-pinRemove{flex:none;width:20px;height:20px;margin-right:2px;padding:0;line-height:1;font-size:13px;color:var(--dsw-alias-label-tertiary);background:none;border:0;border-radius:var(--dsw-radius-sm,6px);cursor:pointer;opacity:.5}',
      '.pfp-pinItem:hover .pfp-pinRemove{opacity:1}',
      '.pfp-pinItem:hover .pfp-pinPath{color:var(--dsw-alias-label-secondary)}',
      '.pfp-pinRemove:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.pfp-rowHit{animation:pfp-hit 1.2s ease-out}',
      '@keyframes pfp-hit{0%{background:var(--dsw-alias-brand-primary-soft,rgba(0,102,255,.22))}60%{background:var(--dsw-alias-brand-primary-soft,rgba(0,102,255,.14))}100%{background:transparent}}',
      '.pfp-rowAction-on{opacity:1;color:var(--dsw-alias-brand-primary)}',
      '.pfp-titleIcon{flex:none;color:var(--dsw-alias-label-tertiary)}',
      '.pfp-filterRow{display:flex;flex:none;align-items:center;gap:4px;padding:8px 6px 4px 16px}',
      '.pfp-filterRow .pfp-filter{flex:auto;min-width:0}',
      '.pfp-iconBtn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;line-height:1;color:var(--dsw-alias-label-tertiary);background:none;border:1px solid transparent;border-radius:var(--dsw-radius-sm,6px);cursor:pointer}',
      '.pfp-iconBtn svg{width:14px;height:14px}',
      '.pfp-iconBtn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}',
      '.pfp-iconBtn-on{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.pfp-item{content-visibility:auto;contain-intrinsic-size:auto 26px}',
      '.pfp-level{position:relative}',
      '.pfp-level .pfp-level:before{content:"";position:absolute;left:4px;top:1px;bottom:1px;width:1px;background:var(--dsw-alias-border-l3)}',
      '.pfp-level>.pfp-item:nth-child(even)>.pfp-row{background:rgba(127,127,127,.045)}',
      '.pfp-rowSelected,.pfp-level>.pfp-item:nth-child(even)>.pfp-rowSelected{background:var(--dsw-alias-brand-primary-soft,rgba(0,102,255,.16))}',
      '.pfp-rowSelected:hover{background:var(--dsw-alias-brand-primary-soft,rgba(0,102,255,.22))}',
      '.pfp-size{flex:none;font-size:10px;color:var(--dsw-alias-label-tertiary);opacity:.85}',
      '.pfp-extBadge{flex:none;font-size:9px;line-height:1.3;letter-spacing:.02em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);opacity:.7;padding:0 3px;border-radius:3px;background:var(--dsw-alias-bg-layer-2)}',
      '.pfp-dense .pfp-rowMain{padding-top:1px;padding-bottom:1px;gap:4px}',
      '.pfp-dense .pfp-name{font-size:12px}',
      '.pfp-dense .pfp-item{contain-intrinsic-size:auto 22px}',
      '.pfp-dense .pfp-level .pfp-level{padding-left:12px}',
      '.pfp-skeleton{padding:6px 10px}',
      '.pfp-skeletonRow{height:10px;margin:9px 0;border-radius:4px;background:linear-gradient(90deg,rgba(127,127,127,.10) 0%,rgba(127,127,127,.20) 40%,rgba(127,127,127,.10) 80%);background-size:200% 100%;animation:pfp-shimmer 1.1s linear infinite}',
      '@keyframes pfp-shimmer{0%{background-position:120% 0}100%{background-position:-40% 0}}',
      '.pfp-errorBar{display:flex;flex:none;align-items:flex-start;gap:8px;margin:6px 10px 4px 16px;padding:6px 8px;border-radius:6px;background:var(--dsw-alias-state-error-primary-subtle,rgba(229,72,77,.14));color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:1.45}',
      '.pfp-errorBarText{flex:auto;min-width:0;word-break:break-word}',
      '.pfp-errorBarClose{flex:none;width:18px;height:18px;padding:0;line-height:1;font-size:13px;color:inherit;background:none;border:0;border-radius:4px;cursor:pointer;opacity:.8}',
      '.pfp-errorBarClose:hover{opacity:1;background:rgba(127,127,127,.18)}',
      '.pfp-menu{position:fixed;z-index:60;min-width:196px;padding:4px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay,#fff);box-shadow:0 8px 24px rgba(0,0,0,.18);font-size:12px}',
      '.pfp-menuItem{display:flex;align-items:center;gap:6px;width:100%;padding:5px 8px;font:inherit;text-align:left;color:var(--dsw-alias-label-primary);background:none;border:0;border-radius:5px;cursor:pointer}',
      '.pfp-menuItem:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.pfp-menuItem-path{flex:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:11px}',
      '.pfp-menuSep{height:1px;margin:4px 6px;background:var(--dsw-alias-border-l3)}',
      '.pfp-preview{display:flex;flex:none;flex-direction:column;max-height:42%;min-height:80px;border-top:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1)}',
      '.pfp-previewHead{display:flex;flex:none;align-items:center;gap:6px;padding:4px 8px 4px 16px;font-size:11px;color:var(--dsw-alias-label-tertiary)}',
      '.pfp-previewName{flex:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary)}',
      '.pfp-previewBody{flex:auto;min-height:0;margin:0;padding:4px 10px 8px 16px;overflow:auto;font-family:var(--dsh-font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary)}',
      '.pfp-previewNote{padding:8px 16px;color:var(--dsw-alias-label-tertiary);font-size:12px}',
      '.pfp-pinsActions{display:flex;flex:none;align-items:center;gap:2px;margin-left:auto}' ,
      '.pfp-pinsActions .pfp-iconBtn{width:20px;height:20px}',
      '.pfp-pinsActions .pfp-iconBtn svg{width:12px;height:12px}',
      '.pfp-pinScope{flex:none;font-size:10px;padding:0 4px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);cursor:pointer;border:0}',
      '.pfp-pinScope:hover{color:var(--dsw-alias-label-primary)}',
      '.pfp-pinItem-dragging{opacity:.45}',
      '.pfp-pinItem-drop{border-top:2px solid var(--dsw-alias-brand-primary)}',
      '.pfp-pinGrip{flex:none;width:12px;color:var(--dsw-alias-label-tertiary);cursor:grab;opacity:.5}',
      '.pfp-section{margin-top:2px}',
      '.pfp-sectionHead{display:flex;align-items:center;gap:4px;padding:2px 8px 2px 4px;color:var(--dsw-alias-label-tertiary);font-size:11px}',
      '.pfp-sectionHead svg{width:12px;height:12px}',
      '.pfp-sectionHead .pfp-iconBtn{margin-left:auto;width:18px;height:18px}',
      '.pfp-selbar{display:flex;flex:none;align-items:center;gap:6px;padding:4px 10px;border-top:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1);font-size:12px}',
      '.pfp-selbarText{flex:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary)}',
    ].join('');

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

    /** 当前语言对应的字典，由 apply() 保持最新。 */
    let activeDictionary = en;

    function interpolate(text, params) {
      if (params === undefined || params === null) return text;
      return String(text).replace(/\{(\w+)\}/g, (match, key) => (
        params[key] === undefined ? match : String(params[key])
      ));
    }

    /** 兜底翻译：插槽会传 t，这里覆盖不经过插槽的渲染路径。 */
    function translate(key, params) {
      const text = activeDictionary[key];
      return interpolate(text === undefined ? key : text, params);
    }

    function posixOf(path) {
      return String(path).replace(/\\/g, '/');
    }

    function joinPath(parent, name) {
      return posixOf(parent).replace(/\/+$/, '') + '/' + name;
    }

    function relativeTo(root, path) {
      const base = posixOf(root === undefined || root === null ? '' : root).replace(/\/+$/, '');
      const full = posixOf(path);
      if (base === '') return full;
      if (full === base) return '';
      if (full.indexOf(base + '/') === 0) return full.slice(base.length + 1);
      return full;
    }

    /**
     * 按输入框的 @path 语法渲染路径：普通路径写成 @path 形式，
     * 含空格的路径写成带引号的 @"..." 形式。
     * 语法表示不了的路径返回 undefined。
     */
    function formatMention(root, path) {
      const posix = relativeTo(root, path);
      if (posix === '') return undefined;
      if (/[\u0000-\u001f\u007f-\u009f"]/u.test(posix)) return undefined;
      return /\s/u.test(posix) ? '@"' + posix + '" ' : '@' + posix + ' ';
    }

    /**
     * 用同一套语法渲染目录：末尾的斜杠表示这是目录；
     * 路径里有空格时，斜杠留在引号内。
     */
    function formatFolderMention(root, path) {
      const posix = relativeTo(root, path).replace(/\/+$/, '');
      if (posix === '') return undefined;
      const target = posix + '/';
      if (/[\u0000-\u001f\u007f-\u009f"]/u.test(target)) return undefined;
      return /\s/u.test(target) ? '@"' + target + '" ' : '@' + target + ' ';
    }

    /**
     * 目录排序：文件夹永远在前，其余按模式排。
     * - name：名称（自然排序）
     * - type：扩展名分组
     * - size：从大到小（拿不到大小的排后面）
     */
    function sortEntries(entries, mode) {
      const list = entries.slice();
      const directoryFirst = (left, right) => Number(right.type === 'directory') - Number(left.type === 'directory');
      if (mode === 'type') {
        list.sort((left, right) => {
          const group = directoryFirst(left, right);
          if (group !== 0) return group;
          const leftExt = fileKindOf(left.name).ext;
          const rightExt = fileKindOf(right.name).ext;
          if (leftExt === rightExt) return collator.compare(left.name, right.name);
          return collator.compare(leftExt, rightExt);
        });
        return list;
      }
      if (mode === 'size') {
        list.sort((left, right) => {
          const group = directoryFirst(left, right);
          if (group !== 0) return group;
          const leftSize = typeof left.size === 'number' ? left.size : -1;
          const rightSize = typeof right.size === 'number' ? right.size : -1;
          if (leftSize === rightSize) return collator.compare(left.name, right.name);
          return rightSize - leftSize;
        });
        return list;
      }
      list.sort((left, right) => {
        const group = directoryFirst(left, right);
        return group !== 0 ? group : collator.compare(left.name, right.name);
      });
      return list;
    }

    /** Component-encode one id or path segment, keeping `:` literal for drive letters. */
    function encodeSegment(segment) {
      return encodeURIComponent(segment).replace(/%3A/gi, ':');
    }

    /** Encode a `/`-separated path segment by segment. */
    function encodePath(path) {
      return path.split('/').map(encodeSegment).join('/');
    }

    /**
     * 产品自带预览页认领的地址形式：
     * dsh-resource://file/session/<sessionId>/<path>；
     * 只要文件在会话根目录内，就用工作目录相对路径。
     */
    function fileAddressFor(sessionId, root, path) {
      const full = posixOf(path);
      const base = posixOf(root === undefined || root === null ? '' : root).replace(/\/+$/, '');
      let relative = full;
      if (base !== '' && full === base) relative = '';
      else if (base !== '' && full.indexOf(base + '/') === 0) relative = full.slice(base.length + 1);
      return FILE_ADDRESS_PREFIX + 'session/' + encodeSegment(String(sessionId)) + '/' + encodePath(relative);
    }

    /** 读取整张标记表；存储损坏或不存在时按空表处理。 */
    function readTags() {
      try {
        const raw = window.localStorage.getItem(TAGS_KEY);
        if (raw === null || raw === undefined || raw === '') return {};
        const parsed = JSON.parse(raw);
        return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    /** 写回整张标记表；存储被禁用时只是丢了持久化。 */
    function writeTags(tags) {
      try {
        window.localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
      } catch (error) {
        /* 忽略 */
      }
    }

    /** 把一条固定记录收拾成标准形状；缺字段的返回 undefined。 */
    function normalizePin(item) {
      if (item === null || typeof item !== 'object') return undefined;
      if (typeof item.path !== 'string' || item.path === '') return undefined;
      return {
        path: posixOf(item.path).replace(/^\/+/, ''),
        kind: item.kind === 'directory' ? 'directory' : 'file',
      };
    }

    /**
     * 读取某个对话的固定项。
     *
     * 固定项**跟着对话走**：A 对话固定的文件夹只出现在 A 对话里，
     * B 对话是另一套，互不相关。存的是相对该对话工作目录的路径。
     *
     * v3 不存在时，把早期按工作目录分组的旧表里属于当前工作目录的那些
     * 归到当前对话（只归一次，归完就删旧键），免得旧数据直接丢掉。
     */
    function readSessionPins(sessionId, root) {
      const key = String(sessionId === undefined || sessionId === null ? '' : sessionId);
      const readMap = () => {
        try {
          const raw = window.localStorage.getItem(PINS_KEY);
          if (raw === null || raw === undefined || raw === '') return {};
          const parsed = JSON.parse(raw);
          if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
          return parsed;
        } catch (error) {
          return {};
        }
      };

      const map = readMap();
      const list = [];
      const seen = new Set();
      const push = (pin) => {
        if (pin === undefined) return;
        if (seen.has(pin.path)) return;
        seen.add(pin.path);
        list.push(pin);
      };
      const stored = map[key];
      if (Array.isArray(stored)) {
        for (const item of stored) push(normalizePin(item));
        return list;
      }

      // 当前对话还没有自己的表：看看旧表里有没有属于这个工作目录的固定项。
      try {
        const legacyRaw = window.localStorage.getItem(LEGACY_PINS_KEY);
        if (legacyRaw !== null && legacyRaw !== undefined && legacyRaw !== '') {
          const parsed = JSON.parse(legacyRaw);
          const base = root === undefined || root === null ? '' : posixOf(root).replace(/\/+$/, '');
          if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) && base !== '') {
            const items = parsed[base];
            if (Array.isArray(items)) {
              for (const item of items) push(normalizePin(item));
            }
            if (items !== undefined) {
              delete parsed[base];
              try {
                if (Object.keys(parsed).length === 0) window.localStorage.removeItem(LEGACY_PINS_KEY);
                else window.localStorage.setItem(LEGACY_PINS_KEY, JSON.stringify(parsed));
              } catch (error) {
                /* 清不掉旧键也不影响使用 */
              }
            }
          }
        }
      } catch (error) {
        /* 旧表坏了：当空表 */
      }
      if (list.length > 0) {
        const next = Object.assign({}, map);
        next[key] = list;
        writeSessionPins(next);
      }
      return list;
    }

    /** 写回整张固定表（按对话分组的表）；存储被禁用时只是丢了持久化。 */
    function writeSessionPins(map) {
      try {
        window.localStorage.setItem(PINS_KEY, JSON.stringify(map));
      } catch (error) {
        /* 忽略 */
      }
    }

    /** 把一份收藏写进指定格子，别的格子原样保留。 */
    function writePinsToSlot(slot, list) {
      let map = {};
      try {
        const raw = window.localStorage.getItem(PINS_KEY);
        const parsed = raw === null || raw === undefined || raw === '' ? {} : JSON.parse(raw);
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) map = parsed;
      } catch (error) {
        map = {};
      }
      if (Array.isArray(list) && list.length > 0) map[slot] = list;
      else delete map[slot];
      writeSessionPins(map);
    }

    /** 远程调用统一回 `{ ok, value }` 信封；这里统一拆成值或 undefined。 */
    function unpackRemote(result) {
      if (result === undefined || result === null) return undefined;
      if (result.ok === true) return result.value;
      if (result.ok === false) return undefined;
      return result;
    }

    /** 两条固定记录是否是同一个位置。 */
    function samePin(left, right) {
      return left.path === right.path;
    }

    /** 固定项的稳定标识：同时用于 React key 和测试里的 data 属性。 */
    function pinKey(pin) {
      return pin.path;
    }

    /** 面板默认设置。 */
    const DEFAULT_SETTINGS = {
      density: 'cozy',
      pinsCollapsed: false,
      sharedPins: false,
      sort: 'name',
      markedOnly: false,
      recentCollapsed: false,
    };

    /** 读一个 JSON 对象；坏数据或存储被禁用时返回空对象。 */
    function readJsonObject(key) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null || raw === undefined || raw === '') return {};
        const parsed = JSON.parse(raw);
        return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    /** 写一个 JSON 对象；存储被禁用时只是丢了持久化。 */
    function writeJsonObject(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        /* 忽略 */
      }
    }

    /** 读取面板设置，缺的项用默认值补齐。 */
    function readSettings() {
      const stored = readJsonObject(SETTINGS_KEY);
      const merged = {};
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        merged[key] = stored[key] === undefined ? DEFAULT_SETTINGS[key] : stored[key];
      }
      return merged;
    }

    /** 每个对话一份的浏览位置（展开到哪、滚到哪）。 */
    function readViewState(slot, root) {
      const stored = readJsonObject(VIEW_KEY)[slot];
      if (stored === null || stored === undefined || typeof stored !== 'object') return undefined;
      const expanded = Array.isArray(stored.expanded) ? stored.expanded.filter((item) => typeof item === 'string') : [];
      const scrollTop = typeof stored.scrollTop === 'number' ? stored.scrollTop : 0;
      if (expanded.length === 0) return undefined;
      // 换过工作目录的旧位置没有意义。
      const base = root === undefined || root === null ? '' : posixOf(root).replace(/\/+$/, '');
      if (base !== '' && expanded.every((item) => String(item).indexOf(base) !== 0)) return undefined;
      return { expanded: expanded, scrollTop: scrollTop };
    }

    function writeViewState(slot, value) {
      const map = readJsonObject(VIEW_KEY);
      map[slot] = value;
      writeJsonObject(VIEW_KEY, map);
    }

    /** 读取某个对话的「最近使用」列表。 */
    function readRecent(slot) {
      const stored = readJsonObject(RECENT_KEY)[slot];
      if (!Array.isArray(stored)) return [];
      const list = [];
      const seen = new Set();
      for (const item of stored) {
        const pin = normalizePin(item);
        if (pin === undefined) continue;
        if (seen.has(pin.path)) continue;
        seen.add(pin.path);
        list.push(pin);
      }
      return list.slice(0, 12);
    }

    function writeRecent(slot, list) {
      const map = readJsonObject(RECENT_KEY);
      map[slot] = list.slice(0, 12);
      writeJsonObject(RECENT_KEY, map);
    }

    /** 文件类型分组：只用来给图标上色和显示小徽标。 */
    const FILE_KINDS = [
      { id: 'md', color: '#8e4ec6', exts: ['md', 'markdown', 'mdx', 'txt', 'rst', 'adoc', 'log'] },
      {
        id: 'code',
        color: '#0091ff',
        exts: [
          'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'py', 'go', 'rs', 'java', 'kt', 'c', 'h', 'cc',
          'cpp', 'hpp', 'cs', 'rb', 'php', 'swift', 'lua', 'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd',
          'html', 'htm', 'css', 'scss', 'less', 'vue', 'svelte', 'json', 'jsonc', 'yaml', 'yml',
          'toml', 'ini', 'conf', 'env', 'xml', 'sql', 'graphql', 'gql', 'dart', 'r', 'scala',
        ],
      },
      { id: 'image', color: '#12a594', exts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'] },
      { id: 'pdf', color: '#e5484d', exts: ['pdf'] },
      { id: 'archive', color: '#e2a336', exts: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zst'] },
      { id: 'data', color: '#30a46c', exts: ['csv', 'tsv', 'xls', 'xlsx', 'parquet', 'db', 'sqlite', 'sqlite3'] },
      { id: 'doc', color: '#f76b15', exts: ['doc', 'docx', 'ppt', 'pptx', 'odt', 'odp', 'rtf', 'epub'] },
    ];

    /** 某个文件名属于哪一类（用于图标染色、徽标、预览判断）。 */
    function fileKindOf(name) {
      const base = posixOf(name === undefined || name === null ? '' : name).split('/').pop();
      const dot = base.lastIndexOf('.');
      const ext = dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
      for (const kind of FILE_KINDS) {
        if (kind.exts.indexOf(ext) >= 0) return { id: kind.id, color: kind.color, ext: ext };
      }
      return { id: 'other', color: undefined, ext: ext };
    }

    /** 把字节数变成人看的单位。 */
    function formatSize(bytes) {
      if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) return undefined;
      if (bytes < 1024) return bytes + ' B';
      const units = ['KB', 'MB', 'GB', 'TB'];
      let value = bytes / 1024;
      let index = 0;
      while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
      }
      return (value >= 10 ? Math.round(value) : value.toFixed(1)) + ' ' + units[index];
    }

    /** 相对路径转 Markdown 链接；带空格的用尖括号包起来。 */
    function markdownLinkFor(label, relative) {
      const path = posixOf(relative);
      return '[' + label + '](' + (/\s/u.test(path) ? '<' + path + '>' : path) + ')';
    }

    /** 复制文本：优先用剪贴板 API，不行再退回临时 textarea。 */
    async function copyText(text) {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard !== undefined
          && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (error) {
        /* 落到下面的兜底 */
      }
      try {
        if (typeof document !== 'undefined' && document.body !== undefined) {
          const area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          const ok = document.execCommand('copy');
          area.remove();
          return ok === true;
        }
      } catch (error) {
        /* 放弃 */
      }
      return false;
    }

    /** 把 JSON 存成文件下载下来；环境不支持时返回 false。 */
    function downloadJson(fileName, data) {
      try {
        if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return false;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch (error) {
            /* 忽略 */
          }
        }, 4000);
        return true;
      } catch (error) {
        return false;
      }
    }

    /**
     * 递归搜索整个工作目录：按层广度优先，每层并发几个目录，
     * 跳过 node_modules / dist 这类目录，并给目录数、深度、结果数设上限。
     * 每一波结束回报一次进度，方便界面显示「已扫多少个目录」。
     */
    async function searchProject(list, sessionId, root, needle, signal, onProgress) {
      const lower = needle.trim().toLowerCase();
      const results = [];
      let scanned = 0;
      let truncated = false;
      if (lower === '') return { results: results, scanned: scanned, truncated: truncated };

      let wave = [{ path: posixOf(root), depth: 0 }];
      while (wave.length > 0 && !signal.aborted) {
        const next = [];
        for (let start = 0; start < wave.length; start += SEARCH_LIMITS.concurrent) {
          if (signal.aborted) break;
          const chunk = wave.slice(start, start + SEARCH_LIMITS.concurrent);
          const listings = await Promise.all(chunk.map(async (item) => {
            if (scanned >= SEARCH_LIMITS.dirs) {
              truncated = true;
              return undefined;
            }
            scanned += 1;
            try {
              const result = await list(sessionId, item.path, signal);
              return result !== undefined && result !== null && result.ok === true
                ? { item: item, value: result.value || {} }
                : undefined;
            } catch (error) {
              return undefined;
            }
          }));

          for (const listing of listings) {
            if (listing === undefined) continue;
            const entries = Array.isArray(listing.value.entries) ? listing.value.entries : [];
            for (const entry of entries) {
              const childPath = joinPath(listing.item.path, entry.name);
              if (entry.type === 'directory') {
                if (listing.item.depth + 1 > SEARCH_LIMITS.depth) continue;
                if (SEARCH_SKIP.indexOf(String(entry.name).toLowerCase()) >= 0) continue;
                next.push({ path: childPath, depth: listing.item.depth + 1 });
              } else if (entry.type === 'file') {
                if (relativeTo(root, childPath).toLowerCase().indexOf(lower) < 0) continue;
                if (results.length >= SEARCH_LIMITS.results) {
                  truncated = true;
                  continue;
                }
                results.push({
                  path: childPath,
                  name: entry.name,
                  size: typeof entry.size === 'number' ? entry.size : undefined,
                });
              }
            }
          }
          if (onProgress !== undefined) onProgress({ scanned: scanned, results: results.length });
        }
        wave = next;
      }

      results.sort((left, right) => collator.compare(left.path, right.path));
      return { results: results, scanned: scanned, truncated: truncated };
    }

    /**
     * 从工作目录到某个路径的整条祖先链（含两端）。
     * 固定一个深目录后，靠它把沿途每一层都展开。
     */
    function ancestorChain(root, path) {
      const base = posixOf(root === undefined || root === null ? '' : root).replace(/\/+$/, '');
      const relative = relativeTo(base, path);
      const chain = [base];
      if (relative === '') return chain;
      let current = base;
      for (const part of relative.split('/')) {
        if (part === '') continue;
        current = joinPath(current, part);
        chain.push(current);
      }
      return chain;
    }

    /** 页签图标 / 引导卡插图：文件夹向下落进输入框。 */
    function TabGlyph(props) {
      const size = props !== undefined && props.size !== undefined ? props.size : 22;
      return h('svg', {
        viewBox: '0 0 24 24', width: size, height: size, fill: 'none', 'aria-hidden': true,
        className: props !== undefined ? props.className : undefined,
      }, [
        h('path', {
          key: 'folder',
          d: 'M3.2 5.1c0-.7.6-1.3 1.3-1.3h4.1l1.6 2h8.4c.7 0 1.3.6 1.3 1.3v4.2c0 .7-.6 1.3-1.3 1.3H4.5c-.7 0-1.3-.6-1.3-1.3z',
          stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round',
        }),
        h('path', {
          key: 'arrow',
          d: 'M12 13.5v3M9.9 14.6 12 16.6l2.1-2',
          stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
        }),
        h('path', {
          key: 'composer',
          d: 'M4.4 17.4h15.2a1.8 1.8 0 0 1 1.8 1.8v1.6a1.8 1.8 0 0 1-1.8 1.8H4.4a1.8 1.8 0 0 1-1.8-1.8v-1.6a1.8 1.8 0 0 1 1.8-1.8z',
          stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round',
        }),
      ]);
    }

    /** 文件夹图标；color 是标记里的颜色，用来给图标染色。 */
    function FolderGlyph(props) {
      const size = props !== undefined && props.size !== undefined ? props.size : 15;
      const color = props !== undefined && props.color !== undefined ? props.color : undefined;
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': true,
        className: 'pfp-icon',
        style: color === undefined ? undefined : { color: color },
      }, h('path', {
        d: 'M1.6 3.5c0-.5.4-.9.9-.9h3.3l1.3 1.5h6.4c.5 0 .9.4.9.9v7.2c0 .5-.4.9-.9.9H2.5c-.5 0-.9-.4-.9-.9z',
        fill: 'currentColor', opacity: 0.75,
      }));
    }

    /** 文件图标；color 是按扩展名分类后给的颜色。 */
    function FileGlyph(props) {
      const size = props !== undefined && props.size !== undefined ? props.size : 15;
      const color = props !== undefined && props.color !== undefined ? props.color : undefined;
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': true,
        className: 'pfp-icon',
        style: color === undefined ? undefined : { color: color },
      }, [
        h('path', {
          key: 'sheet',
          d: 'M3.6 1.6h5.6l3.2 3.2v9.6H3.6z',
          fill: 'currentColor', opacity: 0.35,
        }),
        h('path', {
          key: 'fold',
          d: 'M9.2 1.6v3.2h3.2',
          stroke: 'currentColor', strokeWidth: 1.1, fill: 'none', opacity: 0.7,
        }),
      ]);
    }

    function ChevronGlyph(props) {
      const open = props !== undefined && props.open === true;
      return h('svg', {
        viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': true,
        className: open ? 'pfp-chevron pfp-chevron-open' : 'pfp-chevron',
      }, h('path', {
        d: 'M4.2 2.4 8.1 6 4.2 9.6', fill: 'none', stroke: 'currentColor',
        strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
      }));
    }

    function ReloadGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': true }, h('path', {
        d: 'M13.1 8a5.1 5.1 0 1 1-1.6-3.7',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round',
      }), h('path', {
        d: 'M12.9 1.9v2.9h-2.9',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
      }));
    }

    /** 文件行上的「查看内容」按钮图标。 */
    function EyeGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true }, [
        h('path', {
          key: 'eye',
          d: 'M1.4 8S3.7 3.8 8 3.8 14.6 8 14.6 8 12.3 12.2 8 12.2 1.4 8 1.4 8Z',
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round',
        }),
        h('circle', { key: 'pupil', cx: 8, cy: 8, r: 1.9, fill: 'currentColor' }),
      ]);
    }

    /** 文件夹行上的「插入此文件夹」按钮图标：一个指向输入框的箭头。 */
    function InsertGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true }, [
        h('path', {
          key: 'tray',
          d: 'M2.6 9.4v1.9c0 .8.6 1.4 1.4 1.4h8c.8 0 1.4-.6 1.4-1.4V9.4',
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round',
        }),
        h('path', {
          key: 'arrow',
          d: 'M8 10.4V3.2M5.2 6 8 3.2 10.8 6',
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.3,
          strokeLinecap: 'round', strokeLinejoin: 'round',
        }),
      ]);
    }

    /** 文件夹行上的「标记」按钮图标。 */
    function PaletteGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true }, [
        h('path', {
          key: 'body',
          d: 'M8 1.8a6.2 6.2 0 0 0 0 12.4c1.1 0 1.6-.7 1.6-1.5 0-.9-.7-1.3-.7-2 0-.6.5-1.1 1.2-1.1h1.2c1.3 0 2.3-1 2.3-2.3C13.6 4.2 11.1 1.8 8 1.8Z',
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round',
        }),
        h('circle', { key: 'a', cx: 5.6, cy: 6.2, r: 1, fill: 'currentColor' }),
        h('circle', { key: 'b', cx: 8.4, cy: 4.9, r: 1, fill: 'currentColor' }),
        h('circle', { key: 'c', cx: 10.6, cy: 7.1, r: 1, fill: 'currentColor' }),
      ]);
    }

    /**
     * 行上的「固定 / 取消固定」按钮图标：一枚图钉。
     * 顶部是钉帽，下面张开成钉身，中间一条针。
     */
    function PinGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true }, [
        h('path', {
          key: 'head',
          d: 'M6.3 1.7h3.4l-.3 2.1 2 2.4v1.3H4.6V6.2l2-2.4z',
          fill: 'currentColor', opacity: 0.9,
        }),
        h('path', {
          key: 'needle',
          d: 'M8 7.6v6.6',
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round',
        }),
      ]);
    }

    /** 放大镜：切到「搜索整个项目」。 */
    function SearchGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true }, [
        h('circle', { key: 'ring', cx: 6.8, cy: 6.8, r: 4.2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', { key: 'stem', d: 'M10 10l3.6 3.6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
      ]);
    }

    /** 排序：上下的箭头。 */
    function SortGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true }, [
        h('path', { key: 'up', d: 'M5 6.4 8 3.2l3 3.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round' }),
        h('path', { key: 'down', d: 'M5 9.6 8 12.8l3-3.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round' }),
      ]);
    }

    /** 行高：两道长短不一的横线。 */
    function DensityGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true }, [
        h('path', { key: 'a', d: 'M2.6 4.4h10.8', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
        h('path', { key: 'b', d: 'M2.6 8h7.6', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
        h('path', { key: 'c', d: 'M2.6 11.6h10.8', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
      ]);
    }

    /** 只看标记：一个小色块加勾。 */
    function MarkedGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true }, [
        h('rect', { key: 'box', x: 2.4, y: 2.4, width: 11.2, height: 11.2, rx: 2.4, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }),
        h('path', { key: 'tick', d: 'M5.4 8.2 7.3 10l3.4-3.6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      ]);
    }

    /** 导出：向下的箭头落进托盘。 */
    function DownloadGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': true }, [
        h('path', { key: 'arrow', d: 'M8 2.6v6.2M5.4 6.4 8 9l2.6-2.6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { key: 'tray', d: 'M2.8 10.4v2.2h10.4v-2.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
      ]);
    }

    /** 导入：向上的箭头从托盘里出来。 */
    function UploadGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': true }, [
        h('path', { key: 'arrow', d: 'M8 9V2.8M5.4 5.4 8 2.8l2.6 2.6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { key: 'tray', d: 'M2.8 10.4v2.2h10.4v-2.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
      ]);
    }

    /** 拖拽手柄：两列小点。 */
    function GripGlyph() {
      return h('svg', { viewBox: '0 0 8 16', width: 8, height: 14, 'aria-hidden': true }, [
        h('circle', { key: 'a', cx: 2.4, cy: 4.4, r: 1, fill: 'currentColor' }),
        h('circle', { key: 'b', cx: 5.6, cy: 4.4, r: 1, fill: 'currentColor' }),
        h('circle', { key: 'c', cx: 2.4, cy: 8, r: 1, fill: 'currentColor' }),
        h('circle', { key: 'd', cx: 5.6, cy: 8, r: 1, fill: 'currentColor' }),
        h('circle', { key: 'e', cx: 2.4, cy: 11.6, r: 1, fill: 'currentColor' }),
        h('circle', { key: 'f', cx: 5.6, cy: 11.6, r: 1, fill: 'currentColor' }),
      ]);
    }

    /** 折叠 / 展开的小三角，向下表示展开。 */
    function CaretGlyph(props) {
      const open = props !== undefined && props.open === true;
      return h('svg', {
        viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': true,
        className: open ? 'pfp-chevron pfp-chevron-open' : 'pfp-chevron',
      }, h('path', {
        d: 'M4 2.6 8 6l-4 3.4',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
      }));
    }

    function failureText(tr, failure) {
      const code = failure !== undefined && failure !== null ? failure.code : undefined;
      if (code === 'workspace-file/not-found') return tr('error.notFound');
      if (code === 'workspace-file/outside-workspace') return tr('error.outsideWorkspace');
      if (code === 'workspace-file/not-directory') return tr('error.notDirectory');
      if (failure !== undefined && failure !== null && typeof failure.message === 'string' && failure.message !== '') {
        return tr('error.unavailable', { message: failure.message });
      }
      return tr('error.unknown');
    }

    /**
     * 一次语义化的草稿写入：输入框给了光标位置就地插入，
     * 否则整段重写草稿，并保证引用是独立 token。
     * kind 决定用文件写法还是目录写法。
     */
    function writeMention(input) {
      const { root, path, kind, inputActions, draft, tr } = input;
      const directory = kind === 'directory';
      const mention = directory ? formatFolderMention(root, path) : formatMention(root, path);
      if (mention === undefined) return { message: tr('insertFailed'), error: true };
      const name = posixOf(path).replace(/\/+$/, '').split('/').pop();
      const message = directory ? tr('insertedFolder', { name: name }) : tr('inserted', { name: name });
      const current = typeof draft === 'string' ? draft : '';
      let span;
      try {
        span = inputActions.captureInsertion();
      } catch (error) {
        span = undefined;
      }
      if (span !== undefined && span !== null) {
        // 输入框给了光标位置，就按它的位置插，不再自己拼。
        try {
          const prefix = typeof span.start === 'number' ? current.slice(0, span.start) : current;
          const text = prefix !== '' && !/\s$/u.test(prefix) ? ' ' + mention : mention;
          if (inputActions.insertText(text, span) !== false) {
            return { message: message, error: false };
          }
        } catch (error) {
          /* 下面统一按「插入失败」上报 */
        }
        return { message: tr('insertFailed'), error: true };
      }
      try {
        const separator = current !== '' && !/\s$/u.test(current) ? ' ' : '';
        inputActions.setDraft(current + separator + mention);
        return { message: message, error: false };
      } catch (error) {
        return { message: tr('insertFailed'), error: true };
      }
    }

    /**
     * 一个文件行：单击选中、双击插入引用；眼睛按钮打开产品自带的预览，
     * 图钉按钮收藏，右键出菜单。拖拽也还能用。
     */
    function FileRow(props) {
      const {
        path, label, title, tr, pinned, selected, highlight, size,
        onSelect, onInsert, onView, onPin, onContextMenu, onDragStart, onDragEnd,
      } = props;
      const kind = fileKindOf(label);
      const className = 'pfp-row pfp-rowFile'
        + (selected === true ? ' pfp-rowSelected' : '')
        + (highlight === true ? ' pfp-rowHit' : '');
      const sizeText = formatSize(size);
      return h('div', { className: className }, [
        h('div', {
          key: 'main',
          role: 'button',
          tabIndex: 0,
          draggable: true,
          className: 'pfp-rowMain',
          title: title,
          'data-pfp-path': posixOf(path),
          onClick: (event) => onSelect(path, 'file', event),
          onDoubleClick: () => onInsert(path),
          onContextMenu: (event) => onContextMenu(event, path, 'file'),
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onInsert(path);
            }
          },
          onDragStart: (event) => onDragStart(event, path, 'file'),
          onDragEnd: () => onDragEnd(),
        }, [
          h(FileGlyph, { key: 'icon', color: kind.color }),
          h('span', { key: 'name', className: 'pfp-name' }, label),
          kind.ext === '' ? null : h('span', { key: 'ext', className: 'pfp-extBadge' }, kind.ext),
          sizeText === undefined ? null : h('span', { key: 'size', className: 'pfp-size' }, sizeText),
        ]),
        h('button', {
          key: 'pin',
          type: 'button',
          className: pinned === true ? 'pfp-rowAction pfp-rowAction-on' : 'pfp-rowAction',
          title: pinned === true ? tr('pin.unpin') : tr('pin.button'),
          'aria-label': pinned === true ? tr('pin.unpin') : tr('pin.button'),
          'aria-pressed': pinned === true,
          'data-pfp-pin': '1',
          onClick: (event) => {
            event.stopPropagation();
            onPin(path, 'file');
          },
        }, h(PinGlyph)),
        h('button', {
          key: 'view',
          type: 'button',
          className: 'pfp-rowAction',
          title: tr('view'),
          'aria-label': tr('view'),
          onClick: (event) => {
            event.stopPropagation();
            onView(path);
          },
        }, h(EyeGlyph)),
      ]);
    }

    /**
     * 一个目录层级：path 这一层的条目，
     * 以及所有已展开子目录各自的层级。
     *
     * 行上的交互：单击选中（文件夹同时展开 / 收起），双击插入，右键出菜单。
     */
    function TreeLevel(props) {
      const {
        path, levels, expanded, tr, tagOf, tagEditor, onToggle, onTagToggle, onTagSet, onTagClear,
        onInsert, onInsertDir, onView, onDragStart, onDragEnd, isPinned, onPin, highlight,
        isSelected, onSelect, onContextMenu, sortMode, markedOnly, onExpand,
      } = props;
      const level = levels[path];
      if (level === undefined || level.kind === 'loading') {
        return h('div', { className: 'pfp-skeleton', 'aria-hidden': true }, [
          h('div', { key: 'a', className: 'pfp-skeletonRow', style: { width: '72%' } }),
          h('div', { key: 'b', className: 'pfp-skeletonRow', style: { width: '54%' } }),
          h('div', { key: 'c', className: 'pfp-skeletonRow', style: { width: '64%' } }),
        ]);
      }
      if (level.kind === 'failed') {
        return h('p', { className: 'pfp-note pfp-note-error' }, failureText(tr, level.error));
      }
      const all = sortEntries(level.entries, sortMode);
      const entries = [];
      for (const entry of all) {
        if (markedOnly === true) {
          if (entry.type !== 'directory') continue;
          const tag = tagOf(joinPath(path, entry.name));
          if (tag === undefined || (tag.color === undefined && tag.emoji === undefined)) continue;
        }
        entries.push(entry);
      }
      const rows = [];
      if (entries.length === 0) {
        rows.push(h('li', { key: '__empty', className: 'pfp-item' }, h('p', { className: 'pfp-note' }, tr('empty'))));
      }
      for (const entry of entries) {
        const childPath = joinPath(path, entry.name);
        const isDirectory = entry.type === 'directory';
        const isFile = entry.type === 'file';
        if (!isDirectory && !isFile) {
          rows.push(h('li', { key: entry.name, className: 'pfp-item' }, h('div', {
            className: 'pfp-row pfp-rowOther',
            title: childPath,
          }, h('span', { className: 'pfp-name' }, entry.name))));
          continue;
        }
        if (isFile) {
          rows.push(h('li', { key: entry.name, className: 'pfp-item' }, h(FileRow, {
            path: childPath,
            label: entry.name,
            title: childPath,
            tr: tr,
            pinned: typeof isPinned === 'function' ? isPinned(childPath) : false,
            selected: typeof isSelected === 'function' ? isSelected(childPath) : false,
            highlight: typeof highlight === 'function' ? highlight(childPath) : false,
            size: entry.size,
            onSelect: onSelect,
            onInsert: onInsert,
            onView: onView,
            onPin: onPin,
            onContextMenu: onContextMenu,
            onDragStart: onDragStart,
            onDragEnd: onDragEnd,
          })));
          continue;
        }
        const isOpen = expanded.indexOf(childPath) >= 0;
        const hit = typeof highlight === 'function' ? highlight(childPath) : false;
        const chosen = typeof isSelected === 'function' ? isSelected(childPath) : false;
        const tag = tagOf(childPath);
        const color = tag !== undefined && tag.color !== undefined ? tag.color : undefined;
        const emoji = tag !== undefined && tag.emoji !== undefined ? tag.emoji : undefined;
        const editing = tagEditor === childPath;
        const rowClass = 'pfp-row'
          + (chosen ? ' pfp-rowSelected' : '')
          + (hit ? ' pfp-rowHit' : '');
        rows.push(h('li', { key: entry.name, className: 'pfp-item' }, [
          h('div', { key: 'row', className: rowClass }, [
            h('div', {
              key: 'main',
              role: 'button',
              tabIndex: 0,
              draggable: true,
              className: 'pfp-rowMain',
              title: childPath,
              'data-pfp-path': posixOf(childPath),
              'aria-expanded': isOpen,
              onClick: (event) => {
                onSelect(childPath, 'directory', event);
                // Ctrl / Cmd 加选时不要顺带翻转展开状态，不然多选很烦。
                const multi = event !== undefined && event !== null && (event.ctrlKey === true || event.metaKey === true);
                if (!multi) onToggle(childPath);
              },
              onDoubleClick: () => {
                // 双击是「插入这个目录」，别让两次单击把它折起来。
                if (typeof onExpand === 'function') onExpand(childPath);
                onInsertDir(childPath);
              },
              onContextMenu: (event) => onContextMenu(event, childPath, 'directory'),
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onToggle(childPath);
                }
              },
              onDragStart: (event) => onDragStart(event, childPath, 'directory'),
              onDragEnd: () => onDragEnd(),
            }, [
              h(ChevronGlyph, { key: 'chevron', open: isOpen }),
              h(FolderGlyph, { key: 'icon', color: color }),
              h('span', { key: 'name', className: 'pfp-name' }, entry.name),
              emoji === undefined ? null : h('span', { key: 'emoji', className: 'pfp-emoji', 'aria-hidden': true }, emoji),
            ]),
            h('button', {
              key: 'pin',
              type: 'button',
              className: typeof isPinned === 'function' && isPinned(childPath) === true
                ? 'pfp-rowAction pfp-rowAction-on'
                : 'pfp-rowAction',
              title: typeof isPinned === 'function' && isPinned(childPath) === true ? tr('pin.unpin') : tr('pin.button'),
              'aria-label': typeof isPinned === 'function' && isPinned(childPath) === true ? tr('pin.unpin') : tr('pin.button'),
              'aria-pressed': typeof isPinned === 'function' && isPinned(childPath) === true,
              'data-pfp-pin': '1',
              onClick: (event) => {
                event.stopPropagation();
                onPin(childPath, 'directory');
              },
            }, h(PinGlyph)),
            h('button', {
              key: 'insert',
              type: 'button',
              className: 'pfp-rowAction',
              title: tr('insertDir'),
              'aria-label': tr('insertDir'),
              'data-pfp-insert-dir': '1',
              onClick: (event) => {
                event.stopPropagation();
                onInsertDir(childPath);
              },
            }, h(InsertGlyph)),
            h('button', {
              key: 'tag',
              type: 'button',
              className: 'pfp-rowAction',
              title: tr('tag.button'),
              'aria-label': tr('tag.button'),
              'aria-expanded': editing,
              'data-pfp-tag': '1',
              onClick: (event) => {
                event.stopPropagation();
                onTagToggle(childPath);
              },
            }, h(PaletteGlyph)),
          ]),
          editing ? h(TagEditor, {
            key: 'editor',
            label: entry.name + '/',
            tag: tag,
            tr: tr,
            onColor: (value) => onTagSet(childPath, { color: value }),
            onEmoji: (value) => onTagSet(childPath, { emoji: value }),
            onClear: () => onTagClear(childPath),
            onClose: () => onTagToggle(childPath),
          }) : null,
          isOpen ? h(TreeLevel, {
            key: 'level',
            path: childPath,
            levels: levels,
            expanded: expanded,
            tr: tr,
            tagOf: tagOf,
            tagEditor: tagEditor,
            onToggle: onToggle,
            onTagToggle: onTagToggle,
            onTagSet: onTagSet,
            onTagClear: onTagClear,
            onInsert: onInsert,
            onInsertDir: onInsertDir,
            onView: onView,
            onDragStart: onDragStart,
            onDragEnd: onDragEnd,
            isPinned: isPinned,
            onPin: onPin,
            highlight: highlight,
            isSelected: isSelected,
            onSelect: onSelect,
            onContextMenu: onContextMenu,
            sortMode: sortMode,
            markedOnly: markedOnly,
            onExpand: onExpand,
          }) : null,
        ]));
      }
      const list = h('ul', { className: 'pfp-level' }, rows);
      if (level.truncated !== true) return list;
      return h(React.Fragment, null, list, h('p', { key: 'truncated', className: 'pfp-note' }, tr('truncated')));
    }

    /** 单个文件夹的行内颜色 + 表情编辑面板。 */
    function TagEditor(props) {
      const { label, tag, tr, onColor, onEmoji, onClear, onClose } = props;
      const activeColor = tag !== undefined && tag.color !== undefined ? tag.color : undefined;
      const activeEmoji = tag !== undefined && tag.emoji !== undefined ? tag.emoji : undefined;
      return h('div', {
        className: 'pfp-tagEditor',
        'data-pfp-tag-editor': '1',
        role: 'group',
        'aria-label': tr('tag.button'),
      }, [
        h('div', { key: 'path', className: 'pfp-menuPath', title: label }, label),
        h('div', { key: 'colorLabel', className: 'pfp-menuLabel' }, tr('tag.color')),
        h('div', { key: 'colors', className: 'pfp-swatches' }, COLORS.map((color) => h('button', {
          key: color.id,
          type: 'button',
          className: activeColor === color.value ? 'pfp-swatch pfp-swatch-active' : 'pfp-swatch',
          style: { background: color.value },
          title: color.id,
          'aria-label': color.id,
          'aria-pressed': activeColor === color.value,
          onClick: () => onColor(activeColor === color.value ? undefined : color.value),
        }))),
        h('div', { key: 'emojiLabel', className: 'pfp-menuLabel' }, tr('tag.emoji')),
        h('div', { key: 'emojis', className: 'pfp-emojis' }, EMOJIS.map((emoji) => h('button', {
          key: emoji,
          type: 'button',
          className: activeEmoji === emoji ? 'pfp-emojiBtn pfp-emojiBtn-active' : 'pfp-emojiBtn',
          'aria-label': emoji,
          'aria-pressed': activeEmoji === emoji,
          onClick: () => onEmoji(activeEmoji === emoji ? undefined : emoji),
        }, emoji))),
        h('div', { key: 'foot', className: 'pfp-menuFoot' }, [
          h('button', {
            key: 'clear',
            type: 'button',
            className: 'pfp-menuBtn',
            onClick: onClear,
          }, tr('tag.clear')),
          h('button', {
            key: 'close',
            type: 'button',
            className: 'pfp-menuBtn pfp-menuBtn-primary',
            onClick: onClose,
          }, tr('tag.close')),
        ]),
      ]);
    }

    /**
     * 右侧边栏页签主体：一个常驻的项目文件列表。
     * 文件可以拖进输入框（写成 @path 文本），也可以点击插到光标处；
     * 眼睛按钮用产品自带的预览页签打开内容，列表本身不被替换、可继续浏览；
     * 文件夹带颜色和表情标记。
     */
    function ProjectFilesBody(props) {
      const tr = typeof props.t === 'function' ? props.t : translate;
      const sessionId = props.sessionId;
      const useSessions = props.useSessions;
      const inputActions = props.inputActions;
      const listDirectory = props.listDirectory;
      const readFile = props.readFile;
      const openPath = props.openPath;
      const { tab } = props.useTabInfo();
      const draft = props.useInput((input) => (input !== undefined && input !== null ? input.draft : ''));

      const cwd = useSessions((sessions) => {
        const byId = sessions !== undefined && sessions !== null ? sessions.byId : undefined;
        const summary = byId !== undefined && byId !== null ? byId[sessionId] : undefined;
        return summary !== undefined && summary !== null ? summary.cwd : undefined;
      });
      const root = cwd === undefined || cwd === null ? undefined : posixOf(cwd);
      /** 收藏 / 最近 / 浏览位置用哪个格子：按对话，或者所有对话共用一个格子。 */
      const sessionSlot = String(sessionId === undefined || sessionId === null ? '' : sessionId);

      const initialSettings = readSettings();
      const [settings, setSettings] = useState(initialSettings);
      const [expanded, setExpanded] = useState(() => {
        const saved = readViewState(sessionSlot, root);
        if (saved !== undefined) return saved.expanded;
        return root === undefined ? [] : [root];
      });
      const [levels, setLevels] = useState({});
      const [filter, setFilter] = useState('');
      const [status, setStatus] = useState(null);
      const [errorHidden, setErrorHidden] = useState(false);
      const [dragging, setDragging] = useState(false);
      const [tags, setTags] = useState(() => readTags());
      const [tagEditor, setTagEditor] = useState(null);
      const pinsSlot = settings.sharedPins === true ? SHARED_PINS_SLOT : sessionSlot;
      const [pins, setPins] = useState(() => readSessionPins(pinsSlot, root));
      /** 防御一句：万一状态被写成别的形状，就按空表用，别整页崩掉。 */
      const pinList = Array.isArray(pins) ? pins : [];
      const [reveal, setReveal] = useState(null);
      const [selected, setSelected] = useState([]);
      const [menu, setMenu] = useState(null);
      const [preview, setPreview] = useState(null);
      const [searchMode, setSearchMode] = useState(false);
      const [search, setSearch] = useState(null);
      const [recent, setRecent] = useState(() => readRecent(sessionSlot));
      const [pinDrag, setPinDrag] = useState(null);

      const controllers = useRef(new Map());
      const listApi = useRef(listDirectory);
      const inputRef = useRef(inputActions);
      const rootRef = useRef(root);
      const reloadRef = useRef(null);
      const bodyRef = useRef(null);
      const searchRef = useRef(null);
      const previewRef = useRef(null);
      const searchIdRef = useRef(0);
      const importRef = useRef(null);
      const lastScrollRef = useRef(0);
      const scrollTimerRef = useRef(0);
      const restoredScrollRef = useRef(false);
      const expandedRef = useRef(expanded);
      expandedRef.current = expanded;
      listApi.current = listDirectory;
      inputRef.current = inputActions;
      rootRef.current = root;

      const load = (path) => {
        const running = controllers.current;
        if (running.has(path)) return;
        const base = rootRef.current;
        if (base === undefined) return;
        const controller = new AbortController();
        running.set(path, controller);
        setLevels((prev) => {
          const current = prev[path];
          if (current !== undefined && current.kind === 'loading') return prev;
          const next = Object.assign({}, prev);
          next[path] = { kind: 'loading' };
          return next;
        });
        const settle = (next) => {
          running.delete(path);
          if (controller.signal.aborted || rootRef.current !== base) return;
          setLevels((prev) => {
            const merged = Object.assign({}, prev);
            merged[path] = next;
            return merged;
          });
        };
        Promise.resolve()
          .then(() => listApi.current(sessionId, path, controller.signal))
          .then((result) => {
            if (result !== undefined && result !== null && result.ok === true) {
              const value = result.value || {};
              settle({
                kind: 'ready',
                entries: Array.isArray(value.entries) ? value.entries : [],
                truncated: value.truncated === true,
              });
              return;
            }
            settle({ kind: 'failed', error: result !== undefined && result !== null ? result.error : undefined });
          })
          .catch((error) => {
            settle({
              kind: 'failed',
              error: {
                code: 'unknown',
                message: error !== undefined && error !== null && error.message !== undefined ? String(error.message) : String(error),
              },
            });
          });
      };

      const abortAll = () => {
        for (const running of controllers.current.values()) running.abort();
        controllers.current.clear();
      };

      useEffect(() => () => {
        abortAll();
      }, []);

      // 工作目录变了就重开一棵树：能读到上次的浏览位置就照它恢复，否则只展开根。
      useEffect(() => {
        abortAll();
        setLevels({});
        setFilter('');
        setStatus(null);
        setTagEditor(null);
        setSelected([]);
        setPreview(null);
        restoredScrollRef.current = false;
        lastScrollRef.current = 0;
        if (root === undefined) {
          setExpanded([]);
          return;
        }
        const saved = readViewState(sessionSlot, root);
        setExpanded(saved !== undefined ? saved.expanded : [root]);
      }, [root]);

      useEffect(() => {
        if (root === undefined) return;
        for (const path of expanded) {
          if (levels[path] === undefined) load(path);
        }
      }, [root, expanded, levels]);

      // 收藏按「格子」读：默认每个对话一格，设置成共享时所有对话读同一格。
      useEffect(() => {
        setPins(readSessionPins(pinsSlot, rootRef.current));
      }, [pinsSlot, root]);

      // 最近使用也按对话记。
      useEffect(() => {
        setRecent(readRecent(sessionSlot));
      }, [sessionSlot]);

      // 固定过的目录，在刷新页面或切回这个对话后自动展开到那一层，
      // 这样固定的深目录一打开就是原地状态。
      useEffect(() => {
        if (root === undefined) return;
        const wanted = [];
        for (const pin of pinList) {
          if (pin.kind !== 'directory') continue;
          for (const path of ancestorChain(root, joinPath(root, pin.path))) {
            if (wanted.indexOf(path) < 0) wanted.push(path);
          }
        }
        if (wanted.length === 0) return;
        setExpanded((prev) => {
          let changed = false;
          const next = prev.slice();
          for (const path of wanted) {
            if (next.indexOf(path) < 0) {
              next.push(path);
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      }, [root, pins]);

      // 点了收藏项之后：
      // 1) 先把那一行滚进可见区域（目录层还没读完就每 80ms 再试，最多约 2.4 秒）；
      // 2) 找到的那一行闪一下，让人一眼看到跳到了哪。
      useEffect(() => {
        if (reveal === null) return undefined;
        let cancelled = false;
        let timer = 0;
        let tries = 0;
        const attempt = () => {
          if (cancelled) return;
          let found = null;
          try {
            if (typeof document !== 'undefined') {
              const nodes = document.querySelectorAll('[data-pfp-path]');
              for (const node of nodes) {
                if (node.getAttribute('data-pfp-path') === reveal.path) {
                  found = node;
                  break;
                }
              }
            }
          } catch (error) {
            /* 滚动失败不影响功能 */
          }
          if (found !== null) {
            try {
              found.scrollIntoView({ block: 'center' });
            } catch (error) {
              /* 有些容器不支持，忽略 */
            }
            setStatus({ message: tr('pin.jumped', { name: reveal.path.split('/').pop() }), error: false });
            // 高亮保持一会儿再撤掉，撤掉之后就不再重试。
            timer = setTimeout(() => {
              if (!cancelled) setReveal(null);
            }, 1000);
            return;
          }
          tries += 1;
          if (tries >= 30) {
            setReveal(null);
            return;
          }
          timer = setTimeout(attempt, 80);
        };
        timer = setTimeout(attempt, 60);
        return () => {
          cancelled = true;
          clearTimeout(timer);
        };
      }, [reveal, levels, expanded]);

      /** 当前正被定位的那一行要闪一下。 */
      const highlightOf = (path) => reveal !== null && reveal.path === posixOf(path);

      const reload = () => {
        const paths = expanded.length > 0 ? expanded : root === undefined ? [] : [root];
        for (const path of paths) {
          const running = controllers.current.get(path);
          if (running !== undefined) {
            running.abort();
            controllers.current.delete(path);
          }
        }
        setLevels({});
        for (const path of paths) load(path);
      };

      reloadRef.current = reload;

      // 侧栏自带的刷新命令也刷新这个页面。
      useEffect(() => {
        if (tab.actions === undefined || typeof tab.actions.bindCommands !== 'function') return undefined;
        return tab.actions.bindCommands({
          refresh: () => {
            const run = reloadRef.current;
            if (run !== null && run !== undefined) run();
          },
        });
      }, [tab.actions, tab.id]);

      // Esc 关闭行内标记面板。
      useEffect(() => {
        if (tagEditor === null) return undefined;
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setTagEditor(null);
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => {
          window.removeEventListener('keydown', onKeyDown, true);
        };
      }, [tagEditor]);

      const toggleDirectory = (path) => {
        setExpanded((prev) => {
          if (prev.indexOf(path) >= 0) return prev.filter((value) => value !== path && value.indexOf(path + '/') !== 0);
          return prev.concat([path]);
        });
      };

      /** 只展开、不折叠：双击插入目录时用，别把刚展开的层收起来。 */
      const expandDirectory = (path) => {
        setExpanded((prev) => (prev.indexOf(path) >= 0 ? prev : prev.concat([path])));
      };

      const insertEntry = (path, kind) => {
        const actions = inputRef.current;
        if (actions === undefined || actions === null) {
          setStatus({ message: tr('insertFailed'), error: true });
          return;
        }
        setStatus(writeMention({
          root: rootRef.current,
          path: path,
          kind: kind,
          inputActions: actions,
          draft: draft,
          tr: tr,
        }));
        remember(path, kind === 'directory' ? 'directory' : 'file');
      };

      const insertPath = (path) => insertEntry(path, 'file');

      const insertFolder = (path) => insertEntry(path, 'directory');

      const viewFile = (path) => {
        const base = rootRef.current;
        if (base === undefined) return;
        try {
          if (typeof tab.actions.openResource !== 'function') throw new Error('no resource opener');
          tab.actions.openResource(fileAddressFor(sessionId, base, path));
          setStatus({ message: tr('view.opened', { name: posixOf(path).split('/').pop() }), error: false });
          remember(path, 'file');
        } catch (error) {
          setStatus({ message: tr('viewFailed'), error: true });
        }
      };

      const tagOf = (path) => {
        if (root === undefined) return undefined;
        const byRoot = tags[root];
        if (byRoot === undefined || byRoot === null) return undefined;
        const record = byRoot[relativeTo(root, path)];
        return record !== undefined && record !== null ? record : undefined;
      };

      /**
       * 固定项跟着对话走：这份列表就是当前对话自己的那一套，
       * 换了对话会重新读另一份，互不相关。
       */
      const pinsShown = pinList;

      /** 某个绝对路径是否已被固定（当前对话的表里有没有它）。 */
      const isPinned = (path) => {
        if (root === undefined) return false;
        const relative = relativeTo(root, path);
        if (relative === '') return false;
        for (const pin of pinsShown) {
          if (pin.path === relative) return true;
        }
        return false;
      };

      // 写收藏：只改当前格子，整张表其余格子的原样保留。
      const savePins = (list) => {
        const key = pinsSlot;
        let map = {};
        try {
          const raw = window.localStorage.getItem(PINS_KEY);
          const parsed = raw === null || raw === undefined || raw === '' ? {} : JSON.parse(raw);
          if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) map = parsed;
        } catch (error) {
          map = {};
        }
        const next = Object.assign({}, map);
        if (list.length === 0) delete next[key];
        else next[key] = list;
        setPins(list);
        writeSessionPins(next);
      };

      /** 固定 / 取消固定；kind 只在这一行还没被固定时用得上。 */
      const togglePin = (path, kind) => {
        const base = rootRef.current !== undefined && rootRef.current !== null ? rootRef.current : root;
        if (base === undefined) return;
        const relative = relativeTo(base, path);
        if (relative === '') return;
        const name = relative.split('/').pop();
        const entry = { path: relative, kind: kind === 'directory' ? 'directory' : 'file' };
        const current = Array.isArray(pins) ? pins : [];
        if (current.some((pin) => samePin(pin, entry))) {
          savePins(current.filter((pin) => !samePin(pin, entry)));
          setStatus({ message: tr('pin.unpinned', { name: name }), error: false });
          return;
        }
        savePins([entry].concat(current));
        setStatus({ message: tr('pin.pinned', { name: name }), error: false });
      };

      /** 固定区里的 × 号：取消固定这一条。 */
      const removePin = (pin) => {
        const name = pin.path.split('/').pop();
        const current = Array.isArray(pins) ? pins : [];
        savePins(current.filter((item) => !samePin(item, pin)));
        setStatus({ message: tr('pin.unpinned', { name: name }), error: false });
      };

      /**
       * 点收藏区的一行：目录就立刻展开并跳过去，文件就直接插入引用。
       * 点的瞬间先把沿途每一层的目录读取发出去（并行），再展开、再滚过去，
       * 不用等一层一层读回来。
       */
      const openPin = (pin) => {
        if (root === undefined) return;
        const absolute = joinPath(root, pin.path);
        if (pin.kind === 'directory') {
          const chain = ancestorChain(root, absolute);
          const next = expanded.slice();
          for (const path of chain) {
            if (next.indexOf(path) < 0) next.push(path);
          }
          setExpanded(next);
          // 立刻把沿途各层的读取都发出去，别等 effect 一轮轮来。
          for (const path of chain) {
            if (levels[path] === undefined) load(path);
          }
          setStatus({ message: tr('pin.locating', { name: pin.path.split('/').pop() }), error: false });
          setReveal({ path: absolute, at: Date.now() });
          remember(absolute, 'directory');
          return;
        }
        insertPath(absolute);
      };

      // 写标记时不可变地替换整张表，并落盘。
      const writeTag = (path, patch) => {
        if (root === undefined) return;
        const relative = relativeTo(root, path);
        if (relative === '') return;
        const byRoot = Object.assign({}, tags[root] !== undefined ? tags[root] : {});
        const current = Object.assign({}, byRoot[relative] !== undefined ? byRoot[relative] : {});
        // 只改调用方点名的那一项；显式传 undefined 表示清除该项。
        if (Object.prototype.hasOwnProperty.call(patch, 'color')) {
          if (patch.color === undefined) delete current.color;
          else current.color = patch.color;
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'emoji')) {
          if (patch.emoji === undefined) delete current.emoji;
          else current.emoji = patch.emoji;
        }
        if (current.color === undefined && current.emoji === undefined) delete byRoot[relative];
        else byRoot[relative] = current;
        const next = Object.assign({}, tags);
        if (Object.keys(byRoot).length === 0) delete next[root];
        else next[root] = byRoot;
        setTags(next);
        writeTags(next);
      };

      const toggleTagEditor = (path) => {
        setTagEditor((prev) => (prev === path ? null : path));
      };

      const clearTag = (path) => {
        writeTag(path, { color: undefined, emoji: undefined });
      };

      // ── 面板设置：行高、排序、只看标记、收藏是否共享 ──────────────────
      const saveSettings = (patch) => {
        const next = Object.assign({}, settings, patch);
        setSettings(next);
        writeJsonObject(SETTINGS_KEY, next);
      };

      const toggleDensity = () => {
        saveSettings({ density: settings.density === 'dense' ? 'cozy' : 'dense' });
      };

      const SORT_MODES = ['name', 'type', 'size'];
      const cycleSort = () => {
        const index = SORT_MODES.indexOf(settings.sort);
        saveSettings({ sort: SORT_MODES[(index + 1) % SORT_MODES.length] });
      };

      const toggleMarkedOnly = () => {
        saveSettings({ markedOnly: settings.markedOnly !== true });
      };

      const togglePinsCollapsed = () => {
        saveSettings({ pinsCollapsed: settings.pinsCollapsed !== true });
      };

      const toggleRecentCollapsed = () => {
        saveSettings({ recentCollapsed: settings.recentCollapsed !== true });
      };

      // ── 选中：单击选中，Ctrl / Cmd 加选，双击插入 ──────────────────
      const selectRow = (path, kind, event) => {
        const multi = Boolean(event !== undefined && (event.ctrlKey || event.metaKey));
        setSelected((prev) => {
          const hit = prev.some((item) => item.path === path);
          if (multi) {
            return hit ? prev.filter((item) => item.path !== path) : prev.concat([{ path: path, kind: kind }]);
          }
          if (prev.length === 1 && hit) return [];
          return [{ path: path, kind: kind }];
        });
      };

      const isSelected = (path) => selected.some((item) => item.path === path);

      /** 把选中的几项一次性插进输入框。 */
      const insertSelected = () => {
        const actions = inputRef.current;
        if (actions === undefined || actions === null) {
          setStatus({ message: tr('insertFailed'), error: true });
          return;
        }
        const base = rootRef.current;
        const mentions = [];
        for (const item of selected) {
          const mention = item.kind === 'directory'
            ? formatFolderMention(base, item.path)
            : formatMention(base, item.path);
          if (mention !== undefined) mentions.push(mention.replace(/\s+$/u, ''));
        }
        if (mentions.length === 0) {
          setStatus({ message: tr('insertFailed'), error: true });
          return;
        }
        const joined = mentions.join(' ') + ' ';
        try {
          const span = typeof actions.captureInsertion === 'function' ? actions.captureInsertion() : undefined;
          if (span !== undefined && span !== null && typeof actions.insertText === 'function') {
            if (actions.insertText(' ' + joined, span) !== false) {
              setStatus({ message: tr('selected.inserted', { n: mentions.length }), error: false });
              setSelected([]);
              return;
            }
          }
          if (typeof actions.setDraft === 'function') {
            const current = typeof draft === 'string' ? draft : '';
            const separator = current !== '' && !/\s$/u.test(current) ? ' ' : '';
            actions.setDraft(current + separator + joined);
            setStatus({ message: tr('selected.inserted', { n: mentions.length }), error: false });
            setSelected([]);
            return;
          }
        } catch (error) {
          /* 落到下面的失败提示 */
        }
        setStatus({ message: tr('insertFailed'), error: true });
      };

      // ── 最近使用：插入、预览、跳转都记一笔 ────────────────────────
      const remember = (path, kind) => {
        const base = rootRef.current;
        if (base === undefined) return;
        const relative = relativeTo(base, path);
        if (relative === '') return;
        const current = Array.isArray(recent) ? recent : [];
        const next = [{ path: relative, kind: kind }]
          .concat(current.filter((item) => item.path !== relative))
          .slice(0, 12);
        setRecent(next);
        writeRecent(sessionSlot, next);
      };

      // ── 右键菜单 ─────────────────────────────────────────────────
      const openMenu = (event, path, kind) => {
        if (event !== undefined && typeof event.preventDefault === 'function') event.preventDefault();
        if (event !== undefined && typeof event.stopPropagation === 'function') event.stopPropagation();
        let x = event !== undefined && typeof event.clientX === 'number' ? event.clientX : 0;
        let y = event !== undefined && typeof event.clientY === 'number' ? event.clientY : 0;
        // 别让菜单跑出窗口右边和下边。
        try {
          const width = typeof window !== 'undefined' && typeof window.innerWidth === 'number' ? window.innerWidth : 0;
          const height = typeof window !== 'undefined' && typeof window.innerHeight === 'number' ? window.innerHeight : 0;
          if (width > 0) x = Math.max(4, Math.min(x, width - 220));
          if (height > 0) y = Math.max(4, Math.min(y, height - 300));
        } catch (error) {
          /* 忽略 */
        }
        setMenu({ x: x, y: y, path: path, kind: kind });
      };

      useEffect(() => {
        if (menu === null) return undefined;
        const close = () => setMenu(null);
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setMenu(null);
        };
        window.addEventListener('click', close);
        window.addEventListener('keydown', onKeyDown, true);
        return () => {
          window.removeEventListener('click', close);
          window.removeEventListener('keydown', onKeyDown, true);
        };
      }, [menu]);

      // ── 复制 / 打开文件管理器 / 面板内预览 ────────────────────────
      const copyValue = async (text, label) => {
        const ok = await copyText(text);
        setStatus({ message: ok ? tr('copied', { what: label }) : tr('copyFailed'), error: !ok });
      };

      const copyRelative = (path, kind) => {
        const base = rootRef.current;
        const relative = relativeTo(base, path) + (kind === 'directory' ? '/' : '');
        copyValue(relative, tr('menu.copyRel'));
      };

      const copyAbsolute = (path) => {
        copyValue(posixOf(path), tr('menu.copyAbs'));
      };

      const copyMarkdown = (path, kind) => {
        const base = rootRef.current;
        const relative = relativeTo(base, path) + (kind === 'directory' ? '/' : '');
        const label = posixOf(path).replace(/\/+$/, '').split('/').pop() + (kind === 'directory' ? '/' : '');
        copyValue(markdownLinkFor(label, relative), tr('menu.copyMd'));
      };

      const revealPath = async (path) => {
        if (typeof openPath !== 'function') {
          setStatus({ message: tr('revealFailed'), error: true });
          return;
        }
        try {
          const controller = new AbortController();
          const result = await openPath({ path: posixOf(path), action: 'reveal' }, controller.signal);
          if (unpackRemote(result) !== undefined) {
            setStatus({ message: tr('revealed'), error: false });
            return;
          }
          setStatus({ message: tr('revealFailed'), error: true });
        } catch (error) {
          setStatus({ message: tr('revealFailed'), error: true });
        }
      };

      const closePreview = () => {
        if (previewRef.current !== null) {
          previewRef.current.abort();
          previewRef.current = null;
        }
        setPreview(null);
      };

      /** 某个目录里有没有某个子目录（用来判断 vault 根，靠 .obsidian 认）。 */
      const directoryExists = async (path) => {
        try {
          const controller = new AbortController();
          const result = await listApi.current(sessionId, path, controller.signal);
          return result !== undefined && result !== null && result.ok === true;
        } catch (error) {
          return false;
        }
      };

      /**
       * 在 Obsidian 中打开。
       *
       * 先请 Host 拉：浏览器直接 `window.open('obsidian://...')` 在 Electron / 严格策略下
       * 会被悄悄拦掉（点了没反应），所以优先 POST 到 Host 的本地路由，由系统命令拉起。
       * Host 路由不可用（老版本、非桌面环境）时，再退回页面直接开协议。
       *
       * - 文件：path 形式，Obsidian 自己找包含它的 vault 并定位到文件。
       * - 文件夹：Obsidian 的 URI 只能开 vault，先认一下带 `.obsidian` 的祖先，
       *   有就开那个 vault；认不出来就退回 path 形式碰运气。
       */
      const launchObsidian = async (path, kind) => {
        const base = rootRef.current;
        if (base === undefined) return;
        const absolute = posixOf(path);
        const name = absolute.replace(/\/+$/, '').split('/').pop();
        let vaultName;

        if (kind === 'directory') {
          // 先看这个目录自己是不是 vault 根，再看会话工作目录是不是。
          const candidates = [absolute, base];
          for (const candidate of candidates) {
            if (await directoryExists(candidate + '/.obsidian')) {
              vaultName = posixOf(candidate).replace(/\/+$/, '').split('/').pop();
              break;
            }
          }
        }

        const payload = vaultName !== undefined && kind === 'directory'
          ? { mode: 'vault', vault: vaultName }
          : { mode: 'path', target: absolute };

        // 1) 让 Host 用系统命令拉起。
        let routed = false;
        try {
          if (typeof fetch === 'function') {
            const response = await fetch('/x-project-file-picker/obsidian', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(payload),
            });
            routed = response.ok === true;
          }
        } catch (error) {
          routed = false;
        }

        // 2) Host 路由不可用时退回页面直接开协议。
        if (!routed) {
          const encoded = encodeURIComponent(absolute);
          const uri = vaultName !== undefined && kind === 'directory'
            ? 'obsidian://open?vault=' + encodeURIComponent(vaultName)
            : 'obsidian://open?path=' + encoded;
          let opened = false;
          try {
            if (typeof window !== 'undefined' && typeof window.open === 'function') {
              window.open(uri, '_blank');
              opened = true;
            }
          } catch (error) {
            opened = false;
          }
          if (!opened) {
            setStatus({ message: tr('obsidian.failed'), error: true });
            return;
          }
        }

        if (vaultName !== undefined && kind === 'directory') {
          setStatus({ message: tr('obsidian.vaultHint', { vault: vaultName }), error: false });
          return;
        }
        setStatus({ message: tr('obsidian.requested', { name: name }), error: false });
      };

      /** 读一段文本在面板里预览；读不了的（图片等）直接交给产品预览页签。 */
      const openInline = async (path) => {
        if (root === undefined) return;
        const kind = fileKindOf(path);
        if (typeof readFile !== 'function' || kind.id === 'image' || kind.id === 'archive') {
          viewFile(path);
          return;
        }
        if (previewRef.current !== null) previewRef.current.abort();
        const controller = new AbortController();
        previewRef.current = controller;
        setPreview({ kind: 'loading', path: path, text: '', lines: 0, eof: true });
        try {
          const result = await readFile(sessionId, path, { offset: 1, limit: PREVIEW_LIMITS.lines }, controller.signal);
          if (previewRef.current !== controller) return;
          const value = unpackRemote(result);
          if (value === undefined || typeof value.text !== 'string') {
            setPreview({ kind: 'failed', path: path, text: '', lines: 0, eof: true });
            return;
          }
          setPreview({
            kind: 'ready',
            path: path,
            text: value.text,
            lines: typeof value.lines === 'number' ? value.lines : 0,
            eof: value.eof === true,
          });
          remember(path, 'file');
        } catch (error) {
          if (previewRef.current !== controller) return;
          setPreview({ kind: 'failed', path: path, text: '', lines: 0, eof: true });
        } finally {
          if (previewRef.current === controller) previewRef.current = null;
        }
      };

      // ── 全项目递归搜索：勾上放大镜后，输入框变成搜索框 ─────────────
      const stopSearch = () => {
        const controller = searchRef.current;
        if (controller !== null) {
          controller.abort();
          searchRef.current = null;
        }
        searchIdRef.current += 1;
        setSearch(null);
      };

      useEffect(() => {
        if (searchMode !== true || root === undefined) {
          if (search !== null) setSearch(null);
          return undefined;
        }
        const needle = (filter === undefined || filter === null ? '' : String(filter)).trim();
        if (needle === '') {
          if (search !== null) setSearch(null);
          return undefined;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
          const controller = new AbortController();
          searchRef.current = controller;
          searchIdRef.current += 1;
          const id = searchIdRef.current;
          setSearch({ kind: 'searching', results: [], scanned: 0, truncated: false, needle: needle });
          searchProject(listApi.current, sessionId, rootRef.current, needle, controller.signal, (progress) => {
            if (cancelled || searchIdRef.current !== id) return;
            setSearch((prev) => (prev === null
              ? prev
              : {
                kind: 'searching',
                results: prev.results,
                scanned: progress.scanned,
                truncated: prev.truncated,
                needle: needle,
              }));
          }).then((outcome) => {
            if (cancelled || searchIdRef.current !== id) return;
            setSearch({
              kind: 'ready',
              results: outcome.results,
              scanned: outcome.scanned,
              truncated: outcome.truncated,
              needle: needle,
            });
            if (searchRef.current === controller) searchRef.current = null;
          }).catch(() => {
            if (cancelled || searchIdRef.current !== id) return;
            setSearch({ kind: 'ready', results: [], scanned: 0, truncated: false, needle: needle });
          });
        }, 280);
        return () => {
          cancelled = true;
          clearTimeout(timer);
        };
      }, [searchMode, filter, root, sessionId]);

      // ── 浏览位置：展开状态和滚动位置按对话记住 ────────────────────
      useEffect(() => {
        if (root === undefined) return;
        writeViewState(pinsSlot, { expanded: expanded, scrollTop: lastScrollRef.current });
      }, [expanded, root, pinsSlot]);

      // ── 收藏拖拽排序 ─────────────────────────────────────────────
      const movePins = (from, to) => {
        const current = Array.isArray(pins) ? pins.slice() : [];
        if (from < 0 || from >= current.length || to < 0 || to > current.length) return;
        if (from === to) return;
        const moved = current.splice(from, 1)[0];
        current.splice(Math.max(0, Math.min(current.length, to)), 0, moved);
        savePins(current);
        setStatus({ message: tr('pins.moved'), error: false });
      };

      // 收藏改「所有对话共用」/「只本对话」时，把当前这份搬过去，别让列表凭空消失。
      const toggleSharedPins = () => {
        const next = settings.sharedPins !== true;
        const current = Array.isArray(pins) ? pins : [];
        const target = next ? SHARED_PINS_SLOT : sessionSlot;
        writePinsToSlot(target, current);
        saveSettings({ sharedPins: next });
        setStatus({ message: tr(next ? 'pins.sharedOn' : 'pins.sharedOff'), error: false });
      };

      const exportPins = () => {
        const ok = downloadJson('project-file-picker-favourites.json', {
          version: 1,
          pins: Array.isArray(pins) ? pins : [],
        });
        setStatus({ message: ok ? tr('pins.exported') : tr('copyFailed'), error: !ok });
      };

      const importPins = (event) => {
        const target = event !== undefined && event.target !== undefined ? event.target : undefined;
        const file = target !== undefined && target.files !== undefined ? target.files[0] : undefined;
        if (file === undefined || file === null || typeof FileReader === 'undefined') return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result));
            const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.pins) ? parsed.pins : [];
            const current = Array.isArray(pins) ? pins.slice() : [];
            let added = 0;
            for (const item of items) {
              const pin = normalizePin(item);
              if (pin === undefined) continue;
              if (current.some((existing) => samePin(existing, pin))) continue;
              current.push(pin);
              added += 1;
            }
            savePins(current);
            setStatus({ message: tr('pins.imported', { n: added }), error: false });
          } catch (error) {
            setStatus({ message: tr('pins.importFailed'), error: true });
          }
          if (target !== undefined) target.value = '';
        };
        reader.onerror = () => {
          setStatus({ message: tr('pins.importFailed'), error: true });
          if (target !== undefined) target.value = '';
        };
        reader.readAsText(file);
      };

      const onDragStart = (event, path, kind) => {
        const directory = kind === 'directory';
        const mention = directory ? formatFolderMention(root, path) : formatMention(root, path);
        if (mention === undefined) {
          event.preventDefault();
          return;
        }
        const transfer = event.dataTransfer;
        if (transfer === null || transfer === undefined) return;
        transfer.effectAllowed = 'copy';
        transfer.setData('text/plain', mention);
        transfer.setData(
          directory ? 'application/x-dsh-project-directory' : 'application/x-dsh-project-file',
          posixOf(path),
        );
        setDragging(true);
      };

      const onDragEnd = () => setDragging(false);

      // 拖拽源可能在拖动途中被卸载（刷新、筛选输入都会发生），
      // 那样它自己的 dragend 不会触发，所以在全局兜底清掉提示。
      useEffect(() => {
        if (!dragging) return undefined;
        const clear = () => setDragging(false);
        window.addEventListener('dragend', clear, true);
        window.addEventListener('drop', clear, true);
        return () => {
          window.removeEventListener('dragend', clear, true);
          window.removeEventListener('drop', clear, true);
        };
      }, [dragging]);

      const loadedFiles = useMemo(() => {
        const found = [];
        for (const path of Object.keys(levels)) {
          const level = levels[path];
          if (level === undefined || level.kind !== 'ready') continue;
          for (const entry of level.entries) {
            if (entry.type !== 'file') continue;
            found.push({ path: joinPath(path, entry.name), name: entry.name, size: entry.size });
          }
        }
        return found.sort((left, right) => collator.compare(left.path, right.path));
      }, [levels]);

      const matches = useMemo(() => {
        const needle = (filter === undefined || filter === null ? '' : String(filter)).trim().toLowerCase();
        if (needle === '') return null;
        return loadedFiles.filter((file) => file.path.toLowerCase().indexOf(needle) >= 0).slice(0, 300);
      }, [filter, loadedFiles]);

      // 出错时在顶部出一条可关掉的提示条；换一条新提示就重新出现。
      useEffect(() => {
        setErrorHidden(false);
      }, [status]);

      // 滚动位置：滚动时记住，下次回来恢复。
      const onBodyScroll = () => {
        const node = bodyRef.current;
        if (node === null) return;
        lastScrollRef.current = node.scrollTop;
        if (scrollTimerRef.current !== 0) return;
        scrollTimerRef.current = setTimeout(() => {
          scrollTimerRef.current = 0;
          if (rootRef.current === undefined) return;
          writeViewState(pinsSlot, { expanded: expandedRef.current, scrollTop: lastScrollRef.current });
        }, 400);
      };

      useEffect(() => {
        if (root === undefined || restoredScrollRef.current === true) return;
        const node = bodyRef.current;
        if (node === null) return;
        if (levels[root] === undefined) return;
        const saved = readViewState(sessionSlot, root);
        if (saved !== undefined && saved.scrollTop > 0) node.scrollTop = saved.scrollTop;
        restoredScrollRef.current = true;
      }, [root, levels, sessionSlot]);

      if (root === undefined) {
        return h('div', { className: 'pfp-root' }, [
          h('div', { key: 'header', className: 'pfp-header' },
            h('span', { className: 'pfp-path' }, '—')),
          h('div', { key: 'status', className: 'pfp-status' },
            h('p', { className: 'pfp-statusLine' }, tr('noWorkspace'))),
        ]);
      }

      const dense = settings.density === 'dense';
      const pinsCollapsed = settings.pinsCollapsed === true;
      const recentCollapsed = settings.recentCollapsed !== false;
      const shared = settings.sharedPins === true;
      const sortShort = tr('sort.' + settings.sort + '.short');

      const header = h('div', { key: 'header', className: 'pfp-header' }, [
        h('span', { key: 'path', className: 'pfp-path', title: root }, root),
        h('button', {
          key: 'density',
          type: 'button',
          className: 'pfp-tool',
          title: dense ? tr('density.cozy') : tr('density.compact'),
          'aria-label': dense ? tr('density.cozy') : tr('density.compact'),
          'data-pfp-density': settings.density,
          onClick: toggleDensity,
        }, h(DensityGlyph)),
        h('button', {
          key: 'reload',
          type: 'button',
          className: 'pfp-tool',
          title: tr('reload'),
          'aria-label': tr('reload'),
          onClick: reload,
        }, h(ReloadGlyph)),
      ]);

      const toolbar = h('div', { key: 'filter', className: 'pfp-filterRow' }, [
        h('input', {
          key: 'input',
          type: 'text',
          className: 'pfp-filter',
          placeholder: searchMode ? tr('search.hint') : tr('filter'),
          value: filter,
          spellCheck: false,
          'aria-label': searchMode ? tr('search.whole') : tr('filter'),
          onChange: (event) => setFilter(event.target.value),
        }),
        h('button', {
          key: 'search',
          type: 'button',
          className: searchMode ? 'pfp-iconBtn pfp-iconBtn-on' : 'pfp-iconBtn',
          title: tr('search.whole'),
          'aria-label': tr('search.whole'),
          'aria-pressed': searchMode,
          'data-pfp-search': '1',
          onClick: () => {
            if (searchMode) {
              setSearchMode(false);
              stopSearch();
              return;
            }
            setSearchMode(true);
          },
        }, h(SearchGlyph)),
        h('button', {
          key: 'sort',
          type: 'button',
          className: 'pfp-iconBtn',
          title: tr('sort.state', { mode: sortShort }),
          'aria-label': tr('sort.state', { mode: sortShort }),
          'data-pfp-sort': settings.sort,
          onClick: cycleSort,
        }, h(SortGlyph)),
        h('button', {
          key: 'marked',
          type: 'button',
          className: settings.markedOnly === true ? 'pfp-iconBtn pfp-iconBtn-on' : 'pfp-iconBtn',
          title: settings.markedOnly === true ? tr('marked.all') : tr('marked.only'),
          'aria-label': settings.markedOnly === true ? tr('marked.all') : tr('marked.only'),
          'aria-pressed': settings.markedOnly === true,
          'data-pfp-marked': settings.markedOnly === true ? '1' : '0',
          onClick: toggleMarkedOnly,
        }, h(MarkedGlyph)),
      ]);

      const errorBar = status !== null && status.error === true && !dragging && errorHidden !== true
        ? h('div', { key: 'error', className: 'pfp-errorBar', 'data-pfp-error': '1' }, [
          h('span', { key: 'text', className: 'pfp-errorBarText' }, status.message),
          h('button', {
            key: 'close',
            type: 'button',
            className: 'pfp-errorBarClose',
            'aria-label': tr('preview.close'),
            onClick: () => setErrorHidden(true),
          }, '×'),
        ])
        : null;

      /** 一个文件结果行（筛选结果和搜索结果共用）。 */
      const fileRow = (file) => h('li', { key: file.path, className: 'pfp-item' }, h(FileRow, {
        path: file.path,
        label: relativeTo(root, file.path),
        title: file.path,
        tr: tr,
        pinned: isPinned(file.path),
        selected: isSelected(file.path),
        size: file.size,
        onSelect: selectRow,
        onInsert: insertPath,
        onView: viewFile,
        onPin: togglePin,
        onContextMenu: openMenu,
        onDragStart: onDragStart,
        onDragEnd: onDragEnd,
      }));

      let body;
      if (searchMode) {
        if (search === null) {
          body = h('p', { className: 'pfp-note' }, tr('search.hint'));
        } else if (search.results.length === 0) {
          body = h('p', { className: 'pfp-note' }, search.kind === 'searching'
            ? tr('search.searching', { dirs: search.scanned })
            : tr('search.none'));
        } else {
          body = h(React.Fragment, null, [
            h('p', { key: 'sum', className: 'pfp-note' }, search.kind === 'searching'
              ? tr('search.searching', { dirs: search.scanned })
              : tr('search.done', { n: search.results.length, dirs: search.scanned })
                + (search.truncated === true ? ' · ' + tr('search.limit') : '')),
            h('ul', { key: 'list', className: 'pfp-level' }, search.results.map(fileRow)),
          ]);
        }
      } else if (matches !== null) {
        const rootLevel = levels[root];
        if (rootLevel === undefined || rootLevel.kind === 'loading') {
          body = h('p', { className: 'pfp-note' }, tr('loading'));
        } else if (rootLevel.kind === 'failed') {
          body = h('p', { className: 'pfp-note pfp-note-error' }, failureText(tr, rootLevel.error));
        } else if (matches.length === 0) {
          body = h('p', { className: 'pfp-note' }, tr('noMatch'));
        } else {
          body = h('ul', { className: 'pfp-level' }, matches.map(fileRow));
        }
      } else {
        body = h(TreeLevel, {
          path: root,
          levels: levels,
          expanded: expanded,
          tr: tr,
          tagOf: tagOf,
          tagEditor: tagEditor,
          onToggle: toggleDirectory,
          onTagToggle: toggleTagEditor,
          onTagSet: writeTag,
          onTagClear: clearTag,
          onInsert: insertPath,
          onInsertDir: insertFolder,
          onView: viewFile,
          onDragStart: onDragStart,
          onDragEnd: onDragEnd,
          isPinned: isPinned,
          onPin: togglePin,
          highlight: highlightOf,
          isSelected: isSelected,
          onSelect: selectRow,
          onContextMenu: openMenu,
          sortMode: settings.sort,
          markedOnly: settings.markedOnly === true,
          onExpand: expandDirectory,
        });
      }

      // 快速访问：当前对话自己的一套（或所有对话共用的那一套）。
      const pinsSection = h('div', { key: 'pins', className: 'pfp-pins', 'data-pfp-pins': '1' }, [
        h('div', { key: 'head', className: 'pfp-pinsHead' }, [
          h('button', {
            key: 'toggle',
            type: 'button',
            className: 'pfp-iconBtn',
            title: pinsCollapsed ? tr('pins.expand') : tr('pins.collapse'),
            'aria-expanded': pinsCollapsed !== true,
            'data-pfp-pins-toggle': '1',
            onClick: togglePinsCollapsed,
          }, h(CaretGlyph, { open: pinsCollapsed !== true })),
          h('span', { key: 'label', title: tr('pin.localOnly') }, tr('pin.section')),
          h('span', { key: 'count', title: shared ? tr('pins.scopeGlobal') : tr('pin.localOnly') }, '· ' + pinsShown.length),
          h('button', {
            key: 'scope',
            type: 'button',
            className: 'pfp-pinScope',
            title: shared ? tr('pins.scopeGlobal') : tr('pins.scopeLocal'),
            'data-pfp-pins-scope': shared ? 'global' : 'local',
            onClick: toggleSharedPins,
          }, shared ? tr('pins.scopeShortGlobal') : tr('pins.scopeShortLocal')),
          h('div', { key: 'actions', className: 'pfp-pinsActions' }, [
            h('button', {
              key: 'export',
              type: 'button',
              className: 'pfp-iconBtn',
              title: tr('pins.export'),
              'aria-label': tr('pins.export'),
              'data-pfp-pins-export': '1',
              onClick: exportPins,
            }, h(DownloadGlyph)),
            h('button', {
              key: 'import',
              type: 'button',
              className: 'pfp-iconBtn',
              title: tr('pins.import'),
              'aria-label': tr('pins.import'),
              'data-pfp-pins-import': '1',
              onClick: () => {
                const node = importRef.current;
                if (node !== null && node !== undefined) node.click();
              },
            }, h(UploadGlyph)),
            h('input', {
              key: 'file',
              ref: importRef,
              type: 'file',
              accept: 'application/json,.json',
              style: { display: 'none' },
              'data-pfp-pins-file': '1',
              onChange: importPins,
            }),
          ]),
        ]),
        pinsCollapsed
          ? null
          : pinsShown.length === 0
            ? h('p', { key: 'empty', className: 'pfp-note', style: { padding: '2px 0' } }, tr('pin.empty'))
            : h('ul', { key: 'list', className: 'pfp-pinList' }, pinsShown.map((pin, index) => {
              const name = pin.path.split('/').pop();
              const identity = pinKey(pin);
              const itemClass = 'pfp-pinItem'
                + (pinDrag !== null && pinDrag.from === index ? ' pfp-pinItem-dragging' : '')
                + (pinDrag !== null && pinDrag.over === index && pinDrag.from !== index ? ' pfp-pinItem-drop' : '');
              return h('li', {
                key: identity,
                className: itemClass,
                draggable: true,
                'data-pfp-pin-index': String(index),
                onDragStart: (event) => {
                  if (event !== undefined && event.dataTransfer !== undefined) {
                    try {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', pin.path);
                    } catch (error) {
                      /* 忽略 */
                    }
                  }
                  setPinDrag({ from: index, over: index });
                },
                onDragOver: (event) => {
                  if (event !== undefined && typeof event.preventDefault === 'function') event.preventDefault();
                  if (pinDrag !== null && pinDrag.over !== index) setPinDrag({ from: pinDrag.from, over: index });
                },
                onDragEnd: () => setPinDrag(null),
                onDrop: (event) => {
                  if (event !== undefined && typeof event.preventDefault === 'function') event.preventDefault();
                  if (pinDrag !== null) movePins(pinDrag.from, index);
                  setPinDrag(null);
                },
              }, [
                h('span', { key: 'grip', className: 'pfp-pinGrip' }, h(GripGlyph)),
                h('button', {
                  key: 'main',
                  type: 'button',
                  className: 'pfp-pinMain',
                  title: pin.kind === 'directory' ? tr('pin.jumpHint') : pin.path,
                  'data-pfp-pin-open': identity,
                  onClick: () => openPin(pin),
                }, [
                  pin.kind === 'directory'
                    ? h(FolderGlyph, { key: 'icon', color: (tagOf(joinPath(root, pin.path)) || {}).color })
                    : h(FileGlyph, { key: 'icon', color: fileKindOf(pin.path).color }),
                  h('span', { key: 'name', className: 'pfp-pinName' }, name),
                  h('span', { key: 'path', className: 'pfp-pinPath' }, pin.path),
                ]),
                h('button', {
                  key: 'remove',
                  type: 'button',
                  className: 'pfp-pinRemove',
                  title: tr('pin.unpin'),
                  'aria-label': tr('pin.unpin'),
                  'data-pfp-pin-remove': identity,
                  onClick: (event) => {
                    event.stopPropagation();
                    removePin(pin);
                  },
                }, '×'),
              ]);
            })),
      ]);

      // 最近使用：默认收起，点开就是最近用过的目录 / 文件。
      const recentSection = recent.length === 0 ? null : h('div', {
        key: 'recent',
        className: 'pfp-section',
        'data-pfp-recent': '1',
      }, [
        h('div', { key: 'head', className: 'pfp-sectionHead' }, [
          h('button', {
            key: 'toggle',
            type: 'button',
            className: 'pfp-iconBtn',
            title: recentCollapsed ? tr('pins.expand') : tr('pins.collapse'),
            'aria-expanded': recentCollapsed !== true,
            'data-pfp-recent-toggle': '1',
            onClick: toggleRecentCollapsed,
          }, h(CaretGlyph, { open: recentCollapsed !== true })),
          h('span', { key: 'label' }, tr('recent.section')),
          h('span', { key: 'count' }, '· ' + recent.length),
        ]),
        recentCollapsed
          ? null
          : h('ul', { key: 'list', className: 'pfp-pinList' }, recent.map((item) => h('li', {
            key: item.path,
            className: 'pfp-pinItem',
          }, h('button', {
            key: 'main',
            type: 'button',
            className: 'pfp-pinMain',
            title: item.path,
            'data-pfp-recent-open': item.path,
            onClick: () => {
              const absolute = joinPath(root, item.path);
              if (item.kind === 'directory') openPin(item);
              else insertPath(absolute);
            },
          }, [
            item.kind === 'directory'
              ? h(FolderGlyph, { key: 'icon', color: (tagOf(joinPath(root, item.path)) || {}).color })
              : h(FileGlyph, { key: 'icon', color: fileKindOf(item.path).color }),
            h('span', { key: 'name', className: 'pfp-pinName' }, item.path.split('/').pop()),
            h('span', { key: 'path', className: 'pfp-pinPath' }, item.path),
          ])))),
      ]);

      // 面板内预览：读一段文本，不离开右栏。
      const previewPane = preview === null ? null : h('div', {
        key: 'preview',
        className: 'pfp-preview',
        'data-pfp-preview': '1',
      }, [
        h('div', { key: 'head', className: 'pfp-previewHead' }, [
          h('span', { key: 'name', className: 'pfp-previewName', title: preview.path },
            relativeTo(root, preview.path)),
          preview.kind === 'ready'
            ? h('span', { key: 'lines', className: 'pfp-pinScope' }, tr('preview.lines', { n: preview.lines }))
            : null,
          h('button', {
            key: 'tab',
            type: 'button',
            className: 'pfp-iconBtn',
            title: tr('preview.openTab'),
            'aria-label': tr('preview.openTab'),
            onClick: () => viewFile(preview.path),
          }, h(EyeGlyph)),
          h('button', {
            key: 'close',
            type: 'button',
            className: 'pfp-iconBtn',
            title: tr('preview.close'),
            'aria-label': tr('preview.close'),
            'data-pfp-preview-close': '1',
            onClick: closePreview,
          }, '×'),
        ]),
        preview.kind === 'loading'
          ? h('p', { key: 'loading', className: 'pfp-previewNote' }, tr('preview.loading'))
          : preview.kind === 'failed'
            ? h('p', { key: 'failed', className: 'pfp-previewNote' }, tr('preview.failed'))
            : h(React.Fragment, null, [
              h('pre', { key: 'text', className: 'pfp-previewBody' }, preview.text),
              preview.eof === true
                ? null
                : h('p', { key: 'trunc', className: 'pfp-previewNote' }, tr('preview.truncated', { n: preview.lines })),
            ]),
      ]);

      const selectionBar = selected.length === 0 ? null : h('div', {
        key: 'sel',
        className: 'pfp-selbar',
        'data-pfp-selection': String(selected.length),
      }, [
        h('span', { key: 'text', className: 'pfp-selbarText' }, tr('selected.n', { n: selected.length })),
        h('button', {
          key: 'insert',
          type: 'button',
          className: 'pfp-menuBtn pfp-menuBtn-primary',
          'data-pfp-insert-selected': '1',
          onClick: insertSelected,
        }, tr('selected.insert')),
        h('button', {
          key: 'clear',
          type: 'button',
          className: 'pfp-menuBtn',
          'data-pfp-clear-selected': '1',
          onClick: () => setSelected([]),
        }, tr('selected.clear')),
      ]);

      const menuNode = menu === null ? null : h('div', {
        key: 'menu',
        className: 'pfp-menu',
        'data-pfp-menu': '1',
        style: { left: String(menu.x) + 'px', top: String(menu.y) + 'px' },
      }, [
        h('div', { key: 'path', className: 'pfp-menuItem-path', title: menu.path }, relativeTo(root, menu.path)),
        h('div', { key: 'sep1', className: 'pfp-menuSep' }),
        h('button', {
          key: 'insert',
          type: 'button',
          className: 'pfp-menuItem',
          'data-pfp-menu-item': 'insert',
          onClick: () => { setMenu(null); if (menu.kind === 'directory') insertFolder(menu.path); else insertPath(menu.path); },
        }, menu.kind === 'directory' ? tr('menu.insertDir') : tr('menu.insert')),
        h('button', {
          key: 'view',
          type: 'button',
          className: 'pfp-menuItem',
          'data-pfp-menu-item': 'view',
          onClick: () => { setMenu(null); viewFile(menu.path); },
        }, tr('menu.view')),
        typeof readFile === 'function' && fileKindOf(menu.path).id !== 'image'
          ? h('button', {
            key: 'inline',
            type: 'button',
            className: 'pfp-menuItem',
            'data-pfp-menu-item': 'inline',
            onClick: () => { setMenu(null); openInline(menu.path); },
          }, tr('menu.inline'))
          : null,
        h('div', { key: 'sep2', className: 'pfp-menuSep' }),
        h('button', {
          key: 'pin',
          type: 'button',
          className: 'pfp-menuItem',
          'data-pfp-menu-item': 'pin',
          onClick: () => { setMenu(null); togglePin(menu.path, menu.kind); },
        }, isPinned(menu.path) ? tr('menu.unpin') : tr('menu.pin')),
        h('button', {
          key: 'rel',
          type: 'button',
          className: 'pfp-menuItem',
          'data-pfp-menu-item': 'copyRel',
          onClick: () => { setMenu(null); copyRelative(menu.path, menu.kind); },
        }, tr('menu.copyRel')),
        h('button', {
          key: 'abs',
          type: 'button',
          className: 'pfp-menuItem',
          'data-pfp-menu-item': 'copyAbs',
          onClick: () => { setMenu(null); copyAbsolute(menu.path); },
        }, tr('menu.copyAbs')),
        h('button', {
          key: 'md',
          type: 'button',
          className: 'pfp-menuItem',
          'data-pfp-menu-item': 'copyMd',
          onClick: () => { setMenu(null); copyMarkdown(menu.path, menu.kind); },
        }, tr('menu.copyMd')),
        typeof openPath === 'function'
          ? h('button', {
            key: 'reveal',
            type: 'button',
            className: 'pfp-menuItem',
            'data-pfp-menu-item': 'reveal',
            onClick: () => { setMenu(null); revealPath(menu.path); },
          }, tr('menu.reveal'))
          : null,
        h('button', {
          key: 'obsidian',
          type: 'button',
          className: 'pfp-menuItem',
          'data-pfp-menu-item': 'obsidian',
          onClick: () => {
            setMenu(null);
            launchObsidian(menu.path, menu.kind).catch(() => {
              setStatus({ message: tr('obsidian.failed'), error: true });
            });
          },
        }, tr('menu.obsidian')),
        menu.kind === 'directory'
          ? h('button', {
            key: 'tag',
            type: 'button',
            className: 'pfp-menuItem',
            'data-pfp-menu-item': 'tag',
            onClick: () => { setMenu(null); toggleTagEditor(menu.path); },
          }, tr('menu.tag'))
          : null,
      ]);

      const message = dragging
        ? tr('hint.dragging')
        : status === null
          ? tr('hint.drag')
          : status.error === true
            ? ''
            : status.message;

      return h('div', {
        className: dense ? 'pfp-root pfp-dense' : 'pfp-root',
        'data-project-files-root': root,
      }, [
        header,
        toolbar,
        errorBar,
        pinsSection,
        recentSection,
        h('div', {
          key: 'body',
          className: 'pfp-body',
          ref: bodyRef,
          onScroll: onBodyScroll,
          onClick: (event) => {
            // 点空白处取消选中（行上自己会停掉冒泡）。
            if (event !== undefined && event.target === event.currentTarget && selected.length > 0) setSelected([]);
          },
        }, body),
        previewPane,
        selectionBar,
        h('div', { key: 'foot', className: 'pfp-foot' }, [
          h('span', { key: 'hint', className: 'pfp-footMsg' }, message),
          h('span', { key: 'count', className: 'pfp-footMsg', style: { flex: 'none', opacity: 0.75 } },
            tr('count', { n: loadedFiles.length })),
        ]),
        menuNode,
      ]);
    }

    /** 页签标题：图标 + 页签名。 */
    function ProjectFilesTitle(props) {
      const { tab } = props.useTabInfo();
      return h(React.Fragment, null, h(TabGlyph, { size: 16, className: 'pfp-titleIcon' }), tab.title);
    }

    /**
     * 页签类型的注册信息：一个按 kind 打开、不认领任何资源地址的页面类型；
     * 带一个引导卡条目，好让「开始」页也能打开它。
     * extension 是「产品外部贡献的类型」所在的优先级区间。
     */
    function projectFilesDefinition(t) {
      return {
        id: TAB_ID,
        kind: TAB_KIND,
        priority: 'extension',
        title: () => t('type.label'),
        guide: [{
          id: 'project-files',
          // 「开始」页里按 order 升序排；内置「工作区」卡是 10，这里取 0 让本插件排在第一个。
          order: 0,
          title: () => t('guide.title'),
          description: () => t('guide.description'),
          icon: TabGlyph,
        }],
      };
    }

    return {
      inject: ['slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'remote', 'remote.workspaceFiles', 'remote.session'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: zh, en: en }), 'project-file-picker: dictionaries');
        ctx.effect(() => {
          const update = () => {
            try {
              const snapshot = ctx.locale.getLocale();
              const id = String(
                snapshot !== undefined && snapshot !== null
                  ? snapshot.id !== undefined ? snapshot.id : snapshot.locale !== undefined ? snapshot.locale : ''
                  : '',
              ).toLowerCase();
              activeDictionary = id.indexOf('zh') === 0 ? zh : en;
            } catch (error) {
              activeDictionary = en;
            }
          };
          update();
          return ctx.locale.subscribe(update);
        }, 'project-file-picker: locale dictionary');

        ctx.effect(() => {
          if (typeof document === 'undefined') return undefined;
          const style = document.createElement('style');
          style.setAttribute('data-project-file-picker-css', '1');
          style.textContent = CSS;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'project-file-picker: styles');

        const remote = ctx.remote;
        const listDirectory = (sessionId, path, signal) => remote.workspaceFiles.list(sessionId, path, signal);
        // 面板内预览要读一段文件文本；这个能力在带 workspace files 的 profile 里才有。
        const readFile = remote.workspaceFiles !== undefined && remote.workspaceFiles !== null
          && typeof remote.workspaceFiles.read === 'function'
          ? (sessionId, path, range, signal) => remote.workspaceFiles.read(sessionId, path, range, signal)
          : undefined;
        // 在系统文件管理器里定位；没有这个能力的 profile 就不显示菜单项。
        const openPath = remote.session !== undefined && remote.session !== null
          && typeof remote.session.openWorkspacePath === 'function'
          ? (request, signal) => remote.session.openWorkspacePath(request, signal)
          : undefined;

        ctx.effect(() => ctx.sidebarRightTabs.register(
          projectFilesDefinition((key, params) => translate(key, params)),
        ), 'project-file-picker: tab type');

        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: TAB_ID,
          locale: NS,
        }, (props) => {
          // 只有这个 profile 提供的能力才覆盖进去，缺的能力保持 undefined。
          const extra = { listDirectory: listDirectory };
          if (readFile !== undefined) extra.readFile = readFile;
          if (openPath !== undefined) extra.openPath = openPath;
          return h(ProjectFilesBody, Object.assign({}, props, extra));
        })), 'project-file-picker: tab body');

        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab.title',
          key: TAB_ID,
        }, ProjectFilesTitle)), 'project-file-picker: tab title');

        // First run on this profile: reveal the tab once so the new panel is
        // visible without hunting; later sessions keep the native guide card.
        ctx.effect(() => {
          let timer;
          try {
            if (window.localStorage.getItem(SEED_KEY) === '1') return undefined;
          } catch (error) {
            return undefined;
          }
          timer = setTimeout(() => {
            try {
              ctx.sidebarRight.openTab(TAB_KIND);
              try {
                window.localStorage.setItem(SEED_KEY, '1');
              } catch (error) {
                /* 存储被禁用只是意味着下次还会自动展开一次 */
              }
            } catch (error) {
              // 当前还没有会话页面：先用引导卡作为入口。
            }
          }, 900);
          return () => clearTimeout(timer);
        }, 'project-file-picker: first run reveal');
      },
    };
  },
});
