// 时区访问限制 - Cloudflare Pages Function
export async function onRequest(context) {
  const { request, env } = context;

  try {
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
}

// 检查是否为美国时区
function isUSTimezone(timezone) {
  if (!timezone) {
    // 无法确定时区时，为了安全起见拒绝访问
    return false;
  }

  // 美国时区列表
  const usTimezones = [
    // 东部时间 (EST/EDT)
    'America/New_York',
    'America/Detroit',
    'America/Louisville',
    'America/Kentucky/Louisville',
    'America/Kentucky/Monticello',
    'America/Indiana/Indianapolis',
    'America/Indiana/Vincennes',
    'America/Indiana/Winamac',
    'America/Indiana/Marengo',
    'America/Indiana/Petersburg',
    'America/Indiana/Vevay',
    'America/Toronto', // 虽然是加拿大，但东部时间

    // 中部时间 (CST/CDT)
    'America/Chicago',
    'America/Indiana/Tell_City',
    'America/Indiana/Knox',
    'America/Menominee',
    'America/North_Dakota/Center',
    'America/North_Dakota/New_Salem',
    'America/North_Dakota/Beulah',
    'America/Winnipeg', // 虽然是加拿大，但中部时间

    // 山地时间 (MST/MDT)
    'America/Denver',
    'America/Boise',
    'America/Shiprock',
    'America/Phoenix', // 亚利桑那州（不使用夏令时）

    // 太平洋时间 (PST/PDT)
    'America/Los_Angeles',
    'America/Tijuana',
    'America/Vancouver', // 虽然是加拿大，但太平洋时间

    // 阿拉斯加时间 (AKST/AKDT)
    'America/Anchorage',
    'America/Juneau',
    'America/Nome',
    'America/Sitka',
    'America/Metlakatla',
    'America/Yakutat',

    // 夏威夷时间 (HST)
    'Pacific/Honolulu',
    'Pacific/Johnston',

    // 其他美国属地
    'America/Adak', // 阿留申群岛
    'Pacific/Guam', // 关岛
    'Pacific/Saipan', // 北马里亚纳群岛
    'America/Puerto_Rico', // 波多黎各
    'America/St_Thomas', // 美属维尔京群岛

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
}