// 简化的 WhatsApp 轮询 API - 从 KV 读取 ws1, ws2, ws3
export async function onRequest(context) {
  const { request, env } = context;

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // 从 KV 读取 ws1, ws2, ws3
    const links = await getWhatsAppLinksFromKV(env);

    // 调试信息
    // console.log('KV binding available:', !!env.WHATSAPP_LINKS);
    // console.log('Found links:', links);

    if (!links || links.length === 0) {
      return new Response(JSON.stringify({
        error: 'No WhatsApp links configured',
        fallbackUrl: 'https://wa.me/?text=Hello',
        debug: {
          kvBinding: !!env.WHATSAPP_LINKS,
          foundLinks: links
        }
      }), {
        status: 503,
        headers
      });
    }

    // 简单随机选择
    const selectedLink = links[Math.floor(Math.random() * links.length)];

    return new Response(JSON.stringify({
      url: selectedLink,
      timestamp: new Date().toISOString()
    }), { headers });

  } catch (error) {
    console.error('Error getting WhatsApp link:', error);

    return new Response(JSON.stringify({
      url: 'https://wa.me/?text=Hello',
      error: error.message
    }), { headers });
  }
}

// 从 KV 读取 ws1, ws2, ws3 的值
async function getWhatsAppLinksFromKV(env) {
  try {
    if (!env.WHATSAPP_LINKS) {
      console.warn('KV namespace WHATSAPP_LINKS not found');
      return [];
    }

    const links = [];
    let index = 1;

    // 动态遍历 ws+数字 的 key
    while (true) {
      const key = `ws${index}`;
      try {
        const value = await env.WHATSAPP_LINKS.get(key);
        console.log(`Reading ${key}:`, value);
        if (value && value.trim()) {
          links.push(value.trim());
          index++;
        } else {
          // 如果没有值则停止遍历
          break;
        }
      } catch (error) {
        console.error(`Error reading ${key}:`, error);
        break;
      }
    }

    return links;
  } catch (error) {
    console.error('Error getting WhatsApp links from KV:', error);
    return [];
  }
}