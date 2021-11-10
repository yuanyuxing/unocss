import { FilterPattern } from '@rollup/pluginutils'
import { UserConfig } from '@unocss/core'

export interface VitePluginOptions {
  include?: FilterPattern
  exclude?: FilterPattern

  /**
   * Enable UnoCSS inspector
   *
   * @default true
   */
  inspector?: boolean

  /**
   * CSS Generation mode
   *
   * - `global` - generate a single CSS sheet for entire App
   * - `dist-chunk` - generate a CSS sheet for each code chunk on build, great for MPA
   * - `per-module` - generate a CSS sheet for each module, can be scoped
   * - `vue-scoped` - inject generated CSS to Vue SFC's `<style scoped>` for isolation
   *
   * @default 'global'
   */
  mode?: 'global' | 'per-module' | 'vue-scoped' | 'dist-chunk'
}

export interface UnocssPluginOptions extends UserConfig, VitePluginOptions {}
