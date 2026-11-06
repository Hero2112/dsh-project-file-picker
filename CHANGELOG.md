# project-file-picker 版本记录

> 仓库：https://github.com/Hero2112/dsh-project-file-picker （私有）

插件：`@local/project-file-picker` · 当前版本 **1.6.0** · 详细说明见 [`versions/`](versions/)

| 版本 | 日期 | 类型 | 一句话 |
|---|---|---|---|
| [1.6.0](versions/v1.6.0.md) | 2026-11-06 | 新功能 | 「在 Obsidian 中打开」补上 Host 半：客户端 POST 本地路由，宿主用系统命令拉起 `obsidian://`，解决点了没反应 |
| [1.5.0](versions/v1.5.0.md) | 2026-11-06 | 新功能 | 右键菜单加「在 Obsidian 中打开」：文件用 `obsidian://open?path=` 直接定位，文件夹开到所在 vault |
| [1.4.1](versions/v1.4.1.md) | 2026-11-06 | 体验修复 | 双击文件夹不再把它折叠；Ctrl / Cmd 加选不再翻转展开状态 |
| [1.4.0](versions/v1.4.0.md) | 2026-11-06 | 新功能 | 单击选中/双击插入、多选批量插入、右键菜单、全项目搜索、面板内预览、最近使用、拖拽排序、收藏跨对话共享、行高/排序/只看标记、浏览位置记忆 |
| [1.3.0](versions/v1.3.0.md) | 2026-11-06 | 新功能 | 「固定」改叫「收藏」并升级成**快速访问**：点收藏的文件夹立刻展开祖先链、并行读沿途各层、自动滚到位并闪一下高亮 |
| [1.2.0](versions/v1.2.0.md) | 2026-11-04 | 行为调整 | 固定项改成**按对话各存一套**，在哪个对话固定就只出现在那个对话，互不相关；旧数据自动迁到当前对话 |
| [1.1.0](versions/v1.1.0.md) | 2026-11-04 | 新功能 | 文件和文件夹可以「固定」到列表顶部；固定的深目录刷新/切会话后自动展开到那一层，点一下直接跳过去 |
| [1.0.2](versions/v1.0.2.md) | 2026-11-04 | 体验改进 | 「开始」页里本插件排第一，内置「工作区」卡靠后；代码注释改为中文 |
| [1.0.1](versions/v1.0.1.md) | 2026-11-03 | 体验改进 | 右侧页签改名「项目文件坞」，图标换成「文件夹落进对话框」 |
| [1.0.0](versions/v1.0.0.md) | 2026-11-03 | 初版 | 右栏项目文件坞：浏览工作目录、点/拖插入文件与文件夹、原生预览看内容、文件夹颜色+emoji 标记 |

## 归档位置

每个版本都有一份**冻结快照**（完整可安装）和一份分发包；快照发布后不再改动。

| 版本 | 冻结快照（当前安装的是 1.6.0） | 分发包 | 版本文档 |
|---|---|---|---|
| 1.6.0 | `releases/v1.6.0/` | `dist/project-file-picker-1.6.0.zip`（45,115 B，SHA256 `A967968A…C323FD`，顶层为 `project-file-picker/`） | [versions/v1.6.0.md](versions/v1.6.0.md) |
| 1.5.0 | `releases/v1.5.0/` | `dist/project-file-picker-1.5.0.zip`（43,135 B，SHA256 `FD7B6073…0D8EB9`，顶层为 `project-file-picker/`） | [versions/v1.5.0.md](versions/v1.5.0.md) |
| 1.4.1 | `releases/v1.4.1/` | `dist/project-file-picker-1.4.1.zip`（41,790 B，SHA256 `A65873D9…10239`，顶层为 `project-file-picker/`） | [versions/v1.4.1.md](versions/v1.4.1.md) |
| 1.4.0 | `releases/v1.4.0/` | `dist/project-file-picker-1.4.0.zip`（41,528 B，SHA256 `BE2127E7…31CB0`，顶层为 `project-file-picker/`） | [versions/v1.4.0.md](versions/v1.4.0.md) |
| 1.3.0 | `releases/v1.3.0/` | `dist/project-file-picker-1.3.0.zip`（25,729 B，SHA256 `DF10C3BD…DB738`，顶层为 `project-file-picker/`） | [versions/v1.3.0.md](versions/v1.3.0.md) |
| 1.2.0 | `releases/v1.2.0/` | `dist/project-file-picker-1.2.0.zip`（24,774 B，SHA256 `D009AF8D…93C59`，顶层为 `project-file-picker/`） | [versions/v1.2.0.md](versions/v1.2.0.md) |
| 1.1.0 | `releases/v1.1.0/` | `dist/project-file-picker-1.1.0.zip`（23,407 B，SHA256 `39EA0AC9…B5FD46`，顶层为 `project-file-picker/`） | [versions/v1.1.0.md](versions/v1.1.0.md) |
| 1.0.2 | `releases/v1.0.2/` | `dist/project-file-picker-1.0.2.zip`（20,101 B，SHA256 `29B6CDA2…CC88FA`，顶层为 `project-file-picker/`） | [versions/v1.0.2.md](versions/v1.0.2.md) |
| 1.0.1 | `releases/v1.0.1/` | `dist/project-file-picker-1.0.1.zip`（19,236 B，SHA256 `89FD920C…E2214`，顶层为 `project-file-picker/`） | [versions/v1.0.1.md](versions/v1.0.1.md) |
| 1.0.0 | `releases/v1.0.0/` | `dist/project-file-picker-1.0.0.zip`（19,140 B，SHA256 `697BFD8B…B38EC`，顶层为 `project-file-picker/`） | [versions/v1.0.0.md](versions/v1.0.0.md) |

## 未发布

_（待填写。新改动先记在 `dev/` 里，发版时归入具体版本号。）_

下一版计划见 [versions/v1.6.0.md](versions/v1.6.0.md) 的「下一版计划」。

## 迁移说明

| 存储键 | 引入版本 | 说明 |
|---|---|---|
| `dsh.project-file-picker.tags.v1` | 1.0.0 | 文件夹标记（颜色 + emoji），按「工作目录 + 相对路径」记录 |
| `dsh.project-file-picker.seeded` | 1.0.0 | 首次自动展开右栏只做一次 |
| `dsh.project-file-picker.pins.v1` | 1.1.0 | 固定项（当时的叫法），按工作目录分组。1.2.0 起不再写入；首次打开时属于当前工作目录的那组会归到当前对话，并从旧键删掉 |
| `dsh.project-file-picker.pins.v3` | 1.2.0 | 收藏（快速访问），按对话（会话 id）分组；1.4.0 起切到「共用」时多一个 `*` 格子 |
| `dsh.project-file-picker.settings.v1` | 1.4.0 | 面板设置：行高、排序、只看标记、折叠状态、收藏是否共享 |
| `dsh.project-file-picker.view.v1` | 1.4.0 | 每个对话的浏览位置（展开 + 滚动） |
| `dsh.project-file-picker.recent.v1` | 1.4.0 | 每个对话的最近使用（最多 12 条） |

无旧版本可迁移。标记只存在浏览器本地，不会随插件走。
