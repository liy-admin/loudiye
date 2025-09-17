# WhatsApp 轮询集成指南

## 概述
你的 `index.html` 股票分析落地页已成功集成 WhatsApp 链接轮询功能。现在模态框中的 WhatsApp 链接将自动轮询到不同的客服账号。

## 修改内容

### 1. HTML 修改
```html
<!-- 原来 -->
<a href="https://wa.me/" target="_blank" class="whatsapp-modal-btn">
    Receive Analysis Report for Free via WhatsApp
</a>

<!-- 修改后 -->
<a href="https://wa.me/" target="_blank" class="whatsapp-modal-btn" id="whatsapp-link" data-whatsapp-rotation="true">
    <span id="whatsapp-text">Receive Analysis Report for Free via WhatsApp</span>
</a>
```

### 2. JavaScript 集成
- 添加了 `whatsapp-integration.js` 脚本引用
- 初始化 WhatsApp 轮询系统
- 在显示 WhatsApp 内容前动态获取轮询链接
- 添加了完整的错误处理和降级方案

## 部署步骤

### 1. 部署 Cloudflare Worker

使用专门的股票分析 Worker 配置：

```bash
# 部署到 Cloudflare Workers
# 使用 stock-analysis-worker.js 文件内容
```

### 2. 配置 Worker URL

修改 `index.html` 第118行：
```javascript
const WORKER_URL = 'https://your-actual-worker.workers.dev'; // 替换为你的实际 Worker URL
```

### 3. 上传文件

确保以下文件在同一目录：
- `index.html` (已修改)
- `whatsapp-integration.js`
- `styles.css` (原有样式文件)
- `ai-robot.svg` (原有图标文件)

## 功能特性

### ✅ 自动轮询
- 支持 5 种轮询策略
- 默认使用加权随机策略
- 根据时间段智能分配

### ✅ 专业配置
- 5个专业股票分析师账号
- 针对不同地区和专业领域
- 自定义股票分析消息内容

### ✅ 智能降级
- API 失败时自动使用备用链接
- 保持用户体验连续性
- 错误日志记录

### ✅ 用户体验
- 加载状态提示
- 点击统计跟踪
- 无缝集成到现有流程

## Worker 账号配置

专门为股票分析优化的 5 个 WhatsApp 账号：

1. **Stock Analyst Team 1** (权重:3) - 美股专家
2. **Stock Analyst Team 2** (权重:2) - 科技股专家
3. **Market Research Team** (权重:2) - 市场分析师
4. **Senior Stock Advisor** (权重:4) - 资深顾问
5. **Investment Advisor** (权重:1) - 投资顾问

## 时间段分配

- **0-6点**: 资深顾问值班
- **6-9点**: 美股开盘前准备
- **9-16点**: 美股交易时间主力
- **16-18点**: 美股收盘后欧洲时间
- **18-22点**: 欧洲和亚洲重叠时间
- **22-24点**: 亚洲市场焦点

## 使用流程

1. 用户点击 "Start Analysis" 按钮
2. 显示 AI 分析进度条（1.5秒）
3. **后台自动获取轮询的 WhatsApp 链接**
4. 显示 WhatsApp 内容（包含轮询后的链接）
5. 用户点击按钮跳转到分配的客服

## 监控和统计

### API 端点
- `GET /api/whatsapp/link` - 获取轮询链接
- `GET /api/whatsapp/stats` - 查看使用统计
- `POST /api/whatsapp/click` - 记录点击事件

### 统计数据
- 每个账号的使用次数和百分比
- 每日点击限制和剩余次数
- 热门股票代码统计
- 实时可用账号状态

## 配置选项

### 修改轮询策略
在 `index.html` 中修改：
```javascript
whatsappRotation = initWhatsAppRotation(WORKER_URL, {
    strategy: 'weighted_random', // 可选: round_robin, least_used, time_based
    trackClicks: true,
    cacheTime: 30000
});
```

### 修改股票分析消息
在 `stock-analysis-worker.js` 中修改 `WHATSAPP_ACCOUNTS` 的 `message` 字段。

### 调整权重分配
修改 `WHATSAPP_ACCOUNTS` 中的 `weight` 值来调整账号出现频率。

## 测试验证

### 1. 本地测试
1. 打开 `index.html`
2. 点击 "Start Analysis"
3. 查看浏览器控制台日志
4. 确认 WhatsApp 链接正确轮询

### 2. Worker 测试
1. 直接访问 `https://your-worker.workers.dev/api/whatsapp/link`
2. 检查返回的 JSON 响应
3. 验证不同刷新返回不同账号

### 3. 降级测试
1. 临时修改 Worker URL 为无效地址
2. 确认仍能正常跳转到降级 WhatsApp 链接

## 故障排除

### 常见问题

**Q: 链接没有轮询，总是跳转到同一个账号**
A: 检查 Worker URL 是否正确，查看浏览器控制台错误信息

**Q: 点击按钮没有反应**
A: 确认 `whatsapp-integration.js` 文件路径正确

**Q: 显示 "Loading WhatsApp link..." 但不消失**
A: 检查 Worker 是否正常运行，网络连接是否正常

### 调试方法
1. 打开浏览器开发者工具
2. 查看 Console 标签页的日志信息
3. 检查 Network 标签页的 API 请求状态

## 性能优化

1. **缓存机制**: 30秒缓存避免频繁 API 调用
2. **重试机制**: 自动重试失败的请求
3. **降级方案**: 确保 100% 可用性
4. **异步加载**: 不阻塞页面渲染

## 安全考虑

1. **CORS 配置**: Worker 已配置允许跨域访问
2. **数据验证**: 输入参数验证和清理
3. **错误处理**: 不暴露敏感信息
4. **限流保护**: 每日点击次数限制

---

现在你的股票分析落地页已经具备了智能的 WhatsApp 客服轮询功能！🎉