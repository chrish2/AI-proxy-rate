export const Locale = {
  English: 'en',
  Chinese: 'zh',
} as const
export type Locale = (typeof Locale)[keyof typeof Locale]

const copy = {
  [Locale.English]: {
    proxies: 'Proxies', localVault: 'Local-only vault', refreshAll: '↻ Refresh all', addProxy: '+ Add proxy',
    yourStations: 'Your stations', health: 'Proxy health & availability', addStation: 'Add a station ↗',
    firstTitle: 'Add your first proxy station', firstBody: 'Save NewAPI or Sub2API access details locally in this browser.',
    liveResults: 'Live results', allRates: 'All reported group rates', groups: 'groups',
    group: 'Group', station: 'Station', platform: 'Platform', rateRatio: 'Rate ratio',
    table: 'Table', search: 'Search groups', allPlatforms: 'All platforms', allStations: 'All stations', filters: 'Filters', other: 'Other',
    checking: 'Checking', live: 'Live', attention: 'Needs attention', ready: 'Ready to check',
    updated: 'Updated', noRecent: 'No recent check', reportedGroup: 'reported group', reportedGroups: 'reported groups',
    checkRates: 'Check rates', hideDetails: 'Hide details', viewDetails: 'View details', baseUrl: 'Base URL', newApiUser: 'NewAPI user',
    authentication: 'Authentication', bearerToken: 'Bearer token', sessionCookie: 'Session cookie', deleteStation: 'Delete station',
    newApiStation: 'NewAPI station', sub2ApiStation: 'Sub2API station', editStation: 'Edit station', addStationTitle: 'Add a station',
    stationName: 'Station name', stationBaseUrl: 'Station base URL', checksNewApi: 'Checks /api/user/self/groups automatically.',
    checksSub2Api: 'Checks /api/v1/groups/available automatically.', userId: 'NewAPI user ID', accessToken: 'Bearer access token', optional: 'optional',
    cookiePlaceholder: 'Value after session=', tokenPlaceholder: 'Token after Bearer', sessionNote: 'Paste only the value after session=. The local bridge forwards it with New-Api-User.',
    tokenNote: 'Paste only the value after Bearer from the Sub2API Authorization header. The local bridge sends it server-side.', cancel: 'Cancel', saveChanges: 'Save changes',
  },
  [Locale.Chinese]: {
    proxies: '代理站点', localVault: '仅本地存储', refreshAll: '↻ 刷新全部', addProxy: '+ 添加站点',
    yourStations: '我的站点', health: '代理状态与可用分组', addStation: '添加站点 ↗',
    firstTitle: '添加第一个代理站点', firstBody: 'NewAPI 和 Sub2API 的连接信息仅保存在当前浏览器中。',
    liveResults: '实时结果', allRates: '全部分组费率', groups: '个分组',
    group: '分组', station: '站点', platform: '平台', rateRatio: '倍率',
    table: '表格', search: '搜索分组', allPlatforms: '所有平台', allStations: '所有站点', filters: '筛选', other: '其他',
    checking: '检查中', live: '在线', attention: '需要处理', ready: '等待检查',
    updated: '更新于', noRecent: '暂无检查记录', reportedGroup: '个已返回分组', reportedGroups: '个已返回分组',
    checkRates: '检查费率', hideDetails: '收起详情', viewDetails: '查看详情', baseUrl: '基础 URL', newApiUser: 'NewAPI 用户',
    authentication: '认证方式', bearerToken: 'Bearer 令牌', sessionCookie: '会话 Cookie', deleteStation: '删除站点',
    newApiStation: 'NewAPI 站点', sub2ApiStation: 'Sub2API 站点', editStation: '编辑站点', addStationTitle: '添加站点',
    stationName: '站点名称', stationBaseUrl: '站点基础 URL', checksNewApi: '将自动请求 /api/user/self/groups。',
    checksSub2Api: '将自动请求 /api/v1/groups/available。', userId: 'NewAPI 用户 ID', accessToken: 'Bearer 访问令牌', optional: '可选',
    cookiePlaceholder: 'session= 后面的值', tokenPlaceholder: 'Bearer 后面的令牌', sessionNote: '只需粘贴 session= 后面的值。本地桥接会同时转发 New-Api-User。',
    tokenNote: '只需粘贴 Sub2API Authorization 请求头中 Bearer 后面的值。本地桥接会在服务端发送。', cancel: '取消', saveChanges: '保存修改',
  },
} as const

export type Copy = { [Key in keyof (typeof copy)[typeof Locale.English]]: string }
export const getCopy = (locale: Locale): Copy => copy[locale]
