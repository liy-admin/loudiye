// Cloudflare Worker for Stock Analysis WhatsApp Rotation
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// 股票分析专用 WhatsApp 账号配置
const WHATSAPP_ACCOUNTS = [
  {
    id: 1,
    phone: '8613800138001',
    message: 'Hello, I need the stock analysis report. Please send me today\'s 3 recommended quality stocks.',
    name: 'Stock Analyst Team 1',
    available: true,
    weight: 3,  // 高权重 - 主要分析师
    maxDailyClicks: 150,
    region: 'US',
    specialization: 'US_STOCKS'
  },
  {
    id: 2,
    phone: '8613800138002',
    message: 'Hi, I want to receive the AI stock analysis report and today\'s recommended stocks.',
    name: 'Stock Analyst Team 2',
    available: true,
    weight: 2,
    maxDailyClicks: 120,
    region: 'US',
    specialization: 'TECH_STOCKS'
  },
  {
    id: 3,
    phone: '8613800138003',
    message: 'Hello, please send me the AI-generated stock analysis report with today\'s top 3 stock picks.',
    name: 'Market Research Team',
    available: true,
    weight: 2,
    maxDailyClicks: 100,
    region: 'EU',
    specialization: 'MARKET_ANALYSIS'
  },
  {
    id: 4,
    phone: '8613800138004',
    message: 'Hi, I\'m interested in the stock analysis report. Can you send me the AI predictions and recommended stocks?',
    name: 'Senior Stock Advisor',
    available: true,
    weight: 4,  // 最高权重 - 资深顾问
    maxDailyClicks: 200,
    region: 'ASIA',
    specialization: 'PREMIUM_ANALYSIS'
  },
  {
    id: 5,
    phone: '8613800138005',
    message: 'Hello, I want to get the free stock analysis report and today\'s recommended quality stocks.',
    name: 'Investment Advisor',
    available: true,
    weight: 1,
    maxDailyClicks: 80,
    region: 'EU',
    specialization: 'INVESTMENT_ADVICE'
  }
]

// 时间段配置 - 根据不同时段分配不同专业的分析师
const TIME_SLOTS = [
  {
    start: 0, end: 6,
    accounts: [4], // 夜间只有资深顾问
    description: 'Night shift - Senior advisor only'
  },
  {
    start: 6, end: 9,
    accounts: [1, 2], // 早间美股开盘前
    description: 'Pre-market US stocks'
  },
  {
    start: 9, end: 16,
    accounts: [1, 2, 4], // 美股交易时间
    description: 'US market hours'
  },
  {
    start: 16, end: 18,
    accounts: [3, 5], // 美股收盘后欧洲时间
    description: 'Post-US market, EU active'
  },
  {
    start: 18, end: 22,
    accounts: [3, 4, 5], // 欧洲和亚洲时间
    description: 'EU and Asia overlap'
  },
  {
    start: 22, end: 24,
    accounts: [4], // 亚洲主要时间
    description: 'Asia market focus'
  }
]

// 当前策略
const CURRENT_STRATEGY = 'weighted_random'

// KV存储键名
const KV_NAMESPACE = 'STOCK_WHATSAPP_ROTATION'
const ROUND_ROBIN_KEY = 'stock_round_robin_index'
const CLICK_STATS_KEY = 'stock_click_stats'
const DAILY_STATS_KEY = 'stock_daily_stats'

async function handleRequest(request) {
  const url = new URL(request.url)

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  switch (url.pathname) {
    case '/api/whatsapp/link':
      return handleGetWhatsAppLink(request, headers)

    case '/api/whatsapp/stats':
      return handleGetStats(headers)

    case '/api/whatsapp/click':
      return handleRecordClick(request, headers)

    case '/api/whatsapp/accounts':
      return handleGetAccounts(headers)

    default:
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers
      })
  }
}

