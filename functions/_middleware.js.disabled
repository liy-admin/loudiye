// 全局中间件 - 在所有页面访问前检查时区
export async function onRequest(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);

    // 跳过 API 路径和静态资源的时区检查
    if (url.pathname.startsWith('/api/') ||
        url.pathname.includes('.') || // 跳过 .js, .css, .png 等文件
        url.pathname.startsWith('/_next/') ||
        url.pathname.startsWith('/static/')) {
      return;
    }

    // 执行时区检查
    const timezoneResult = await checkTimezone(context);

    // 如果时区检查返回了重定向，执行重定向
    if (timezoneResult instanceof Response) {
      return timezoneResult;
    }

    // 否则继续正常访问
    return;
  } catch (error) {
    console.error('Middleware error:', error);
    // 出错时允许继续访问，避免网站完全不可用
    return;
  }
}

// 时区检查函数
async function checkTimezone(context) {
  try {
    const { request, env } = context;

    // 从 KV 读取 UTC 开关设置
    const utcSetting = await getUTCSettingFromKV(env);

    // 如果开关是 off，允许所有访问
    if (utcSetting !== 'on') {
      return; // 继续正常访问
    }

    // 获取用户时区
    const userTimezone = getUserTimezone(request);
    console.log('User timezone:', userTimezone);

    // 检查是否为美国时区
    if (!isUSTimezone(userTimezone)) {
      console.log('Non-US timezone detected, redirecting to Google');
      return Response.redirect('https://www.google.com', 302);
    }

    // 美国时区，允许访问
    console.log('US timezone detected, allowing access');
    return; // 继续正常访问

  } catch (error) {
    console.error('Timezone check error:', error);
    // 出错时允许访问，避免误拦截
    return;
  }
}

// 从 KV 读取 UTC 开关设置
async function getUTCSettingFromKV(env) {
  try {
    if (!env.WHATSAPP_LINKS) {
      console.warn('KV namespace WHATSAPP_LINKS not found');
      return 'off'; // 默认关闭
    }

    const setting = await env.WHATSAPP_LINKS.get('UTC');
    console.log('UTC setting from KV:', setting);

    return setting ? setting.trim().toLowerCase() : 'off';
  } catch (error) {
    console.error('Error reading UTC setting from KV:', error);
    return 'off'; // 默认关闭
  }
}

// 获取用户时区
function getUserTimezone(request) {
  try {
    // 方法1: 从 Cloudflare 的 cf 对象获取时区信息
    const cf = request.cf;
    if (cf && cf.timezone) {
      return cf.timezone;
    }

    // 方法2: 从请求头获取时区信息
    const timezoneHeader = request.headers.get('cf-timezone') ||
                          request.headers.get('timezone') ||
                          request.headers.get('x-timezone');

    if (timezoneHeader) {
      return timezoneHeader;
    }

    // 方法3: 从 Accept-Language 头推断（不够准确但作为备选）
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage && acceptLanguage.includes('en-US')) {
      return 'America/New_York'; // 假设美国用户
    }

    // 默认返回 null，表示无法确定
    return null;
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return null;
  }
}

// 检查是否为美国时区
function isUSTimezone(timezone) {
  if (!timezone) {
    // 无法确定时区时，为了安全起见拒绝访问
    return false;
  }

  try {
    // 美国时区列表
    const usTimezones = [
      // 东部时间 (EST/EDT)
      'America/New_York', 'America/Detroit', 'America/Louisville',
      'America/Kentucky/Louisville', 'America/Kentucky/Monticello',
      'America/Indiana/Indianapolis', 'America/Indiana/Vincennes',
      'America/Indiana/Winamac', 'America/Indiana/Marengo',
      'America/Indiana/Petersburg', 'America/Indiana/Vevay',

      // 中部时间 (CST/CDT)
      'America/Chicago', 'America/Indiana/Tell_City', 'America/Indiana/Knox',
      'America/Menominee', 'America/North_Dakota/Center',
      'America/North_Dakota/New_Salem', 'America/North_Dakota/Beulah',

      // 山地时间 (MST/MDT)
      'America/Denver', 'America/Boise', 'America/Shiprock', 'America/Phoenix',

      // 太平洋时间 (PST/PDT)
      'America/Los_Angeles', 'America/Tijuana',

      // 阿拉斯加时间 (AKST/AKDT)
      'America/Anchorage', 'America/Juneau', 'America/Nome',
      'America/Sitka', 'America/Metlakatla', 'America/Yakutat',

      // 夏威夷时间 (HST)
      'Pacific/Honolulu', 'Pacific/Johnston',

      // 其他美国属地
      'America/Adak', 'Pacific/Guam', 'Pacific/Saipan',
      'America/Puerto_Rico', 'America/St_Thomas',

      // 简化时区名称
      'EST', 'EDT', 'CST', 'CDT', 'MST', 'MDT', 'PST', 'PDT',
      'AKST', 'AKDT', 'HST'
    ];

    // 检查完整匹配
    if (usTimezones.includes(timezone)) {
      return true;
    }

    // 检查部分匹配（以 America/ 开头的大部分都是美洲时区）
    if (timezone.startsWith('America/') || timezone.startsWith('US/')) {
      return true;
    }

    // 检查太平洋时区中的美国属地
    if (timezone.startsWith('Pacific/') &&
        ['Honolulu', 'Johnston', 'Guam', 'Saipan'].some(us => timezone.includes(us))) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking US timezone:', error);
    return false;
  }
}