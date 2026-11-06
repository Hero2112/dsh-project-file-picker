# project-file-picker 版本记录

> 仓库：https://github.com/Hero2112/dsh-project-file-picker （私有）

插件：`@local/project-file-picker` · 当前版本 **1.3.0** · 详细说明见 [`versions/`](versions/)

| 版本 | 日期 | 类型 | 一句话 |
|---|---|---|---|
| [1.3.0](versions/v1.3.0.md) | 2026-11-06 | 新功能 | 「固定」改叫「收藏」并升级成**快速访问**：点收藏的文件夹立刻展开祖先链、并行读沿途各层、自动滚到位并闪一下高亮 |
| [1.2.0](versions/v1.2.0.md) | 2026-11-04 | 行为调整 | 固定项改成**按对话各存一套**，在哪个对话固定就只出现在那个对话，互不相关；旧数据自动迁到当前对话 |
| [1.1.0](versions/v1.1.0.md) | 2026-11-04 | 新功能 | 文件和文件夹可以「固定」到列表顶部；固定的深目录刷新/切会话后自动展开到那一层，点一下直接跳过去 |
| [1.0.2](versions/v1.0.2.md) | 2026-11-04 | 体验改进 | 「开始」页里本插件排第一，内置「工作区」卡靠后；代码注释改为中文 |
| [1.0.1](versions/v1.0.1.md) | 2026-11-03 | 体验改进 | 右侧页签改名「项目文件坞」，图标换成「文件夹落进对话框」 |
| [1.0.0](versions/v1.0.0.md) | 2026-11-03 | 初版 | 右栏项目文件坞：浏览工作目录、点/拖插入文件与文件夹、原生预览看内容、文件夹颜色+emoji 标记 |

## 归档位置

每个版本都有一份**冻结快照**（完整可安装）和一份分发包；快照发布后不再改动。

| 版本 | 冻结快照（当前安装的是 1.3.0） | 分发包 | 版本文档 |
|---|---|---|---|
| 1.3.0 | `releases/v1.3.0/` | `dist/project-file-picker-1.3.0.zip`（25,729 B，SHA256 `DF10C3BD…DB738`，顶层为 `project-file-picker/`） | [versions/v1.3.0.md](versions/v1.3.0.md) |
| 1.2.0 | `releases/v1.2.0/` | `dist/project-file-picker-1.2.0.zip`（24,774 B，SHA256 `D009AF8D…93C59`，顶层为 `project-file-picker/`） | [versions/v1.2.0.md](versions/v1.2.0.md) |
| 1.1.0 | `releases/v1.1.0/` | `dist/project-file-picker-1.1.0.zip`（23,407 B，SHA256 `39EA0AC9…B5FD46`，顶层为 `project-file-picker/`） | [versions/v1.1.0.md](versions/v1.1.0.md) |
| 1.0.2 | `releases/v1.0.2/` | `dist/project-file-picker-1.0.2.zip`（20,101 B，SHA256 `29B6CDA2…CC88FA`，顶层为 `project-file-picker/`） | [versions/v1.0.2.md](versions/v1.0.2.md) |
| 1.0.1 | `releases/v1.0.1/` | `dist/project-file-picker-1.0.1.zip`（19,236 B，SHA256 `89FD920C…E2214`，顶层为 `project-file-picker/`） | [versions/v1.0.1.md](versions/v1.0.1.md) |
| 1.0.0 | `releases/v1.0.0/` | `dist/project-file-picker-1.0.0.zip`（19,140 B，SHA256 `697BFD8B…B38EC`，顶层为 `project-file-picker/`） | [versions/v1.0.0.md](versions/v1.0.0.md) |

## 未发布

_（待填写。新改动先记在 `dev/` 里，发版时归入具体版本号。）_

下一版计划见 [versions/v1.3.0.md](versions/v1.3.0.md) 的「下一版计划」。

## 迁移说明

| 存储键 | 引入版本 | 说明 |
|---|---|---|
| `dsh.project-file-picker.tags.v1` | 1.0.0 | 文件夹标记（颜色 + emoji），按「工作目录 + 相对路径」记录 |
| `dsh.project-file-picker.seeded` | 1.0.0 | 首次自动展开右栏只做一次 |
| `dsh.project-file-picker.pins.v1` | 1.1.0 | 固定项（当时的叫法），按工作目录分组。1.2.0 起不再写入；首次打开时属于当前工作目录的那组会归到当前对话，并从旧键删掉 |
| `dsh.project-file-picker.pins.v3` | 1.2.0 | 收藏（快速访问），按对话（会话 id）分组，每个对话一套 |

无旧版本可迁移。标记只存在浏览器本地，不会随插件走。
