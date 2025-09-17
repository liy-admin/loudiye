# Cloudflare Pages 动态 WhatsApp 轮询设置指南

现在你有了一个完整的动态 WhatsApp 链接轮询系统！可以在部署后通过管理界面在线修改轮询链接，无需重新部署代码。

## 🚀 快速部署

### 1. 文件结构确认
```
/mnt/d/D/落地页/
├── index.html (已修改支持轮询)
├── whatsapp-integration.js
├── styles.css
├── ai-robot.svg
└── functions/
    └── api/
        └── whatsapp/
            └── [...slug].js (新的 API)
```

### 2. 部署到 Cloudflare Pages

1. **推送代码到 Git**
```bash
git add .
git commit -m "Add dynamic WhatsApp link rotation"
git push
```

2. **Cloudflare Pages 自动检测并部署**
   - Pages 会自动识别 `functions` 目录
   - 部署为 Serverless Functions

### 3. 配置 KV 存储（推荐）

在 Cloudflare Dashboard 中：

1. 进入 **Workers** > **KV**
2. 创建新的 Namespace：`WHATSAPP_LINKS`
3. 进入 **Pages** > 选择你的项目
4. 点击 **Settings** > **Functions** > **KV namespace bindings**
5. 添加绑定：
   - **Variable name**: `WHATSAPP_LINKS`
   - **KV namespace**: 选择刚创建的 namespace

### 4. 设置环境变量

在 **Pages** > **Settings** > **Environment variables** 添加：

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `ADMIN_KEY` | `your-secret-admin-key-123` | 管理界面认证密钥 |

## 🎯 使用方法

### 访问管理界面

部署完成后，访问：
```
https://page1-9pn.pages.dev/api/whatsapp/admin
```

### 管理 WhatsApp 链接

1. **添加新链接**
   - 链接名称：例如 "客服1"
   - WhatsApp 链接：完整的 `https://wa.me/...` 链接
   - 权重：1-10（数字越大出现频率越高）
   - 状态：启用/禁用

2. **修改现有链接**
   - 点击"启用/禁用"切换状态
   - 点击"删除"移除链接

3. **查看使用统计**
   - 每个链接的使用次数
   - 使用百分比分布

### API 端点

| 端点 | 方法 | 用途 | 认证 |
|------|------|------|------|
| `/api/whatsapp/link` | GET | 获取轮询链接 | 否 |
| `/api/whatsapp/stats` | GET | 查看统计数据 | 否 |
| `/api/whatsapp/config` | GET/POST/PUT/DELETE | 管理链接配置 | 是 |
| `/api/whatsapp/admin` | GET | 管理界面 | 否 |

## ⚙️ 轮询策略

### 可用策略
- **weighted_random**: 加权随机（推荐）
- **round_robin**: 顺序轮询
- **least_used**: 最少使用优先
- **random**: 完全随机

### 在代码中修改策略
编辑 `index.html` 第125行：
```javascript
whatsappRotation = initWhatsAppRotation(WORKER_URL, {
    strategy: 'weighted_random', // 在这里修改策略
    trackClicks: true,
    cacheTime: 30000
});
```

## 📊 数据存储

### 有 KV 存储
- ✅ 链接配置持久化保存
- ✅ 使用统计记录
- ✅ 轮询状态保持

### 无 KV 存储
- ⚠️ 使用默认链接配置
- ⚠️ 重启后统计数据丢失
- ✅ 基本轮询功能正常

## 🔒 安全设置

### 管理密钥
- 默认密钥：`default-admin-key-change-me`
- **必须修改**：在环境变量中设置 `ADMIN_KEY`
- 用于管理接口的认证

### API 认证
访问配置接口需要在请求头添加：
```
Authorization: Bearer your-secret-admin-key-123
```

## 🧪 测试验证

### 1. 功能测试
```bash
# 获取轮询链接
curl "https://page1-9pn.pages.dev/api/whatsapp/link"

# 查看统计
curl "https://page1-9pn.pages.dev/api/whatsapp/stats"
```

### 2. 管理界面测试
1. 访问 `/api/whatsapp/admin`
2. 添加测试链接
3. 刷新页面验证轮询效果

### 3. 前端集成测试
1. 打开 `index.html`
2. 点击 "Start Analysis"
3. 等待1.5秒后点击 WhatsApp 按钮
4. 验证链接是否轮询

## 🛠️ 自定义配置

### 修改默认链接
编辑 `functions/api/whatsapp/[...slug].js` 的 `getDefaultLinks()` 函数：
```javascript
function getDefaultLinks() {
  return [
    {
      id: '1',
      name: '你的客服名称',
      url: 'https://wa.me/你的号码?text=你的消息',
      description: '描述',
      weight: 1,
      enabled: true,
      usageCount: 0,
      createdAt: new Date().toISOString()
    }
  ];
}
```

### 添加更多轮询策略
在 `selectLinkByStrategy` 函数中添加新的 case。

### 自定义管理界面
修改 `handleAdmin` 函数中的 HTML 模板。

## 📈 监控和优化

### 使用统计
- 在管理界面查看实时统计
- 根据使用情况调整权重
- 及时禁用失效链接

### 性能优化
- 链接缓存：30秒（可调整）
- KV 读写优化：批量操作
- 错误处理：自动降级

### 日志监控
在 Cloudflare Dashboard > Functions > 查看实时日志

## 🔧 故障排除

### 常见问题

**Q: 管理界面打不开**
A: 检查 functions 目录结构是否正确

**Q: 无法添加链接**
A: 确认 ADMIN_KEY 环境变量是否设置

**Q: 轮询不生效**
A: 检查浏览器控制台的 API 请求状态

**Q: 统计数据不准确**
A: 确认 KV 存储绑定是否正确配置

### 调试方法
1. 浏览器控制台查看错误信息
2. Cloudflare Dashboard > Functions > 查看函数日志
3. 使用 curl 测试 API 端点

---

## 🎉 完成！

现在你拥有了：
- ✅ 动态可配置的 WhatsApp 链接轮询
- ✅ 在线管理界面
- ✅ 多种轮询策略
- ✅ 使用统计分析
- ✅ 完全无需重新部署即可修改

只需访问 `https://page1-9pn.pages.dev/api/whatsapp/admin` 就能管理所有 WhatsApp 链接！