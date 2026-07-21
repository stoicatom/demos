// 把 15 个应用各自的 dist 汇聚到统一部署结构:
//   <outRoot>/micro-frontends/<framework>/<app>/
// 主应用(main / root-config / host)放在框架根目录,子应用放子目录。
// 运行:node micro-frontends/scripts/assemble-dist.mjs [outRoot]
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../..')
const mfRoot = resolve(repoRoot, 'micro-frontends')
const outRoot = resolve(repoRoot, process.argv[2] || 'dist')
const deployRoot = resolve(outRoot, 'micro-frontends')

// 源 dist 目录 → 部署子路径(相对 micro-frontends/)
const map = {
  'qiankun/main/dist': 'qiankun',
  'qiankun/sub-vue/dist': 'qiankun/sub-vue',
  'qiankun/sub-react/dist': 'qiankun/sub-react',
  'single-spa/root-config/dist': 'single-spa',
  'single-spa/sub-vue/dist': 'single-spa/sub-vue',
  'single-spa/sub-react/dist': 'single-spa/sub-react',
  'module-federation/host/dist': 'module-federation/host',
  'module-federation/remote-vue/dist': 'module-federation/remote-vue',
  'module-federation/remote-react/dist': 'module-federation/remote-react',
  'wujie/main/dist': 'wujie',
  'wujie/sub-vue/dist': 'wujie/sub-vue',
  'wujie/sub-react/dist': 'wujie/sub-react',
  'micro-app/main/dist': 'micro-app',
  'micro-app/sub-vue/dist': 'micro-app/sub-vue',
  'micro-app/sub-react/dist': 'micro-app/sub-react',
  'from-scratch/dist': 'from-scratch'
}

rmSync(outRoot, { recursive: true, force: true })
mkdirSync(deployRoot, { recursive: true })

const missing = []
for (const [from, to] of Object.entries(map)) {
  const src = resolve(mfRoot, from)
  if (!existsSync(src)) {
    missing.push(from)
    continue
  }
  const dest = resolve(deployRoot, to)
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(src, dest, { recursive: true })
  console.log(`  ✓ ${from} → micro-frontends/${to}`)
}

// 汇聚总导航页到部署根
const landing = resolve(mfRoot, 'landing/index.html')
if (existsSync(landing)) {
  cpSync(landing, resolve(deployRoot, 'index.html'))
  console.log('  ✓ landing/index.html → micro-frontends/index.html')
}

// GitHub Pages 无服务端 rewrite:给每个框架根目录生成 404.html = index.html,
// 让 history 深链(如 single-spa 的 /vue、/react)回退到应用入口
const frameworks = ['qiankun', 'single-spa', 'module-federation/host', 'wujie', 'micro-app']
for (const fw of frameworks) {
  const idx = resolve(deployRoot, fw, 'index.html')
  if (existsSync(idx)) {
    cpSync(idx, resolve(deployRoot, fw, '404.html'))
    console.log(`  ✓ ${fw}/404.html`)
  }
}

// GitHub Pages:关闭 Jekyll(否则忽略下划线开头的资源,如 MF 的 __federation_*)
writeFileSync(resolve(outRoot, '.nojekyll'), '')
console.log('  ✓ .nojekyll')

if (missing.length) {
  console.log(`\n⚠ 缺少 ${missing.length} 个 dist(需先构建):`)
  missing.forEach((m) => console.log(`  - ${m}`))
  process.exit(1)
}
console.log('\n✓ 汇聚完成:' + outRoot)
