# WhatsApp 轮询系统

## 功能
从 Cloudflare KV 存储读取 `ws1`, `ws2`, `ws3` 键的值作为 WhatsApp 链接进行轮询。

## 部署步骤

### 1. 配置 KV 存储
在 Cloudflare Dashboard：
1. Workers → KV → 创建 namespace `WHATSAPP_LINKS`
2. Pages → Settings → Functions → KV namespace bindings
3. 添加绑定：Variable name = `WHATSAPP_LINKS`

### 2. 添加 WhatsApp 链接
在 KV 存储中添加以下键值对：
- `ws1` = `https://wa.me/8613800138001?text=Hello`
- `ws2` = `https://wa.me/8613800138002?text=Hello`
- `ws3` = `https://wa.me/8613800138003?text=Hello`

### 3. 部署
```bash
git add .
git commit -m "Add WhatsApp rotation"
git push
```

## API 端点
- `GET /api/whatsapp/link` - 获取随机轮询的 WhatsApp 链接

## 使用
系统会自动从 `ws1`, `ws2`, `ws3` 中随机选择一个链接返回。