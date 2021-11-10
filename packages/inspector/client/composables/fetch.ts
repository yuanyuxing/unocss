import { Ref, unref } from 'vue'
import { ModuleInfo, OverviewInfo, ProjectInfo, Result } from '../../types'

const API_ROOT = '/__unocss_api'

export const info = ref<ProjectInfo>()

fetch(API_ROOT)
  .then(r => r.json())
  .then(r => info.value = r)

export function fetchModule(id: string | Ref<string>) {
  return useFetch(computed(() => `${API_ROOT}/module?id=${encodeURIComponent(unref(id))}`), { refetch: true })
    .json<ModuleInfo>()
}

export function fetchRepl(input: Ref<string>) {
  const debounced = useDebounce(input, 500)
  return useFetch(computed(() => `${API_ROOT}/repl?token=${encodeURIComponent(debounced.value)}`), { refetch: true })
    .json<Result>()
}

export function fetchOverview() {
  return useFetch(computed(() => `${API_ROOT}/overview`), { refetch: true })
    .json<OverviewInfo>()
}

export interface ModuleDest {
  full: string
  path: string
}

export interface TreeNode {
  name?: string
  children: Record<string, TreeNode>
  items: ModuleDest[]
}

export const moduleTree = computed(() => {
  if (!info.value) {
    return {
      workspace: { children: {}, items: [] },
      root: { children: {}, items: [] },
    }
  }

  const modules: ModuleDest[] = info.value.modules.map(i => ({ full: i, path: i }))
  const inWorkspace = modules.filter(i => i.full.startsWith(info.value!.root))
  const inRoot = modules.filter(i => !i.full.startsWith(info.value!.root))
  inWorkspace.forEach(i => i.path = i.path.slice(info.value!.root.length + 1))

  return {
    workspace: toTree(inWorkspace, 'Project Root'),
    root: toTree(inRoot, 'Disk Root'),
  }
})

function toTree(modules: ModuleDest[], name: string) {
  const node: TreeNode = { name, children: {}, items: [] }

  function add(mod: ModuleDest, parts: string[], current = node) {
    if (parts.length <= 1) {
      current.items.push(mod)
      return
    }

    const first = parts.shift()!
    if (!current.children[first])
      current.children[first] = { name: first, children: {}, items: [] }
    add(mod, parts, current.children[first])
  }

  modules.forEach((m) => {
    const parts = m.path.split(/\//g).filter(Boolean)
    add(m, parts)
  })

  return node
}
