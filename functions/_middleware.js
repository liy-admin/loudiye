// 简化的时区中间件
export async function onRequest(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);

    // 只检查根页面，跳过所有其他路径
    if (url.pathname !== '/') {
      return;
    }

    // 检查 KV 中的 UTC 设置
    let utcSetting = 'off';
    try {
      if (env.WHATSAPP_LINKS) {
        const setting = await env.WHATSAPP_LINKS.get('UTC');
        utcSetting = setting ? setting.trim().toLowerCase() : 'off';
      }
    } catch (e) {
      console.error('KV read error:', e);
    }

    // 如果设置为 off，直接允许访问
    if (utcSetting !== 'on') {
      return;
    }

    // 简单的地区检测
    const cf = request.cf;
    const country = cf && cf.country ? cf.country : 'UNKNOWN';

    console.log('Country:', country, 'UTC setting:', utcSetting);

    // 如果不是美国，重定向到 Google
    if (country !== 'US') {
      console.log('Non-US access blocked, redirecting to Google');
      return Response.redirect('https://www.google.com', 302);
    }

    console.log('US access allowed');
    return;

  } catch (error) {
    console.error('Middleware error:', error);
    // 出错时允许访问
    return;
  }
}