/**
 * project-file-picker 插件的 Host 半。
 *
 * 1.6.1 起这个插件只做界面：浏览、插入、预览、收藏、标记全部在客户端完成，
 * 不再需要宿主能力，所以这里是空实现，只作为 bundle 的入口存在
 * （package.json 的 "." 导出和 cordis.patch.yml 的插入行都指向它）；
 * 客户端页面照常由 package.json 的 dsh.client 加载。
 *
 * 历史：1.5.0–1.6.0 曾在这里注册 POST /x-project-file-picker/obsidian 路由，
 * 由宿主拉起 obsidian:// 协议。该功能在 1.6.1 移除——DSH 的 resource 路由只
 * 接 GET/HEAD，POST 一律 405，实际从未生效。
 */
export function apply() {}
