# WhatsApp 动态轮询 - 快速指南

## 🎯 核心功能
✅ **动态配置**：在线修改 WhatsApp 链接，无需重新部署
✅ **智能轮询**：支持加权随机、轮询、最少使用等策略
✅ **管理界面**：网页端管理所有链接和查看统计
✅ **完整集成**：已集成到你的股票分析落地页

## 📂 文件说明
```
├── index.html                           # 已修改支持轮询
├── whatsapp-integration.js              # 轮询客户端脚本
├── functions/api/whatsapp/[...slug].js  # 服务端 API
└── CLOUDFLARE_SETUP.md                  # 详细部署指南
```

## 🚀 快速开始

### 1. 部署
```bash
git add . && git commit -m "Add WhatsApp rotation" && git push
```

### 2. 配置 KV 存储（可选但推荐）
- Cloudflare Dashboard > Workers > KV > 创建 `WHATSAPP_LINKS`
- Pages > Settings > Functions > 绑定 KV

### 3. 设置管理密钥
- Pages > Settings > Environment variables
- 添加 `ADMIN_KEY = your-secret-key`

### 4. 管理链接
访问：`https://page1-9pn.pages.dev/api/whatsapp/admin`

## 💡 使用方法

### 添加链接示例
- **名称**: 客服1
- **链接**: `https://wa.me/8613800138000?text=Hello,%20I%20need%20stock%20analysis`
- **权重**: 3 (越高出现频率越大)
- **状态**: 启用

### 测试轮询
1. 打开你的落地页
2. 点击 "Start Analysis"
3. 点击 WhatsApp 按钮
4. 多次刷新测试不同链接

## 📊 管理界面功能
- ➕ 添加新链接
- ✏️ 启用/禁用链接
- 🗑️ 删除链接
- 📈 查看使用统计
- 🔄 实时刷新数据

## 🔄 轮询策略
- **加权随机** (推荐): 根据权重随机分配
- **顺序轮询**: 按顺序依次使用
- **最少使用**: 优先使用次数少的
- **完全随机**: 纯随机选择

---

**就这么简单！** 现在你的 WhatsApp 链接会智能轮询，且可以随时在线修改。 🎉

详细配置请查看 [`CLOUDFLARE_SETUP.md`](CLOUDFLARE_SETUP.md)