# 心理学实验数据收集平台 🧠

## 项目现状

✅ **已配置为Netlify部署**
- 前端：静态HTML/CSS/JS在 `psychology-experiment/public/`
- 后端：使用Netlify Functions（无服务器）
- 数据库：Supabase PostgreSQL
- 环境：完全云端部署

## 项目结构

```
psy-data-collect/
├── netlify.toml              ← Netlify配置（路由、构建）
├── functions/                ← 后端API函数
│   ├── status.js            （获取提交计数）
│   ├── session.js           （创建实验session）
│   ├── submit.js            （接收参与者数据）
│   ├── admin.js             （管理员面板数据）
│   ├── preview.js           （数据预览）
│   └── export.js            （导出CSV）
├── psychology-experiment/
│   ├── public/              ← 网站前端
│   │   ├── index.html       （主页）
│   │   ├── admin.html       （管理员面板）
│   │   ├── experiment.js    （实验逻辑）
│   │   ├── styles.css       （样式）
│   │   └── assets/          （图片等）
│   └── server.js            （本地开发用，不用于部署）
└── DEPLOYMENT_GUIDE.md      ← 部署步骤

```

## 快速开始

### 1️⃣ 本地测试（可选）
```bash
npm install
npm run dev:local
# 访问 http://localhost:3000
```

### 2️⃣ 部署到Netlify
详见 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

简单总结：
1. ✅ 在Supabase创建表（复制SQL）
2. ✅ 设置Netlify环境变量
3. ✅ 连接GitHub仓库到Netlify
4. ✅ 完成！

## API端点

所有endpoint现在都在Netlify Functions上运行：

| 方法 | 端点 | 功能 |
|------|------|------|
| GET | `/api/status` | 获取总提交数 |
| GET | `/api/session` | 创建新参与者session |
| POST | `/api/submit` | 提交实验数据 |
| GET | `/api/admin?token=xxx` | 获取管理员数据 |
| GET | `/api/preview?token=xxx` | 数据预览 |
| GET | `/api/export?token=xxx` | 导出CSV |

## 环境变量

在Netlify Site Settings中设置：

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=sb_publishable_xxxxx
ADMIN_TOKEN=你的密码
```

## 故障排除

**页面打不开？**
- ✅ 检查Netlify deployment状态
- ✅ 查看browser console看是否有错误

**API返回错误？**
- ✅ 检查环境变量是否正确
- ✅ 看Netlify Functions日志（Site → Functions）
- ✅ 确认Supabase表存在

**数据没有保存？**
- ✅ 确认Supabase表结构正确
- ✅ 检查Supabase API Key权限
- ✅ 查看Netlify Function日志

## 技术栈

- **前端**：Vanilla JavaScript + HTML/CSS
- **后端**：Node.js (Netlify Functions)
- **数据库**：PostgreSQL (Supabase)
- **部署**：Netlify
- **API通信**：Fetch API

## 下一步

1. 按照 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 部署
2. 测试所有功能
3. 邀请参与者进行实验
4. 从管理员面板导出数据

需要帮助？问我！ 🚀
