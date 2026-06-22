# Netlify Functions 部署指南 📋

你的项目已准备好部署到Netlify！这里是详细步骤。

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

## 第2步：配置Netlify环境变量

1. 去你的Netlify Site Settings
2. 找到 **Build & Deploy → Environment** 
3. 添加这些环境变量：

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = sb_publishable_xxxxxxxxxxxxx
ADMIN_TOKEN = 你的自定义管理员密码 (比如: admin123)
```

**在哪里找这些信息？**
- SUPABASE_URL 和 SUPABASE_KEY：在Supabase → Project Settings → API

## 第3步：连接Netlify并部署

### 方式A：用Netlify CLI（如果已安装）

```bash
# 在项目根目录
npm install
netlify deploy --prod
```

### 方式B：连接GitHub（推荐）

1. 把你的代码push到GitHub
2. 在Netlify Dashboard：
   - 点 "Add new site" → "Import an existing project"
   - 选择你的GitHub仓库
   - Build command 保持默认
   - Publish directory 设为 `psychology-experiment/public`
   - 点Deploy！

3. 部署完成后，设置环境变量（见第2步）
4. Netlify会自动重新部署

## 第4步：更新你的前端代码

你的前端JavaScript已经在调用这些API了，所以应该不需要改。检查一下 `psychology-experiment/public/experiment.js`：

确保API调用是这样的：
```javascript
const response = await fetch('/api/session');
const data = await fetch('/api/submit', {
  method: 'POST',
  body: JSON.stringify({ ... })
});
```

这些URL会自动路由到你的Functions！✨

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

### ❌ "SUPABASE_URL is undefined"？
- 检查环境变量是否正确设置
- 确保variable名字完全匹配

### ❌ 数据没有保存到Supabase？
- 检查Supabase表是否存在
- 查看Netlify Function logs：Site → Functions
- 确保SUPABASE_KEY有足够权限

### ✅ 成功了！
- 管理员页面：访问 `https://your-site.netlify.app/admin.html?token=admin123`
- 导出数据：访问 `https://your-site.netlify.app/api/export?token=admin123`

## 备注

- 旧的本地 `data/` 文件夹不再使用，所有数据都在Supabase
- 如果需要修改 Function，在 `functions/` 文件夹编辑，然后push到GitHub
- Netlify会自动在每次push时重新部署

需要帮助？问我就行！ 🚀
