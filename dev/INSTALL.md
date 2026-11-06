# 安装到另一台电脑

这是一个**纯前端**的 DSH 插件，没有依赖、不需要 `pnpm install`、也不需要构建。

## 目录结构

```
project-file-picker/
├── package.json          插件清单（name: @local/project-file-picker）
├── cordis.patch.yml      插入一行 Loader 配置
├── index.js              Host 半（空实现，只为占位）
├── client.js             全部界面逻辑（右栏页签 + 文件树 + 预览 + 文件夹标记）
├── icon.svg              插件图标
├── locale/zh.json        插件列表里的名称与描述（中文）
├── locale/en.json        插件列表里的名称与描述（英文）
├── README.md             功能说明
└── INSTALL.md            本文件
```

## 三步装好

1. **解压**，把整个 `project-file-picker` 文件夹拷到目标电脑上，建议放：

   ```
   <你的工作区目录>\插件\project-file-picker\releases\v1.6.0
   ```

   放别处也能用，只要路径固定、之后别移动。

2. **让 Agent 安装**：在 DeepSeek Harness 里对 Agent 说

   > 安装本地插件包，包目录是 `<上面那个绝对路径>`

   Agent 会调用 `plugin_manager install_bundle`（target = 该目录的绝对路径）。
   成功标志：返回结果里 `application: "applied"`、`warnings: []`。

3. **加载界面**：
   - 首次安装后右侧边栏会自动展开一次并打开「项目文件」页签；没有的话按 `Ctrl + F5` 刷新页面。
   - 如果右栏没有出现这个页签，或点开是空面板：**完全退出 DSH 再重新打开**
     （客户端模块按"代次"缓存，换过安装路径时必须重启才加载新的一份）。

## 验证是否装好

- 右侧边栏页签栏多出「项目文件」，点开是文件树 + 顶部工作目录路径 + 底部提示条。
- 悬停文件行出现眼睛按钮，点击会打开产品自带的预览页签。
- 悬停文件夹行出现「插入此文件夹」和调色板两个按钮。
- 点文件行 → 输入框出现 `@相对路径`。

## 换电脑后标记是空的（正常）

文件夹颜色与表情存在**浏览器 localStorage**（键 `dsh.project-file-picker.tags.v1`），不随插件走。
想一起搬：在新电脑面版按 F12，把 `localStorage['dsh.project-file-picker.tags.v1']` 的值导出/导入即可（纯 JSON）。

## 兼容性

- 依赖 DSH 的右侧边栏页签体系（`sidebarRightTabs` / `sidebarRight` 服务、`sidebar.right.pane.tab` 插槽）
  与 `workspaceFiles` 远程读取。DSH 版本太老时可能装不上或页签空白 —— 升级 DSH 即可。
- 预览用的是产品自带的文件预览页签（`dsh-resource://file/...` 地址），不是插件自己实现的渲染。

## 卸载

让 Agent 调用 `plugin_manager remove_bundle`（target = `@local/project-file-picker`），然后删掉那个文件夹即可。
