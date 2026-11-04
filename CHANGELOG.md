# project-file-picker 版本记录

> 仓库：https://github.com/Hero2112/dsh-project-file-picker （私有）

插件：`@local/project-file-picker` · 当前版本 **1.0.1** · 详细说明见 [`versions/`](versions/)

| 版本 | 日期 | 类型 | 一句话 |
|---|---|---|---|
| [1.0.1](versions/v1.0.1.md) | 2026-11-03 | 体验改进 | 右侧页签改名「项目文件坞」，图标换成"文件夹落进对话框" |
| [1.0.0](versions/v1.0.0.md) | 2026-11-03 | 初版 | 右栏项目文件坞：浏览工作目录、点/拖插入文件与文件夹、原生预览看内容、文件夹颜色+emoji 标记 |

## 归档位置

每个版本都有一份**冻结快照**（完整可安装）和一份分发包；快照发布后不再改动。

| 版本 | 冻结快照（当前安装的是 1.0.1） | 分发包 | 版本文档 |
|---|---|---|---|
| 1.0.1 | `releases/v1.0.1/` | `dist/project-file-picker-1.0.1.zip`（19,236 B，SHA256 `89FD920C…E2214`，顶层为 `project-file-picker/`） | [versions/v1.0.1.md](versions/v1.0.1.md) |
| 1.0.0 | `releases/v1.0.0/` | `dist/project-file-picker-1.0.0.zip`（19,140 B，SHA256 `697BFD8B…B38EC`，顶层为 `project-file-picker/`） | [versions/v1.0.0.md](versions/v1.0.0.md) |

## 未发布

- 代码注释统一改为中文（`dev/client.js`、`dev/index.js`），功能无变化，随下一版一起冻结
- 建立 GitHub 私有仓库 `dsh-project-file-picker`，插件目录即仓库根目录

下一版计划见 [versions/v1.0.0.md](versions/v1.0.0.md) 的「下一版计划」。

## 迁移说明

| 存储键 | 引入版本 | 说明 |
|---|---|---|
| `dsh.project-file-picker.tags.v1` | 1.0.0 | 文件夹标记（颜色 + emoji），按「工作目录 + 相对路径」记录 |
| `dsh.project-file-picker.seeded` | 1.0.0 | 首次自动展开右栏只做一次 |

无旧版本可迁移。标记只存在浏览器本地，不会随插件走。
