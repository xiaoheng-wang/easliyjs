import { join, relative, resolve } from 'path' // 导入路径相关模块
import fs from 'fs-extra' // 导入文件系统模块
import matter from 'gray-matter' // 导入处理Markdown文件的模块
import fg from 'fast-glob' // 导入快速文件匹配模块
import Git from 'simple-git' // 导入Git操作模块
import { packages } from '../../meta/packages' // 导入packages数据
import type { PackageIndexes, EFunction, VmePackage } from '../../meta/types' // 导入类型定义

const git = Git() // 创建Git实例
const DOCS_URL = '' // 定义文档URL
const DIR_ROOT = resolve(__dirname, '../../') // 获取根目录路径
const DIR_DCS = resolve(__dirname, '../../docs/packages') // 获取文档目录路径
const DIR_SRC = resolve(__dirname, '../../packages/utils') // 获取源代码目录路径

// 获取指定目录下的所有子目录
async function getFunctions(dir: string) {
  const files = await fg('*', {
    onlyDirectories: true,
    cwd: dir,
    ignore: ['_*', 'dist', 'node_modules'],
  })
  files.sort()
  return files
}

// 数组去重函数
export function uniq<T extends any[]>(a: T) {
  return Array.from(new Set(a))
}

// 获取函数分类
function getCategories(functions: EFunction[]): string[] {
  return uniq(functions.map((i) => i.category).filter(Boolean))
}

// 规范化描述文本
function normalizeDesc(desc: string): string {
  let description =
    (desc
      .replace(/\r\n/g, '\n')
      .match(/# \w+[\s\n]+(.+?)(?:, |\. |\n|\.\n)/m) || [])[1] || ''
  description = description.trim()
  description = description.charAt(0).toLowerCase() + description.slice(1)
  return description
}

// 生成元数据
export async function generateMetadata() {
  const pkgs: PackageIndexes = {
    packages: {},
    categories: [],
    functions: [],
    // vueHooks: [],
    // reactHooks: [],
    // configCategories: [],
    // configs: [],
  }

  // 遍历packages数据
  for (const info of packages) {
    const dir = join(DIR_SRC, info.name)
    const docs = join(DIR_DCS, info.name)

    // package
    const pkg: VmePackage = {
      ...info,
      dir: relative(DIR_ROOT, dir).replace(/\\/g, '/'),
      docs: relative(DIR_ROOT, docs).replace(/\\/g, '/'),
    }
    pkgs.packages[info.name] = pkg

    const functions = await getFunctions(dir)

    // functions
    await Promise.all(
      functions.map(async (fnName) => {
        const mdPath = join(docs, fnName, 'index.md')
        const tsPath = join(dir, fnName, 'index.ts')

        // parse markdown
        const mdRaw = await fs.readFile(mdPath, 'utf-8')
        const { content: md, data: frontmatter } = matter(mdRaw)

        // parse description
        const description = normalizeDesc(md)

        // functions
        const fn: EFunction = {
          name: fnName,
          package: pkg.name,
          lastUpdated:
            +(await git.raw(['log', '-1', '--format=%at', tsPath])) * 1000,
          docs: `${DOCS_URL}/${pkg.name}/${fnName}/`,
          description,
          category: frontmatter.category,
        }
        pkgs.functions.push(fn)
      })
    )
  }

  pkgs.functions.sort((a, b) => a.name.localeCompare(b.name))
  pkgs.categories = getCategories(pkgs.functions)

  return pkgs
}
