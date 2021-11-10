import fs from 'fs'
import findUp from 'find-up'  // https://github.com/sindresorhus/find-up 查找配置文件
import { UserConfig } from '@unocss/core'
import { transform } from 'sucrase' // https://github.com/alangpierce/sucrase 配置文件转换（有各种文件，转换成.js）比babel快

export interface ConfigResult<U> {
  filepath?: string
  config?: U
}

// 判断是否是目录
function isDir(path: string) {
  try {
    const stat = fs.lstatSync(path)
    return stat.isDirectory()
  }
  catch (e) {
    return false
  }
}

// 加载配置文件
export function loadConfig<U extends UserConfig>(dirOrPath: string | U = process.cwd()): ConfigResult<U> {
  if (typeof dirOrPath !== 'string') {
    return {
      config: dirOrPath,
    }
  }

  const filepath = isDir(dirOrPath)
    ? findUp.sync([
      'unocss.config.js',
      'unocss.config.cjs',
      'unocss.config.mjs',
      'unocss.config.ts',
      'unocss.config.mts',
      'unocss.config.cts',
    ], { cwd: dirOrPath! })
    : dirOrPath

  if (!filepath || !fs.existsSync(filepath))
    return {}

  return readConfig<U>(filepath)
}

// 读取配置暴露的模块
export function readConfig<U>(filepath: string): ConfigResult<U> {
  const content = fs.readFileSync(filepath, 'utf-8')
  const transformed = transform(content, { transforms: ['typescript', 'imports'] }).code

  // eslint-disable-next-line no-new-func
  const result = (new Function('require', `let exports = {};${transformed}; return exports.default;`))(require)

  return {
    filepath,
    config: result,
  }
}
