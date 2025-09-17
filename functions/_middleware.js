// 全局中间件 - 在所有页面访问前检查时区
import { onRequest as timezoneCheck } from './timezone-check.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 跳过 API 路径的时区检查
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 执行时区检查
  const timezoneResult = await timezoneCheck(context);

  // 如果时区检查返回了重定向，执行重定向
  if (timezoneResult instanceof Response) {
    return timezoneResult;
  }

  // 否则继续正常访问
  return;
}