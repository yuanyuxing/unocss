import { createGenerator, GenerateResult, UserConfig } from 'unocss'
import * as __unocss from 'unocss'
import { customConfigRaw, inputHTML } from './url'
import { defaultConfig } from './config'

export { customConfigRaw, inputHTML } from './url'

const modules: any = {
  unocss: __unocss,
}

let customConfig: UserConfig = {}

export const init = ref(false)
export const customConfigError = ref<Error>()

export const uno = createGenerator({}, defaultConfig.value)
export const options = useStorage('unocss-options', {})
export const output = shallowRef<GenerateResult>()

debouncedWatch(
  customConfigRaw,
  evaluateConfig,
  { debounce: 300, immediate: true },
)

watch(
  inputHTML,
  generate,
  { immediate: true },
)

const AsyncFunction = Object.getPrototypeOf(async() => {}).constructor

export async function evaluateConfig() {
  customConfigError.value = undefined
  const code = customConfigRaw.value
    .replace(/import\s*(.*?)\s*from\s*(['"])([\w-]+)\2/g, 'const $1 = await __require("$3");')
    .replace(/export default /, 'return ')

  const __require = (name: string): any => {
    return modules[name]
  }

  try {
    // eslint-disable-next-line no-new-func
    const fn = new AsyncFunction('__require', code)

    const result = await fn(__require)

    if (result) {
      customConfig = result
      uno.setConfig(customConfig, defaultConfig.value)
      generate()
    }
  }
  catch (e: any) {
    customConfigError.value = e
  }
}

watch(defaultConfig, () => {
  uno.setConfig(customConfig, defaultConfig.value)
  generate()
})

export async function generate() {
  output.value = await uno.generate(inputHTML.value)
  init.value = true
}
