# Netlify Functions 部署指南

这份指南按“小白也能照着做”的方式写。你只需要抓住两件事：

1. Supabase 里先把表建好
2. Netlify 里把 3 个环境变量配好

## 第1步：确保Supabase表结构正确

你需要在Supabase中创建这些表。登录你的Supabase控制台（https://app.supabase.com）：

### 表1：responses（参与者回复数据）

```sql
CREATE TABLE responses (
  id UUID PRIMARY KEY,
  participant_code TEXT,
  server_code TEXT,
  submitted_at TIMESTAMP,
  debug BOOLEAN,
  group_number INTEGER,
  ip_hash TEXT,
  user_agent TEXT,
  condition JSONB,
  duration_ms INTEGER,
  data JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

### 表2：sessions（实验session）

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  participant_code TEXT,
  group_number INTEGER,
  condition JSONB,
  ip_hash TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### 表3：debug_responses（调试数据）

```sql
CREATE TABLE debug_responses (
  id UUID PRIMARY KEY,
  participant_code TEXT,
  server_code TEXT,
  submitted_at TIMESTAMP,
  debug BOOLEAN,
  group_number INTEGER,
  ip_hash TEXT,
  user_agent TEXT,
  condition JSONB,
  duration_ms INTEGER,
  data JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

## 第2步：配置 Netlify 环境变量

1. 去你的Netlify Site Settings
2. 找到 **Build & Deploy → Environment** 
3. 添加这些环境变量：

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = sb_publishable_xxxxxxxxxxxxx
ADMIN_TOKEN = 你自己设置的后台密码
```

重要：

- `ADMIN_TOKEN` 现在没有默认值。
- 如果你不设置它，后台页面 `/admin.html` 和导出接口 `/api/export` 都会拒绝访问。
- 不要再用 `admin123` 这种太简单的密码。

**在哪里找这些信息？**
- `SUPABASE_URL` 和 `SUPABASE_KEY`：在 Supabase → Project Settings → API
- `ADMIN_TOKEN`：这是你自己定的，不是系统给的

## 第3步：连接Netlify并部署

### 方式A：用Netlify CLI（如果已安装）

```bash
# 在项目根目录
npm install
netlify deploy --prod
```

### 方式 B：连接 GitHub（推荐）

1. 把你的代码push到GitHub
2. 在Netlify Dashboard：
   - 点 "Add new site" → "Import an existing project"
   - 选择你的GitHub仓库
   - Build command 保持默认
   - Publish directory 设为 `psychology-experiment/public`
   - 点Deploy！

3. 部署完成后，设置环境变量（见第2步）
4. Netlify会自动重新部署

## 第4步：前端代码一般不用改

你的前端JavaScript已经在调用这些API了，所以应该不需要改。检查一下 `psychology-experiment/public/experiment.js`：

确保API调用是这样的：
```javascript
const response = await fetch('/api/session');
const data = await fetch('/api/submit', {
  method: 'POST',
  body: JSON.stringify({ ... })
});
```

这些 URL 会自动路由到你的 Functions。

## 第5步：测试部署

访问你的Netlify网址：
1. 页面能打开吗？
2. 能创建新session吗？（检查浏览器Network标签，看 /api/session 返回数据）
3. 能提交数据吗？（提交后应该看到 participantCode）
4. 数据出现在Supabase里了吗？

## 常见问题

### ❌ "Function not found" 错误？
- 确认 `functions/` 文件夹存在
- 在Netlify重新部署（Settings → Deploys → Trigger deploy）

### ❌ 后台接口一直提示“后台访问令牌不正确”？
- 检查 Netlify 里有没有设置 `ADMIN_TOKEN`
- 检查你打开的地址是不是 `https://你的域名/admin.html?token=你设置的密码`

### ❌ "SUPABASE_URL is undefined"？
- 检查环境变量是否正确设置
- 确保变量名字完全匹配

### ❌ 数据没有保存到Supabase？
- 检查Supabase表是否存在
- 查看Netlify Function logs：Site → Functions
- 确保SUPABASE_KEY有足够权限

### ✅ 成功了
- 管理员页面：访问 `https://your-site.netlify.app/admin.html?token=你的ADMIN_TOKEN`
- 导出数据：访问 `https://your-site.netlify.app/api/export?token=你的ADMIN_TOKEN`

## 备注

- 旧的本地 `data/` 文件夹不再用于线上部署，线上数据都在 Supabase
- 如果需要修改 Function，在 `functions/` 文件夹编辑，然后 push 到 GitHub
- Netlify 会在每次 push 后自动重新部署

需要帮助？问我就行！ 🚀
