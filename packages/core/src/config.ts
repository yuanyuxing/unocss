import { UserShortcuts, UserConfig, ResolvedConfig, UserConfigDefaults, Shortcut } from './types'
import { isStaticRule, mergeDeep, normalizeVariant, toArray, uniq } from './utils'
import { extractorSplit } from './extractors'

/**
 * 转化例子
 * [{a: b, c:d}, [e,f,g]] => [[a,b], [c,d],[e,f,g]]
 * @param shortcuts 
 * @returns 
 */
export function resolveShortcuts(shortcuts: UserShortcuts): Shortcut[] {
  return toArray(shortcuts).flatMap((s) => {
    if (Array.isArray(s))
      return [s]
    return Object.entries(s)
  })
}

const defaultLayers = {
  shortcuts: -1,
  default: 0,
}

export function resolveConfig(
  userConfig: UserConfig = {},
  defaults: UserConfigDefaults = {},
): ResolvedConfig {
  // 自定义配置 和 默认配置合并
  const config = Object.assign({}, defaults, userConfig) as UserConfigDefaults
  // 获取合并后的预设（presets）
  const rawPresets = config.presets || []

  // 预设排序（pre => undefined => post）
  const sortedPresets = [
    ...rawPresets.filter(p => p.enforce === 'pre'),
    ...rawPresets.filter(p => !p.enforce),
    ...rawPresets.filter(p => p.enforce === 'post'),
  ]

  const layers = Object.assign(defaultLayers, ...rawPresets.map(i => i.layers), userConfig.layers)

  // 合并Preset（要唯一）
  // 预设中的'rules' | 'variants' | 'extractors' | 'shortcuts' | 'preflights'会和配置中的合并
  function mergePresets<T extends 'rules' | 'variants' | 'extractors' | 'shortcuts' | 'preflights'>(key: T): Required<UserConfig>[T] {
    return uniq([
      ...sortedPresets.flatMap(p => toArray(p[key] || []) as any[]),
      ...toArray(config[key] || []) as any[],
    ])
  }

  const extractors = mergePresets('extractors')
  if (!extractors.length)
    extractors.push(extractorSplit)
  extractors.sort((a, b) => (a.order || 0) - (b.order || 0)) // 降序排序

  const rules = mergePresets('rules')
  const rulesStaticMap: ResolvedConfig['rulesStaticMap'] = {} // 静态规则映射

  const rulesSize = rules.length

  rules.forEach((rule, i) => {
    if (isStaticRule(rule)) {
      rulesStaticMap[rule[0]] = [i, rule[1], rule[2]]
      // delete static rules so we can't skip them in matching
      // but keep the order
      delete rules[i]
    }
  })

  // 主题合并（累加合并）
  const theme = [
    ...sortedPresets.map(p => p.theme || {}),
    config.theme || {},
  ].reduce((a, p) => mergeDeep(a, p), {})

  return {
    mergeSelectors: true,
    warnExcluded: true,
    excluded: [],
    presets: [],
    sortLayers: layers => layers,
    ...config,
    envMode: config.envMode || 'build',
    shortcutsLayer: config.shortcutsLayer || 'shortcuts',
    layers,
    theme,
    rulesSize, // 规则长度
    rulesDynamic: rules as ResolvedConfig['rulesDynamic'], // 动态规则映射
    rulesStaticMap, // 静态规则映射
    preflights: mergePresets('preflights'),
    variants: mergePresets('variants').map(normalizeVariant),
    shortcuts: resolveShortcuts(mergePresets('shortcuts')),
    extractors,
  }
}
