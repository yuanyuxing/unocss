import type { Plugin, ViteDevServer } from 'vite'
import { createFilter } from '@rollup/pluginutils'
import { defaultExclude, defaultInclude, getHash } from '../utils'
import { UnocssPluginContext } from '../context'

const VIRTUAL_PREFIX = '/@unocss/'
const SCOPE_IMPORT_RE = / from (['"])(@unocss\/scope)\1/

export function PerModuleModePlugin({ uno, config }: UnocssPluginContext): Plugin {
  const moduleMap = new Map<string, [string, string]>()
  let server: ViteDevServer | undefined

  const filter = createFilter(
    config.include || defaultInclude,
    config.exclude || defaultExclude,
  )

  const invalidate = (hash: string) => {
    if (!server)
      return
    const id = `${VIRTUAL_PREFIX}${hash}.css`
    const mod = server.moduleGraph.getModuleById(id)
    if (!mod)
      return
    server.moduleGraph.invalidateModule(mod)
    server.ws.send({
      type: 'update',
      updates: [{
        acceptedPath: id,
        path: id,
        timestamp: +Date.now(),
        type: 'js-update',
      }],
    })
  }

  return {
    name: 'unocss:module-scope',
    enforce: 'post',
    configureServer(_server) {
      server = _server
    },
    async transform(code, id) {
      if (!filter(id))
        return

      const hash = getHash(id)
      const hasScope = code.match(SCOPE_IMPORT_RE)

      const { css } = await uno.generate(code, { id, scope: hasScope ? `.${hash}` : undefined, preflights: false })
      if (!css && !hasScope)
        return null

      if (hasScope)
        code = code.replace(SCOPE_IMPORT_RE, ` from 'data:text/javascript;base64,${Buffer.from(`export default () => "${hash}"`).toString('base64')}'`)

      moduleMap.set(hash, [id, css])
      invalidate(hash)

      return {
        code: `import "${VIRTUAL_PREFIX}${hash}.css";${code}`,
        map: null,
      }
    },
    resolveId(id) {
      return id.startsWith(VIRTUAL_PREFIX) ? id : null
    },
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX))
        return null

      const hash = id.slice(VIRTUAL_PREFIX.length, -'.css'.length)

      const [source, css] = moduleMap.get(hash) || []

      if (source)
        this.addWatchFile(source)

      return `\n/* unocss ${source} */\n${css}`
    },
  }
}
