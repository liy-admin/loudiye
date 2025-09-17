# WhatsApp 轮询 + 时区访问限制系统

## 🎯 核心功能
1. **WhatsApp 轮询**: 从 KV 存储读取 `ws1`, `ws2`, `ws3` 键的值进行随机轮询
2. **时区访问限制**: 通过 KV 中的 `UTC` 键控制是否只允许美国时区访问

## 🚀 部署步骤

### 1. 配置 KV 存储
在 Cloudflare Dashboard：
1. Workers → KV → 创建 namespace `WHATSAPP_LINKS`
2. Pages → Settings → Functions → KV namespace bindings
3. 添加绑定：Variable name = `WHATSAPP_LINKS`

### 2. 添加配置数据
在 KV 存储中添加以下键值对：

#### WhatsApp 链接
- `ws1` = `https://wa.me/8613800138001?text=Hello`
- `ws2` = `https://wa.me/8613800138002?text=Hello`
- `ws3` = `https://wa.me/8613800138003?text=Hello`

#### 时区访问控制
- `UTC` = `on` (启用美国时区限制) 或 `off` (关闭限制)

### 3. 部署
```bash
git add .
git commit -m "Add WhatsApp rotation and timezone restriction"
git push
```

## 📡 API 端点
- `GET /api/whatsapp/link` - 获取随机轮询的 WhatsApp 链接

## 🌍 时区限制
- `UTC = on`: 只允许美国时区用户访问，其他地区重定向到 google.com
- `UTC = off`: 允许所有地区访问

支持所有美国时区：EST/EDT, CST/CDT, MST/MDT, PST/PDT, AKST/AKDT, HST

## 📋 功能说明
- WhatsApp 轮询：每次显示模态框时随机选择链接
- 时区检测：基于 Cloudflare 的地理位置信息
- 动态控制：通过 KV 存储实时开启/关闭限制
- API 路径：`/api/` 路径不受时区限制影响

详细配置请参考 [`TIMEZONE_SETUP.md`](TIMEZONE_SETUP.md)