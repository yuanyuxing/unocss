import { Extractor } from '../types'
import { isValidSelector } from '../utils'

export const extractorSplit: Extractor = {
  name: 'split',
  order: 0,
  extract({ code }) {
    // 分割 \s（空格）与 '与 " 与 ` 与 ; 与 > 与 =，过滤没有a-z的字符串块 
    return new Set(code.split(/[\s'"`;>=]+/g).filter(isValidSelector))
  },
}
