# 联系方式轮询系统

一个基于 Cloudflare Workers 的联系方式轮询系统，支持多种轮询策略和多种联系方式类型。

## 功能特性

- ✅ 支持多种联系方式：微信、QQ、电话、Telegram、邮箱等
- ✅ 多种轮询策略：顺序轮询、随机、加权随机、时间段、负载均衡
- ✅ 使用统计和分析
- ✅ 实时切换策略
- ✅ 支持二维码展示
- ✅ 响应式设计，支持移动端
- ✅ 可嵌入式组件
- ✅ 自动轮换功能

## 文件说明

```
├── cloudflare-worker.js  # Cloudflare Workers 后端代码
├── contact-display.html  # 完整的展示页面（调试用）
├── contact-widget.js     # 可嵌入的悬浮组件
└── README.md             # 使用说明
```

## 部署步骤

### 1. 部署 Cloudflare Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers 页面
3. 创建新的 Worker
4. 将 `cloudflare-worker.js` 的内容复制到编辑器
5. 修改联系方式配置（CONTACTS 数组）
6. 保存并部署

### 2. 配置 KV 存储（可选）

如果需要持久化存储轮询状态和统计数据：

1. 在 Cloudflare Dashboard 创建 KV 命名空间
2. 绑定到 Worker：
   - 变量名：`CONTACT_ROTATION`
   - KV 命名空间：选择刚创建的命名空间

### 3. 使用组件

#### 方式一：独立页面

直接打开 `contact-display.html`，修改其中的 API_URL 为你的 Worker URL。

#### 方式二：嵌入到现有页面

```html
<!-- 基础使用 -->
<script src="contact-widget.js"></script>

<!-- 自定义配置 -->
<script>
window.ContactWidgetConfig = {
    apiUrl: 'https://your-worker.workers.dev',
    position: 'bottom-right',
    theme: 'dark'
};
</script>
<script src="contact-widget.js"></script>
```

## 配置说明

### 联系方式配置

在 `cloudflare-worker.js` 中修改 CONTACTS 数组：

```javascript
const CONTACTS = [
  {
    id: 1,                          // 唯一ID
    type: 'wechat',                 // 类型
    value: 'wechat_id',            // 联系方式值
    name: '客服小王',               // 显示名称
    qrcode: 'https://xxx.png',     // 二维码图片（可选）
    available: true,                // 是否可用
    weight: 2                       // 权重（用于加权随机）
  }
];
```

### 轮询策略

修改 `CURRENT_STRATEGY` 值：

- `round_robin` - 顺序轮询
- `random` - 随机选择
- `weighted_random` - 加权随机（推荐）
- `time_based` - 基于时间段
- `load_balanced` - 负载均衡

### 时间段配置

用于 `time_based` 策略：

```javascript
const TIME_SLOTS = [
  { start: 0, end: 8, contacts: [4] },    // 0-8点使用ID为4的联系方式
  { start: 8, end: 18, contacts: [1, 2] }, // 8-18点使用ID为1,2的联系方式
  { start: 18, end: 24, contacts: [3, 5] } // 18-24点使用ID为3,5的联系方式
];
```

### 组件配置选项

```javascript
new ContactWidget({
    apiUrl: 'https://your-worker.workers.dev', // Worker API地址
    refreshInterval: 30000,                     // 自动刷新间隔(ms)
    position: 'bottom-right',                   // 位置
    theme: 'dark',                             // 主题：dark/light
    autoRotate: true,                          // 自动轮换
    showMultiple: false,                       // 同时显示多个
    maxContacts: 3                             // 最多显示数量
});
```

## API 接口

### 获取联系方式
```
GET /api/contact
```
返回当前应该显示的联系方式

### 获取所有联系方式
```
GET /api/contacts/all
```
返回所有配置的联系方式列表

### 获取统计信息
```
GET /api/contact/stats
```
返回使用统计数据

### 上报使用情况
```
POST /api/contact/report
Body: { contactId: 1, action: 'click' }
```
记录用户实际点击/使用情况

## 轮询策略详解

### 1. 顺序轮询 (Round Robin)
按照配置顺序依次展示联系方式，循环往复。

### 2. 随机选择 (Random)
每次随机选择一个可用的联系方式。

### 3. 加权随机 (Weighted Random)
根据配置的权重值，权重越高的联系方式出现概率越大。

### 4. 时间段 (Time Based)
根据当前时间段展示特定的联系方式，适合有固定工作时间的客服。

### 5. 负载均衡 (Load Balanced)
优先展示使用次数最少的联系方式，实现负载均衡。

## 注意事项

1. **CORS配置**：Worker 已配置允许跨域，可直接从任何域名调用
2. **缓存**：建议在 Cloudflare 设置适当的缓存规则
3. **限流**：建议配置 Rate Limiting 防止滥用
4. **监控**：使用 Cloudflare Analytics 监控使用情况

## 常见问题

### Q: 如何更换联系方式？
A: 修改 `cloudflare-worker.js` 中的 CONTACTS 数组，然后重新部署 Worker。

### Q: 统计数据存储在哪里？
A: 如果配置了 KV 存储，数据会持久化保存；否则只在 Worker 运行期间有效。

### Q: 能否同时显示多个联系方式？
A: 可以，设置组件的 `showMultiple: true` 和 `maxContacts` 参数。

### Q: 如何自定义样式？
A: 修改 `contact-widget.js` 中的 CSS 样式，或在页面中覆盖相关类名。

## 许可证

MIT License