// 获取 WhatsApp 链接
async function handleGetWhatsAppLink(request, headers) {
  const url = new URL(request.url)
  const strategy = url.searchParams.get('strategy') || CURRENT_STRATEGY
  const stockSymbol = url.searchParams.get('stock') || null
  const userRegion = url.searchParams.get('region') || null

  try {
    const availableAccounts = await getAvailableAccounts()

    if (availableAccounts.length === 0) {
      return new Response(JSON.stringify({
        error: 'No available stock analysts',
        fallbackUrl: generateFallbackUrl(stockSymbol)
      }), {
        status: 503,
        headers
      })
    }

    // 根据策略选择账号
    let selectedAccount = await selectAccountByStrategy(availableAccounts, strategy, userRegion)

    // 生成专业的股票分析 WhatsApp 链接
    const whatsappUrl = generateStockAnalysisUrl(selectedAccount, stockSymbol)

    // 记录选择
    await recordSelection(selectedAccount.id, stockSymbol)

    return new Response(JSON.stringify({
      url: whatsappUrl,
      account: {
        id: selectedAccount.id,
        name: selectedAccount.name,
        specialization: selectedAccount.specialization,
        region: selectedAccount.region
      },
      strategy: strategy,
      stockSymbol: stockSymbol,
      timestamp: new Date().toISOString()
    }), { headers })

  } catch (error) {
    console.error('Error getting WhatsApp link:', error)

    return new Response(JSON.stringify({
      url: generateFallbackUrl(stockSymbol),
      account: null,
      strategy: 'fallback',
      error: error.message
    }), { headers })
  }
}

// 根据策略选择账号
async function selectAccountByStrategy(accounts, strategy, userRegion) {
  switch (strategy) {
    case 'weighted_random':
      return getWeightedRandomAccount(accounts)

    case 'time_based':
      return getTimeBasedAccount(accounts)

    case 'specialization':
      return getSpecializationBasedAccount(accounts, userRegion)

    case 'least_used':
      return await getLeastUsedAccount(accounts)

    case 'round_robin':
      return await getRoundRobinAccount(accounts)

    default:
      return getWeightedRandomAccount(accounts)
  }
}

