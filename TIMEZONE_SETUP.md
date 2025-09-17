# 时区访问限制功能

## 🚀 功能说明
- 从 KV 存储读取 `UTC` 键的值控制开关
- `UTC = on`: 启用时区限制，只允许美国时区访问
- `UTC = off`: 关闭时区限制，允许所有地区访问
- 非美国时区用户会被重定向到 google.com

## ⚙️ 配置方法

### 1. 在 KV 存储中设置开关
在 Cloudflare Dashboard → Workers → KV → WHATSAPP_LINKS 中添加：

| 键 | 值 | 说明 |
|---|---|---|
| `UTC` | `on` | 启用时区限制 |
| `UTC` | `off` | 关闭时区限制 |

### 2. 部署代码
```bash
git add .
git commit -m "Add timezone access restriction"
git push
```

## 🌍 支持的美国时区

### 主要时区
- **东部时间**: EST/EDT (New York, Florida, etc.)
- **中部时间**: CST/CDT (Chicago, Texas, etc.)
- **山地时间**: MST/MDT (Denver, Utah, etc.)
- **太平洋时间**: PST/PDT (California, Washington, etc.)
- **阿拉斯加时间**: AKST/AKDT (Alaska)
- **夏威夷时间**: HST (Hawaii)

### 具体时区列表
```
America/New_York, America/Chicago, America/Denver,
America/Los_Angeles, America/Anchorage, Pacific/Honolulu,
America/Phoenix, America/Detroit, America/Louisville,
等等...
```

## 🔧 工作原理

### 1. 中间件检查
- `_middleware.js` 在所有页面访问前执行
- 跳过 `/api/` 路径的检查
- 调用时区检查函数

### 2. 时区检测
- 从 Cloudflare 的 `cf.timezone` 获取用户时区
- 备选方案：检查请求头中的时区信息
- 最后备选：从 Accept-Language 推断

### 3. 访问控制
- KV 中 `UTC = on`: 启用限制
- KV 中 `UTC = off`: 关闭限制
- 非美国时区 → 重定向到 google.com
- 美国时区 → 正常访问

## 🧪 测试方法

### 1. 开启限制
```bash
# 在 KV 中设置 UTC = on
# 访问页面应该根据时区决定是否重定向
```

### 2. 关闭限制
```bash
# 在 KV 中设置 UTC = off
# 所有地区都能正常访问
```

### 3. 查看日志
在 Cloudflare Dashboard → Pages → Functions → View logs 查看：
- "UTC setting from KV: on/off"
- "User timezone: America/New_York"
- "US timezone detected, allowing access"
- "Non-US timezone detected, redirecting to Google"

## ⚠️ 注意事项

1. **时区检测准确性**: Cloudflare 的时区检测比较准确，但不是 100%
2. **VPN 用户**: 使用美国 VPN 的用户可能绕过限制
3. **错误处理**: 检测失败时默认允许访问，避免误拦截
4. **API 路径**: `/api/` 路径不受时区限制影响

## 📊 调试信息

浏览器控制台和 Cloudflare 日志会显示：
- KV 开关状态
- 检测到的用户时区
- 是否为美国时区
- 最终访问决定

---

现在你可以通过 KV 中的 `UTC` 键动态控制时区访问限制！