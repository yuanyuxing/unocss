import { loadConfig } from '@unocss/config'
import { Plugin } from 'vite'
import { UnocssPluginContext } from './context'

export function ConfigHMRPlugin({ uno, configFilepath: filepath, invalidate, tokens, modules }: UnocssPluginContext): Plugin | undefined {
  return {
    name: 'unocss:config',
    configureServer(server) {
      uno.config.envMode = 'dev'

      if (!filepath)
        return
      server.watcher.add(filepath)
      server.watcher.on('change', async(p) => {
        if (p !== filepath)
          return
        uno.setConfig(loadConfig(filepath).config)
        uno.config.envMode = 'dev'
        tokens.clear()
        await Promise.all(modules.map((code, id) => uno.applyExtractors(code, id, tokens)))
        invalidate()
      })
    },
  }
}