// 生成股票分析专用 WhatsApp URL
function generateStockAnalysisUrl(account, stockSymbol) {
  let message = account.message

  // 如果有股票代码，添加到消息中
  if (stockSymbol) {
    message += ` I'm particularly interested in ${stockSymbol}.`
  }

  // 添加时间戳以便跟踪
  message += ` (Request time: ${new Date().toISOString().slice(0, 16)})`

  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${account.phone}?text=${encodedMessage}`
}

// 生成降级链接
function generateFallbackUrl(stockSymbol) {
  let message = 'Hello, I need the stock analysis report. Please send me today\'s 3 recommended quality stocks.'

  if (stockSymbol) {
    message += ` I'm particularly interested in ${stockSymbol}.`
  }

  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/?text=${encodedMessage}`
}

// 加权随机选择
function getWeightedRandomAccount(accounts) {
  const totalWeight = accounts.reduce((sum, a) => sum + (a.weight || 1), 0)
  let random = Math.random() * totalWeight

  for (const account of accounts) {
    random -= (account.weight || 1)
    if (random <= 0) {
      return account
    }
  }

  return accounts[accounts.length - 1]
}

// 基于时间段选择
function getTimeBasedAccount(accounts) {
  const now = new Date()
  const hour = now.getUTCHours() // 使用 UTC 时间

  for (const slot of TIME_SLOTS) {
    if (hour >= slot.start && hour < slot.end) {
      const slotAccounts = accounts.filter(a => slot.accounts.includes(a.id))
      if (slotAccounts.length > 0) {
        return getWeightedRandomAccount(slotAccounts)
      }
    }
  }

  return getWeightedRandomAccount(accounts)
}

// 基于专业领域选择
function getSpecializationBasedAccount(accounts, userRegion) {
  // 根据用户地区优先选择相应专业
  const regionSpecialization = {
    'US': ['US_STOCKS', 'TECH_STOCKS'],
    'EU': ['MARKET_ANALYSIS', 'INVESTMENT_ADVICE'],
    'ASIA': ['PREMIUM_ANALYSIS']
  }

  if (userRegion && regionSpecialization[userRegion]) {
    const specializedAccounts = accounts.filter(a =>
      regionSpecialization[userRegion].includes(a.specialization)
    )
    if (specializedAccounts.length > 0) {
      return getWeightedRandomAccount(specializedAccounts)
    }
  }

  return getWeightedRandomAccount(accounts)
}

// 最少使用选择
async function getLeastUsedAccount(accounts) {
  try {
    const stats = await getClickStats()

    let minClicks = Infinity
    let selectedAccount = accounts[0]

    for (const account of accounts) {
      const clicks = stats.total?.[account.id] || 0
      if (clicks < minClicks) {
        minClicks = clicks
        selectedAccount = account
      }
    }

    return selectedAccount
  } catch (e) {
    return getWeightedRandomAccount(accounts)
  }
}

// 顺序轮询
async function getRoundRobinAccount(accounts) {
  try {
    const stored = await KV_NAMESPACE.get(ROUND_ROBIN_KEY)
    const currentIndex = stored ? parseInt(stored) : 0
    const nextIndex = (currentIndex + 1) % accounts.length
    await KV_NAMESPACE.put(ROUND_ROBIN_KEY, nextIndex.toString())
    return accounts[nextIndex]
  } catch (e) {
    return accounts[0]
  }
}

// 获取可用账号
async function getAvailableAccounts() {
  const dailyStats = await getDailyStats()
  const today = new Date().toISOString().split('T')[0]

  return WHATSAPP_ACCOUNTS.filter(account => {
    if (!account.available) return false

    // 检查每日限制
    const dailyClicks = dailyStats[today]?.[account.id] || 0
    if (account.maxDailyClicks && dailyClicks >= account.maxDailyClicks) {
      return false
    }

    return true
  })
}

// 记录选择
async function recordSelection(accountId, stockSymbol = null) {
  try {
    const stats = await getClickStats()
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // 更新总计
    if (!stats.total) stats.total = {}
    stats.total[accountId] = (stats.total[accountId] || 0) + 1

    // 更新今日
    if (!stats.daily) stats.daily = {}
    if (!stats.daily[today]) stats.daily[today] = {}
    stats.daily[today][accountId] = (stats.daily[today][accountId] || 0) + 1

    // 记录股票代码（如果有）
    if (stockSymbol) {
      if (!stats.stocks) stats.stocks = {}
      stats.stocks[stockSymbol] = (stats.stocks[stockSymbol] || 0) + 1
    }

    stats.lastUpdated = now.toISOString()

    await KV_NAMESPACE.put(CLICK_STATS_KEY, JSON.stringify(stats))
  } catch (e) {
    console.error('Failed to record selection:', e)
  }
}

// 记录点击
async function handleRecordClick(request, headers) {
  try {
    const body = await request.json()
    const { accountId, stockSymbol } = body

    if (!accountId) {
      return new Response(JSON.stringify({ error: 'Account ID required' }), {
        status: 400,
        headers
      })
    }

    await recordSelection(accountId, stockSymbol)

    return new Response(JSON.stringify({
      success: true,
      message: 'Click recorded'
    }), { headers })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to record click' }), {
      status: 500,
      headers
    })
  }
}

// 获取统计数据
async function getClickStats() {
  try {
    const stored = await KV_NAMESPACE.get(CLICK_STATS_KEY)
    return stored ? JSON.parse(stored) : { total: {}, daily: {}, stocks: {} }
  } catch (e) {
    return { total: {}, daily: {}, stocks: {} }
  }
}

// 获取每日统计
async function getDailyStats() {
  try {
    const stored = await KV_NAMESPACE.get(DAILY_STATS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    return {}
  }
}

// 获取统计信息
async function handleGetStats(headers) {
  const stats = await getClickStats()
  const dailyStats = await getDailyStats()
  const today = new Date().toISOString().split('T')[0]

  const enrichedStats = WHATSAPP_ACCOUNTS.map(account => {
    const totalClicks = stats.total?.[account.id] || 0
    const todayClicks = dailyStats[today]?.[account.id] || 0
    const totalSum = Object.values(stats.total || {}).reduce((a, b) => a + b, 0)

    return {
      ...account,
      totalClicks,
      todayClicks,
      percentage: totalSum > 0 ? ((totalClicks / totalSum) * 100).toFixed(2) + '%' : '0%',
      remainingToday: account.maxDailyClicks ? Math.max(0, account.maxDailyClicks - todayClicks) : 'Unlimited'
    }
  })

  return new Response(JSON.stringify({
    accounts: enrichedStats,
    popularStocks: stats.stocks || {},
    lastUpdated: stats.lastUpdated,
    currentStrategy: CURRENT_STRATEGY,
    today: today
  }), { headers })
}

// 获取所有账号
async function handleGetAccounts(headers) {
  const availableAccounts = await getAvailableAccounts()

  return new Response(JSON.stringify({
    accounts: WHATSAPP_ACCOUNTS,
    available: availableAccounts,
    total: WHATSAPP_ACCOUNTS.length,
    availableCount: availableAccounts.length,
    timeSlots: TIME_SLOTS
  }), { headers })
}