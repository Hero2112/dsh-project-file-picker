# 安装 项目文件坞

DSH Web GUI 的右栏插件：浏览会话工作目录、双击插入引用、右键菜单、面板内预览、搜索、收藏。

## 1. 下载

到 [Releases](https://github.com/Hero2112/dsh-project-file-picker/releases) 下最新的
`project-file-picker-X.Y.Z.zip`，解压得到一个 `project-file-picker` 文件夹，放固定位置，例如：

```
D:\dsh-plugins\project-file-picker
```

## 2. 让 DSH 装上

对 Agent 说：

> 安装本地插件包，包目录是 `D:\dsh-plugins\project-file-picker`

装完**完全退出 DSH 再打开**（换安装路径必须完全重启，只刷新页面图标会不见）。

## 3. 用

右侧边栏的「项目文件坞」页签；第一次装会自动展开一次，之后从右栏「开始」页的第一张卡进入。

- 双击文件 = 插入 `@路径`；双击文件夹 = 插入 `@路径/`
- 右键 = 预览、复制路径、收藏、在文件管理器中显示
- 输入框右边的放大镜 = 搜索整个项目

## 升级

新 zip 解压到带版本号的新目录，让 Agent 先卸载旧的、再装新目录，然后完全重启 DSH。

## 卸载

让 Agent 卸载这个插件（包名 `@local/project-file-picker`）。收藏、标记、设置存在浏览器本地，卸载不删。
