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
    /** 所有文件地址共用的协议与类型前缀。 */
    const FILE_ADDRESS_PREFIX = 'dsh-resource://file/';

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
      'hint.drag': '拖拽文件或文件夹进输入框；点文件插入、点文件夹展开',
      'hint.dragging': '松开鼠标，放进输入框',
      noWorkspace: '这个会话还没有工作目录',
      loading: '正在读取…',
      empty: '空目录',
      truncated: '条目太多，只显示了一部分',
      'noMatch': '没有匹配的文件',
      reload: '重新读取',
      filter: '筛选已加载的文件…',
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
      'hint.drag': 'Drag a file or folder into the message; click a file to insert it, a folder to open it',
      'hint.dragging': 'Release to drop it into the message',
      noWorkspace: 'This session has no workspace directory',
      loading: 'Reading…',
      empty: 'Empty directory',
      truncated: 'Too many entries, only some are shown',
      'noMatch': 'No matching files',
      reload: 'Reload',
      filter: 'Filter the loaded files…',
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
      '.pfp-titleIcon{flex:none;color:var(--dsw-alias-label-tertiary)}',
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

    function sortEntries(entries) {
      return entries.slice().sort((left, right) => {
        const group = Number(right.type === 'directory') - Number(left.type === 'directory');
        return group !== 0 ? group : collator.compare(left.name, right.name);
      });
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

    /** 文件图标。 */
    function FileGlyph(props) {
      const size = props !== undefined && props.size !== undefined ? props.size : 15;
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': true,
        className: 'pfp-icon',
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

    /** 一个文件行：点击插入引用，眼睛按钮打开产品自带的预览。 */
    function FileRow(props) {
      const { path, label, title, tr, onInsert, onView, onDragStart, onDragEnd } = props;
      return h('div', { className: 'pfp-row pfp-rowFile' }, [
        h('div', {
          key: 'main',
          role: 'button',
          tabIndex: 0,
          draggable: true,
          className: 'pfp-rowMain',
          title: title,
          onClick: () => onInsert(path),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onInsert(path);
            }
          },
          onDragStart: (event) => onDragStart(event, path, 'file'),
          onDragEnd: () => onDragEnd(),
        }, [
          h(FileGlyph, { key: 'icon' }),
          h('span', { key: 'name', className: 'pfp-name' }, label),
        ]),
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
     */
    function TreeLevel(props) {
      const {
        path, levels, expanded, tr, tagOf, tagEditor, onToggle, onTagToggle, onTagSet, onTagClear,
        onInsert, onInsertDir, onView, onDragStart, onDragEnd,
      } = props;
      const level = levels[path];
      if (level === undefined || level.kind === 'loading') {
        return h('p', { className: 'pfp-note' }, tr('loading'));
      }
      if (level.kind === 'failed') {
        return h('p', { className: 'pfp-note pfp-note-error' }, failureText(tr, level.error));
      }
      const entries = sortEntries(level.entries);
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
            onInsert: onInsert,
            onView: onView,
            onDragStart: onDragStart,
            onDragEnd: onDragEnd,
          })));
          continue;
        }
        const isOpen = expanded.indexOf(childPath) >= 0;
        const tag = tagOf(childPath);
        const color = tag !== undefined && tag.color !== undefined ? tag.color : undefined;
        const emoji = tag !== undefined && tag.emoji !== undefined ? tag.emoji : undefined;
        const editing = tagEditor === childPath;
        rows.push(h('li', { key: entry.name, className: 'pfp-item' }, [
          h('div', { key: 'row', className: 'pfp-row' }, [
            h('div', {
              key: 'main',
              role: 'button',
              tabIndex: 0,
              draggable: true,
              className: 'pfp-rowMain',
              title: childPath,
              'aria-expanded': isOpen,
              onClick: () => onToggle(childPath),
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
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
      const { tab } = props.useTabInfo();
      const draft = props.useInput((input) => (input !== undefined && input !== null ? input.draft : ''));

      const cwd = useSessions((sessions) => {
        const byId = sessions !== undefined && sessions !== null ? sessions.byId : undefined;
        const summary = byId !== undefined && byId !== null ? byId[sessionId] : undefined;
        return summary !== undefined && summary !== null ? summary.cwd : undefined;
      });
      const root = cwd === undefined || cwd === null ? undefined : posixOf(cwd);

      const [expanded, setExpanded] = useState([]);
      const [levels, setLevels] = useState({});
      const [filter, setFilter] = useState('');
      const [status, setStatus] = useState(null);
      const [dragging, setDragging] = useState(false);
      const [tags, setTags] = useState(() => readTags());
      const [tagEditor, setTagEditor] = useState(null);

      const controllers = useRef(new Map());
      const listApi = useRef(listDirectory);
      const inputRef = useRef(inputActions);
      const rootRef = useRef(root);
      const reloadRef = useRef(null);
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

      // 工作目录变了就重开一棵树。
      useEffect(() => {
        abortAll();
        setLevels({});
        setFilter('');
        setStatus(null);
        setTagEditor(null);
        setExpanded(root === undefined ? [] : [root]);
      }, [root]);

      useEffect(() => {
        if (root === undefined) return;
        for (const path of expanded) {
          if (levels[path] === undefined) load(path);
        }
      }, [root, expanded, levels]);

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
            found.push({ path: joinPath(path, entry.name), name: entry.name });
          }
        }
        return found.sort((left, right) => collator.compare(left.path, right.path));
      }, [levels]);

      const matches = useMemo(() => {
        const needle = filter.trim().toLowerCase();
        if (needle === '') return null;
        return loadedFiles.filter((file) => file.path.toLowerCase().indexOf(needle) >= 0).slice(0, 300);
      }, [filter, loadedFiles]);

      if (root === undefined) {
        return h('div', { className: 'pfp-root' }, [
          h('div', { key: 'header', className: 'pfp-header' },
            h('span', { className: 'pfp-path' }, '—')),
          h('div', { key: 'status', className: 'pfp-status' },
            h('p', { className: 'pfp-statusLine' }, tr('noWorkspace'))),
        ]);
      }

      const header = h('div', { key: 'header', className: 'pfp-header' }, [
        h('span', { key: 'path', className: 'pfp-path', title: root }, root),
        h('button', {
          key: 'reload',
          type: 'button',
          className: 'pfp-tool',
          title: tr('reload'),
          'aria-label': tr('reload'),
          onClick: reload,
        }, h(ReloadGlyph)),
      ]);

      const filterRow = h('div', { key: 'filter', className: 'pfp-filterRow' }, h('input', {
        type: 'text',
        className: 'pfp-filter',
        placeholder: tr('filter'),
        value: filter,
        spellCheck: false,
        'aria-label': tr('filter'),
        onChange: (event) => setFilter(event.target.value),
      }));

      let body;
      if (matches !== null) {
        const rootLevel = levels[root];
        if (rootLevel === undefined || rootLevel.kind === 'loading') {
          body = h('p', { className: 'pfp-note' }, tr('loading'));
        } else if (rootLevel.kind === 'failed') {
          body = h('p', { className: 'pfp-note pfp-note-error' }, failureText(tr, rootLevel.error));
        } else if (matches.length === 0) {
          body = h('p', { className: 'pfp-note' }, tr('noMatch'));
        } else {
          body = h('ul', { className: 'pfp-level' }, matches.map((file) => h('li', {
            key: file.path,
            className: 'pfp-item',
          }, h(FileRow, {
            path: file.path,
            label: relativeTo(root, file.path),
            title: file.path,
            tr: tr,
            onInsert: insertPath,
            onView: viewFile,
            onDragStart: onDragStart,
            onDragEnd: onDragEnd,
          }))));
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
        });
      }

      const message = dragging
        ? tr('hint.dragging')
        : status === null
          ? tr('hint.drag')
          : status.message;
      const failed = status !== null && status.error === true && !dragging;

      return h('div', { className: 'pfp-root', 'data-project-files-root': root }, [
        header,
        filterRow,
        h('div', { key: 'body', className: 'pfp-body' }, body),
        h('div', { key: 'foot', className: 'pfp-foot' }, [
          h('span', {
            key: 'hint',
            className: failed ? 'pfp-footMsg pfp-footMsg-error' : 'pfp-footMsg',
          }, message),
          h('span', { key: 'count', className: 'pfp-footMsg', style: { flex: 'none', opacity: 0.75 } },
            tr('count', { n: loadedFiles.length })),
        ]),
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
      inject: ['slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'remote', 'remote.workspaceFiles'],
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

        ctx.effect(() => ctx.sidebarRightTabs.register(
          projectFilesDefinition((key, params) => translate(key, params)),
        ), 'project-file-picker: tab type');

        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: TAB_ID,
          locale: NS,
        }, (props) => h(ProjectFilesBody, Object.assign({}, props, { listDirectory: listDirectory })))), 'project-file-picker: tab body');

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
