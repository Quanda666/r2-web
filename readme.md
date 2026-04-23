![93c1205d.png](https://image.viki.moe/github/93c1205d.png)

**中文 | [English](./readme-en.md)**

# R2 Web

📁 现代、优雅、全栈化的 Cloudflare R2 管理器。基于 Cloudflare Pages + D1 数据库构建，支持多用户、多存储桶管理。

> 本项目被阮一峰大佬在 _[《科技爱好者周刊（第 387 期）》][ruanyifeng-weekly]_ 中推荐，在此表示感谢！

## 核心特性

- **多用户系统**: 支持注册/登录，配置云端同步，多设备无缝切换。
- **多桶管理**: 支持添加多个 R2 存储桶，顶部栏一键切换。
- **现代 UI**: 极致的 Apple 风格设计，支持响应式与深色模式。
- **全栈架构**: 利用 Cloudflare Pages Functions 处理 API，D1 数据库存储配置。
- **零成本部署**: 完全利用 Cloudflare 免费额度，无需支付服务器费用。
- **原有功能**: 拖拽/粘贴上传、图片压缩、PWA 支持、文件预览、目录管理等全部保留。

## 快速部署 (零 CLI 模式)

无需安装 Node.js 或 Wrangler，直接在浏览器中完成部署。

### 1. 准备工作
- 一个 [Cloudflare](https://dash.cloudflare.com/) 账户。
- Fork 本仓库到你的 GitHub。

### 2. 创建 Pages 项目
1. 登录 Cloudflare Dashboard，进入 **Workers 和 Pages**。
2. 点击 **创建** -> **Pages** -> **连接到 Git**。
3. 选择你 Fork 的 `r2-web` 仓库。
4. **构建设置**: 
   - 框架预设: `None`
   - 构建命令: (留空)
   - 输出目录: `src`
5. 点击 **保存并部署**。

### 3. 创建 D1 数据库
1. 在 Cloudflare Dashboard 侧边栏进入 **存储和数据库** -> **D1**。
2. 点击 **创建**，名称填 `r2-web-db`。
3. 创建成功后，点击进入该数据库，切换到 **控制台** 选项卡。
4. 复制仓库根目录下的 `schema.sql` 内容，粘贴到控制台并点击 **执行**。

### 4. 绑定 D1 到 Pages
1. 回到你的 Pages 项目设置 -> **设置** -> **函数**。
2. 滚动到 **D1 数据库绑定**，点击 **添加绑定**。
3. 变量名填 `DB`，数据库选择刚才创建的 `r2-web-db`。
4. **重要**: 在 **环境变量** 中添加 `JWT_SECRET`，填入一段随机字符串作为加密密钥。
5. 重新部署 Pages 项目使配置生效。

### 5. 配置 R2 桶 CORS
在 R2 存储桶设置中添加 CORS 规则：
```json
[
  {
    "AllowedOrigins": ["https://你的项目域名.pages.dev"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

## 功能速览

| 功能类别     | 具体功能                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| **账户系统** | 用户注册/登录、云端配置存储、多桶配置同步、访客模式（本地存储）                                       |
| **桶管理**   | 多存储桶列表、顶部栏快速切换、一键设为默认桶、桶配置在线编辑                                          |
| **文件管理** | 目录浏览、分页、懒加载；重命名、移动、复制、删除（递归）；多选批量操作                                |
| **文件上传** | 拖拽/粘贴/选择器；文件名模板；WebAssembly 本地图片压缩                                              |
| **文件预览** | 图片预览；视频/音频播放；代码高亮预览                                                                |
| **个性化**   | 多语言 (ZH/TW/EN/JA)；深色模式；紧凑度调整                                                          |

## 反馈途径

- [GitHub Issues](https://github.com/vikiboss/r2-web/issues) - 提交 bug 报告、功能建议
- [反馈 QQ 群](https://qm.qq.com/q/e47kAlbdsc) - 1091212613

## License

MIT License

[ruanyifeng-weekly]: https://www.ruanyifeng.com/blog/2026/03/weekly-issue-387.html
