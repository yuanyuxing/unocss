import { BetterMap, UnoGenerator } from '@unocss/core'
import { UnocssPluginOptions } from './types'

export function createContext(
  uno: UnoGenerator,
  config: UnocssPluginOptions,
  configFilepath?: string,
) {
  const invalidations: Array<() => void> = []

  const modules = new BetterMap<string, string>()
  const tokens = new Set<string>()

  function invalidate() {
    invalidations.forEach(cb => cb())
  }

  async function scan(code: string, id?: string) {
    if (id)
      modules.set(id, code)
    await uno.applyExtractors(code, id, tokens)
    invalidate()
  }

  return {
    tokens, // 空令牌数组
    modules, // 空模块集合
    invalidate, // 函数集合
    onInvalidate(fn: () => void) {
      invalidations.push(fn)
    },  // push fn in invalidate
    uno,
    scan,
    config, // 配置信息
    configFilepath, // 配置文件路径
  }
}

export type UnocssPluginContext = ReturnType<typeof createContext>
