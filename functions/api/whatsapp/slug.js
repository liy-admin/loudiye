// Cloudflare Pages Function for Dynamic WhatsApp Link Rotation
// 支持在线动态修改 WhatsApp 链接

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/whatsapp/', '');

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    switch (path) {
      case 'link':
        return handleGetLink(request, headers, env);

      case 'config':
        return handleConfig(request, headers, env);

      case 'stats':
        return handleGetStats(headers, env);

      case 'click':
        return handleRecordClick(request, headers, env);

      case 'admin':
        return handleAdmin(request, headers, env);

      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers
        });
    }
  } catch (error) {
    console.error('Pages Function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 获取轮询链接
async function handleGetLink(request, headers, env) {
  const url = new URL(request.url);
  const strategy = url.searchParams.get('strategy') || 'weighted_random';

  try {
    // 从 KV 存储获取动态配置的链接
    const links = await getWhatsAppLinks(env);

    if (!links || links.length === 0) {
      return new Response(JSON.stringify({
        error: 'No WhatsApp links configured',
        fallbackUrl: 'https://wa.me/?text=Hello, I need support'
      }), {
        status: 503,
        headers
      });
    }

    // 过滤可用的链接
    const availableLinks = links.filter(link => link.enabled);

    if (availableLinks.length === 0) {
      return new Response(JSON.stringify({
        error: 'No available WhatsApp links',
        fallbackUrl: 'https://wa.me/?text=Hello, I need support'
      }), {
        status: 503,
        headers
      });
    }

    // 根据策略选择链接
    const selectedLink = await selectLinkByStrategy(availableLinks, strategy, env);

    // 记录使用
    await recordLinkUsage(selectedLink.id, env);

    return new Response(JSON.stringify({
      url: selectedLink.url,
      link: {
        id: selectedLink.id,
        name: selectedLink.name,
        description: selectedLink.description
      },
      strategy: strategy,
      timestamp: new Date().toISOString()
    }), { headers });

  } catch (error) {
    console.error('Error getting WhatsApp link:', error);

    return new Response(JSON.stringify({
      url: 'https://wa.me/?text=Hello, I need support',
      link: null,
      strategy: 'fallback',
      error: error.message
    }), { headers });
  }
}

// 配置管理
async function handleConfig(request, headers, env) {
  const method = request.method;

  // 简单的认证检查
  const authHeader = request.headers.get('Authorization');
  const adminKey = env.ADMIN_KEY || 'default-admin-key-change-me';

  if (!authHeader || authHeader !== `Bearer ${adminKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers
    });
  }

  try {
    switch (method) {
      case 'GET':
        // 获取所有链接配置
        const links = await getWhatsAppLinks(env);
        return new Response(JSON.stringify({ links }), { headers });

      case 'POST':
        // 添加新链接
        const newLink = await request.json();
        const addResult = await addWhatsAppLink(newLink, env);
        return new Response(JSON.stringify(addResult), { headers });

      case 'PUT':
        // 更新链接
        const updateData = await request.json();
        const updateResult = await updateWhatsAppLink(updateData, env);
        return new Response(JSON.stringify(updateResult), { headers });

      case 'DELETE':
        // 删除链接
        const { id } = await request.json();
        const deleteResult = await deleteWhatsAppLink(id, env);
        return new Response(JSON.stringify(deleteResult), { headers });

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers
    });
  }
}

// 管理界面
async function handleAdmin(request, headers, env) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const adminHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp 链接管理</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .header {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
        .form-group input, .form-group textarea, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        .btn {
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
        }
        .btn:hover { background: #0056b3; }
        .btn.danger { background: #dc3545; }
        .btn.danger:hover { background: #c82333; }
        .link-item {
            border: 1px solid #eee;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .link-item.disabled { background: #f8f9fa; opacity: 0.7; }
        .status-badge {
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 500;
        }
        .status-enabled { background: #d4edda; color: #155724; }
        .status-disabled { background: #f8d7da; color: #721c24; }
        .admin-key {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>WhatsApp 链接轮询管理</h1>
            <p>动态配置和管理 WhatsApp 轮询链接</p>
        </div>

        <div class="admin-key">
            <strong>认证密钥:</strong> 请在请求头中添加 <code>Authorization: Bearer YOUR_ADMIN_KEY</code>
            <br><small>默认密钥: default-admin-key-change-me (请在环境变量中设置 ADMIN_KEY)</small>
        </div>

        <div class="card">
            <h2>添加新链接</h2>
            <form id="addForm">
                <div class="form-group">
                    <label for="name">链接名称</label>
                    <input type="text" id="name" name="name" required placeholder="例如: 客服1">
                </div>
                <div class="form-group">
                    <label for="url">WhatsApp 链接</label>
                    <input type="url" id="url" name="url" required placeholder="https://wa.me/...">
                </div>
                <div class="form-group">
                    <label for="description">描述</label>
                    <input type="text" id="description" name="description" placeholder="链接描述">
                </div>
                <div class="form-group">
                    <label for="weight">权重 (1-10)</label>
                    <input type="number" id="weight" name="weight" min="1" max="10" value="1">
                </div>
                <div class="form-group">
                    <label for="enabled">状态</label>
                    <select id="enabled" name="enabled">
                        <option value="true">启用</option>
                        <option value="false">禁用</option>
                    </select>
                </div>
                <button type="submit" class="btn">添加链接</button>
            </form>
        </div>

        <div class="card">
            <h2>现有链接</h2>
            <div id="linksList">加载中...</div>
            <button onclick="loadLinks()" class="btn">刷新列表</button>
        </div>

        <div class="card">
            <h2>使用统计</h2>
            <div id="statsList">加载中...</div>
            <button onclick="loadStats()" class="btn">刷新统计</button>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin + '/api/whatsapp';
        let adminKey = localStorage.getItem('adminKey') || 'default-admin-key-change-me';

        // 设置管理密钥
        function setAdminKey() {
            const key = prompt('请输入管理密钥:', adminKey);
            if (key) {
                adminKey = key;
                localStorage.setItem('adminKey', key);
                loadLinks();
            }
        }

        // 通用请求函数
        async function apiRequest(url, options = {}) {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + adminKey,
                    ...options.headers
                }
            });

            if (response.status === 401) {
                setAdminKey();
                return null;
            }

            return response.json();
        }

        // 加载链接列表
        async function loadLinks() {
            try {
                const data = await apiRequest(API_BASE + '/config');
                if (!data) return;

                const container = document.getElementById('linksList');
                if (!data.links || data.links.length === 0) {
                    container.innerHTML = '<p>暂无配置的链接</p>';
                    return;
                }

                let html = '';
                data.links.forEach(link => {
                    const statusClass = link.enabled ? 'status-enabled' : 'status-disabled';
                    const statusText = link.enabled ? '启用' : '禁用';

                    html += \`
                        <div class="link-item \${link.enabled ? '' : 'disabled'}">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                                <strong>\${link.name}</strong>
                                <span class="status-badge \${statusClass}">\${statusText}</span>
                            </div>
                            <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
                                权重: \${link.weight} | 使用次数: \${link.usageCount || 0}
                            </div>
                            <div style="font-size: 12px; color: #999; margin-bottom: 10px; word-break: break-all;">
                                \${link.url}
                            </div>
                            <div>
                                <button onclick="toggleLink('\${link.id}', \${!link.enabled})" class="btn">
                                    \${link.enabled ? '禁用' : '启用'}
                                </button>
                                <button onclick="deleteLink('\${link.id}')" class="btn danger">删除</button>
                            </div>
                        </div>
                    \`;
                });

                container.innerHTML = html;
            } catch (error) {
                document.getElementById('linksList').innerHTML = '<p style="color: red;">加载失败: ' + error.message + '</p>';
            }
        }

        // 添加链接
        document.getElementById('addForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const linkData = {
                name: formData.get('name'),
                url: formData.get('url'),
                description: formData.get('description'),
                weight: parseInt(formData.get('weight')),
                enabled: formData.get('enabled') === 'true'
            };

            try {
                const result = await apiRequest(API_BASE + '/config', {
                    method: 'POST',
                    body: JSON.stringify(linkData)
                });

                if (result && result.success) {
                    e.target.reset();
                    loadLinks();
                    alert('链接添加成功');
                } else {
                    alert('添加失败: ' + (result?.error || '未知错误'));
                }
            } catch (error) {
                alert('添加失败: ' + error.message);
            }
        });

        // 切换链接状态
        async function toggleLink(id, enabled) {
            try {
                const result = await apiRequest(API_BASE + '/config', {
                    method: 'PUT',
                    body: JSON.stringify({ id, enabled })
                });

                if (result && result.success) {
                    loadLinks();
                } else {
                    alert('操作失败: ' + (result?.error || '未知错误'));
                }
            } catch (error) {
                alert('操作失败: ' + error.message);
            }
        }

        // 删除链接
        async function deleteLink(id) {
            if (!confirm('确定要删除这个链接吗？')) return;

            try {
                const result = await apiRequest(API_BASE + '/config', {
                    method: 'DELETE',
                    body: JSON.stringify({ id })
                });

                if (result && result.success) {
                    loadLinks();
                } else {
                    alert('删除失败: ' + (result?.error || '未知错误'));
                }
            } catch (error) {
                alert('删除失败: ' + error.message);
            }
        }

        // 加载统计
        async function loadStats() {
            try {
                const data = await apiRequest(API_BASE + '/stats');
                if (!data) return;

                const container = document.getElementById('statsList');

                let html = '<h4>链接使用统计</h4>';
                if (data.linkStats && Object.keys(data.linkStats).length > 0) {
                    for (const [id, count] of Object.entries(data.linkStats)) {
                        html += \`<p>链接 \${id}: \${count} 次</p>\`;
                    }
                } else {
                    html += '<p>暂无统计数据</p>';
                }

                html += \`<p><small>最后更新: \${data.lastUpdated || '未知'}</small></p>\`;

                container.innerHTML = html;
            } catch (error) {
                document.getElementById('statsList').innerHTML = '<p style="color: red;">加载失败: ' + error.message + '</p>';
            }
        }

        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', function() {
            // 检查是否需要设置管理密钥
            if (adminKey === 'default-admin-key-change-me') {
                setTimeout(() => {
                    if (confirm('检测到默认管理密钥，是否设置新的密钥？')) {
                        setAdminKey();
                    }
                }, 1000);
            }

            loadLinks();
            loadStats();
        });
    </script>
</body>
</html>
  `;

  return new Response(adminHTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

// KV 存储操作函数

// 获取 WhatsApp 链接配置
async function getWhatsAppLinks(env) {
  try {
    if (!env.WHATSAPP_LINKS) {
      // 如果没有 KV 存储，返回默认配置
      return getDefaultLinks();
    }

    const stored = await env.WHATSAPP_LINKS.get('config');
    if (!stored) {
      // 首次使用，保存默认配置
      const defaultLinks = getDefaultLinks();
      await env.WHATSAPP_LINKS.put('config', JSON.stringify(defaultLinks));
      return defaultLinks;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting WhatsApp links:', error);
    return getDefaultLinks();
  }
}

// 默认链接配置
function getDefaultLinks() {
  return [
    {
      id: '1',
      name: '客服1',
      url: 'https://wa.me/?text=Hello, I need the stock analysis report. Please send me today\'s 3 recommended quality stocks.',
      description: '默认客服1',
      weight: 1,
      enabled: true,
      usageCount: 0,
      createdAt: new Date().toISOString()
    }
  ];
}

// 保存链接配置
async function saveWhatsAppLinks(links, env) {
  if (!env.WHATSAPP_LINKS) {
    throw new Error('KV storage not configured');
  }

  await env.WHATSAPP_LINKS.put('config', JSON.stringify(links));
}

// 添加新链接
async function addWhatsAppLink(linkData, env) {
  try {
    const links = await getWhatsAppLinks(env);

    const newLink = {
      id: Date.now().toString(),
      name: linkData.name,
      url: linkData.url,
      description: linkData.description || '',
      weight: linkData.weight || 1,
      enabled: linkData.enabled !== false,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };

    links.push(newLink);
    await saveWhatsAppLinks(links, env);

    return { success: true, link: newLink };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 更新链接
async function updateWhatsAppLink(updateData, env) {
  try {
    const links = await getWhatsAppLinks(env);
    const linkIndex = links.findIndex(link => link.id === updateData.id);

    if (linkIndex === -1) {
      return { success: false, error: 'Link not found' };
    }

    // 更新链接属性
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && updateData[key] !== undefined) {
        links[linkIndex][key] = updateData[key];
      }
    });

    links[linkIndex].updatedAt = new Date().toISOString();

    await saveWhatsAppLinks(links, env);

    return { success: true, link: links[linkIndex] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 删除链接
async function deleteWhatsAppLink(id, env) {
  try {
    const links = await getWhatsAppLinks(env);
    const filteredLinks = links.filter(link => link.id !== id);

    if (filteredLinks.length === links.length) {
      return { success: false, error: 'Link not found' };
    }

    await saveWhatsAppLinks(filteredLinks, env);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 根据策略选择链接
async function selectLinkByStrategy(links, strategy, env) {
  switch (strategy) {
    case 'weighted_random':
      return selectWeightedRandom(links);
    case 'round_robin':
      return await selectRoundRobin(links, env);
    case 'least_used':
      return selectLeastUsed(links);
    case 'random':
    default:
      return links[Math.floor(Math.random() * links.length)];
  }
}

// 加权随机选择
function selectWeightedRandom(links) {
  const totalWeight = links.reduce((sum, link) => sum + (link.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const link of links) {
    random -= (link.weight || 1);
    if (random <= 0) {
      return link;
    }
  }

  return links[links.length - 1];
}

// 轮询选择
async function selectRoundRobin(links, env) {
  try {
    if (!env.WHATSAPP_LINKS) {
      return links[0];
    }

    const indexKey = 'round_robin_index';
    const storedIndex = await env.WHATSAPP_LINKS.get(indexKey);
    const currentIndex = storedIndex ? parseInt(storedIndex) : 0;
    const nextIndex = (currentIndex + 1) % links.length;

    await env.WHATSAPP_LINKS.put(indexKey, nextIndex.toString());

    return links[nextIndex];
  } catch (error) {
    return links[0];
  }
}

// 最少使用选择
function selectLeastUsed(links) {
  let minUsage = Infinity;
  let selectedLink = links[0];

  for (const link of links) {
    const usage = link.usageCount || 0;
    if (usage < minUsage) {
      minUsage = usage;
      selectedLink = link;
    }
  }

  return selectedLink;
}

// 记录链接使用
async function recordLinkUsage(linkId, env) {
  try {
    if (!env.WHATSAPP_LINKS) return;

    const links = await getWhatsAppLinks(env);
    const linkIndex = links.findIndex(link => link.id === linkId);

    if (linkIndex !== -1) {
      links[linkIndex].usageCount = (links[linkIndex].usageCount || 0) + 1;
      links[linkIndex].lastUsed = new Date().toISOString();
      await saveWhatsAppLinks(links, env);
    }

    // 记录统计数据
    const statsKey = 'usage_stats';
    const currentStats = await env.WHATSAPP_LINKS.get(statsKey);
    const stats = currentStats ? JSON.parse(currentStats) : {};

    if (!stats.linkStats) stats.linkStats = {};
    stats.linkStats[linkId] = (stats.linkStats[linkId] || 0) + 1;
    stats.lastUpdated = new Date().toISOString();

    await env.WHATSAPP_LINKS.put(statsKey, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to record link usage:', error);
  }
}

// 获取统计数据
async function handleGetStats(headers, env) {
  try {
    if (!env.WHATSAPP_LINKS) {
      return new Response(JSON.stringify({
        linkStats: {},
        lastUpdated: new Date().toISOString()
      }), { headers });
    }

    const statsKey = 'usage_stats';
    const currentStats = await env.WHATSAPP_LINKS.get(statsKey);
    const stats = currentStats ? JSON.parse(currentStats) : {
      linkStats: {},
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(stats), { headers });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to get stats',
      linkStats: {},
      lastUpdated: new Date().toISOString()
    }), { headers });
  }
}

// 记录点击
async function handleRecordClick(request, headers, env) {
  try {
    const body = await request.json();
    const { linkId } = body;

    if (!linkId) {
      return new Response(JSON.stringify({ error: 'Link ID required' }), {
        status: 400,
        headers
      });
    }

    await recordLinkUsage(linkId, env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Click recorded'
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to record click'
    }), {
      status: 500,
      headers
    });
  }
}