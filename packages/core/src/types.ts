import type { UnoGenerator } from './generator'

/* eslint-disable no-use-before-define */
export type Awaitable<T> = T | Promise<T>
export type ArgumentType<T> = T extends ((...args: infer A) => any) ? A : never
export type Shift<T> = T extends [_: any, ...args: infer A] ? A : never
export type RestArgs<T> = Shift<ArgumentType<T>>
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> }

export type CSSObject = Record<string, string | number | undefined>
export type CSSEntries = [string, string | number | undefined][]

export interface RuleContext<Theme extends {} = {}> {
  /**
   * Unprocessed selector from user input.
   * Useful for generating CSS rule.
   */
  rawSelector: string
  /**
   * Current selector for rule matching
   */
  currentSelector: string
  /**
   * UnoCSS generator instance
   */
  generator: UnoGenerator
  /**
   * The theme object
   */
  theme: Theme
  /**
   * Matched variants handlers for this rule.
   */
  variantHandlers: VariantHandler[]
  /**
   * Constrcut a custom CSS rule.
   * Variants and selector escaping will be handled automatically.
   */
  constructCSS: (body: CSSEntries | CSSObject, overrideSelector?: string) => string
}

export interface ExtractorContext {
  readonly original: string
  code: string
  id?: string
}

export interface Extractor {
  name: string
  extract(ctx: ExtractorContext): Awaitable<Set<string> | undefined>
  order?: number
}

export interface RuleMeta {
  layer?: string
}

export type DynamicMatcher<Theme extends {} = {}> = ((match: string[], context: Readonly<RuleContext<Theme>>) => Awaitable<CSSObject | CSSEntries | string | undefined>)
export type DynamicRule<Theme extends {} = {}> = [RegExp, DynamicMatcher<Theme>] | [RegExp, DynamicMatcher<Theme>, RuleMeta]
export type StaticRule = [string, CSSObject | CSSEntries] | [string, CSSObject | CSSEntries, RuleMeta]
export type Rule<Theme extends {} = {}> = DynamicRule<Theme> | StaticRule

export type DynamicShortcutMatcher = ((match: string[]) => (string | string [] | undefined))

export type DynamicShortcut = [RegExp, DynamicShortcutMatcher] | [RegExp, DynamicShortcutMatcher, RuleMeta]
export type StaticShortcut = [string, string | string[]] | [string, string | string[], RuleMeta]
export type StaticShortcutMap = Record<string, string | string[]>
export type UserShortcuts = StaticShortcutMap | (StaticShortcut | DynamicShortcut | StaticShortcutMap)[]
export type Shortcut = StaticShortcut | DynamicShortcut

export interface Preflight {
  getCSS: () => string | undefined
  layer?: string
}

export type ExcludeRule = string | RegExp

export interface VariantHandler {
  /**
   * The result rewritten selector for the next round of matching
   */
  matcher: string
  /**
   * Rewrite the output selector. Often be used to append pesudo classes or parents.
   */
  selector?: (input: string) => string | undefined
  /**
   * Rewrite the output css body. The input come in [key,value][] pairs.
   */
  body?: (body: CSSEntries) => CSSEntries | undefined
  /**
   * Provide media query to the output css.
   */
  mediaQuery?: string | undefined
}

export type VariantFunction<Theme extends {} = {}> = (matcher: string, raw: string, theme: Theme) => string | VariantHandler | undefined

export type VariantObject<Theme extends {} = {}> = {
  /**
   * The entry function to match and rewrite the selector for futher processing.
   */
  match: VariantFunction<Theme>

  /**
   * Allows this variant to be used more than once in matching a single rule
   *
   * @default false
   */
  multiPass?: boolean
}

export type Variant<Theme extends {} = {}> = VariantFunction<Theme> | VariantObject<Theme>

export interface ConfigBase<Theme extends {} = {}> {
  /**
   * Rules to generate CSS utilities
   */
  rules?: Rule[]

  /**
   * Variants that preprocess the selectors,
   * having the ability to rewrite the CSS object.
   */
  variants?: Variant[]

  /**
   * Similar to Windi CSS's shortcuts,
   * allows you have create new utilities by combining existing ones.
   */
  shortcuts?: UserShortcuts

  /**
   * Rules to exclude the selectors for your design system (to narrow down the possibilities).
   * Combining `warnExcluded` options it can also helps you identify wrong usages.
   */
  excluded?: ExcludeRule[]

  /**
   * Extractors to handle the source file and outputs possible classes/selectors
   * Can be language-aware.
   */
  extractors?: Extractor[]

  /**
   * Raw CSS injections.
   */
  preflights?: Preflight[]

  /**
   * Theme object for shared configuration between rules
   */
  theme?: Theme

  /**
   * Layer orders. Default to 0.
   */
  layers?: Record<string, number>

  /**
   * Custom function to sort layers.
   */
  sortLayers?: (layers: string[]) => string[]
}

export interface Preset extends ConfigBase {
  name: string
  enforce?: 'pre' | 'post'
}

export interface GeneratorOptions {
  /**
   * Merge utilities with the exact same body to save the file size
   *
   * @default true
   */
  mergeSelectors?: boolean

  /**
   * Emit warning when excluded selectors are found
   *
   * @default true
   */
  warnExcluded?: boolean
}

export interface UserOnlyOptions<Theme extends {} = {}> {
  /**
   * The theme object, will be merged with the theme provides by presets
   */
  theme?: Theme

  /**
   * Layout name of shortcuts
   *
   * @default 'shortcuts'
   */
  shortcutsLayer?: string

  /**
   * Presets
   */
  presets?: Preset[]

  /**
   * Environment mode
   *
   * @default 'build'
   */
  envMode?: 'dev' | 'build'
}

export interface UserConfig<Theme extends {} = {}> extends ConfigBase<Theme>, UserOnlyOptions<Theme>, GeneratorOptions {}
export interface UserConfigDefaults<Theme extends {} = {}> extends ConfigBase<Theme>, UserOnlyOptions<Theme> {}

export interface ResolvedConfig extends Omit<Required<UserConfig>, 'rules' | 'shortcuts'> {
  shortcuts: Shortcut[]
  variants: VariantObject[]
  rulesSize: number
  rulesDynamic: (DynamicRule|undefined)[]
  rulesStaticMap: Record<string, [number, CSSObject | CSSEntries, RuleMeta | undefined] | undefined>
}

export interface GenerateResult {
  css: string
  layers: string[]
  getLayer(name?: string): string | undefined
  getLayers(excludes?: string[]): string
  matched: Set<string>
}

export type VariantMatchedResult = readonly [
  raw: string,
  current: string,
  variants: VariantHandler[]
]

export type ParsedUtil = readonly [
  index: number,
  raw: string,
  entries: CSSEntries,
  meta: RuleMeta | undefined,
  variants: VariantHandler[]
]

export type RawUtil = readonly [
  index: number,
  rawCSS: string,
  meta: RuleMeta | undefined,
]

export type StringifiedUtil = readonly [
  index: number,
  selector: string | undefined,
  body: string,
  mediaQuery: string | undefined,
  meta: RuleMeta | undefined,
]

export interface GenerateOptions {
  /**
   * Filepath of the file being processed.
   */
  id?: string

  /**
   * Generate preflights (if defined)
   *
   * @default true
   */
  preflights?: boolean

  /**
   * @expiremental
   */
  scope?: string

  /**
   * Show layer seperator in comments
   *
   * @default true
   */
  layerComments?: boolean
}
