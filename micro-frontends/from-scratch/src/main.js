import {
  registerApplication,
  start,
  patchHistoryApi,
  getAppStatus,
  getMountedApps
} from './mini-single-spa.js'
import { MiniWithSandbox } from './mini-with-sandbox.js'
import { MiniWujie } from './mini-wujie.js'

// ---------- 通用日志工具 ----------
function makeLogger(id) {
  const el = document.getElementById(id)
  return (msg, type = '') => {
    const line = document.createElement('div')
    if (type) line.className = type
    line.textContent = msg
    el.appendChild(line)
    el.scrollTop = el.scrollHeight
  }
}

// ========== 1. mini-single-spa ==========
;(function demoSingleSpa() {
  const log = makeLogger('ss-log')
  const viewport = document.getElementById('ss-viewport')

  // 用纯函数模拟两个子应用的生命周期(真实项目里是 System.import 的模块)
  function makeApp(name, color, label) {
    let el = null
    return {
      async bootstrap() {
        log(`  [${name}] bootstrap()`, 'info')
      },
      async mount() {
        el = document.createElement('div')
        el.style.cssText = `padding:12px;border:2px dashed ${color};border-radius:8px;color:${color}`
        el.textContent = label
        viewport.appendChild(el)
        log(`  [${name}] mount() → 已渲染`, '')
      },
      async unmount() {
        el && el.remove()
        el = null
        log(`  [${name}] unmount() → 已移除`, 'info')
      }
    }
  }

  registerApplication({
    name: 'sub-vue',
    app: async () => {
      log('  [sub-vue] 加载模块…', 'info')
      return makeApp('sub-vue', '#57c99a', 'Vue 子应用(手写 single-spa 挂载)')
    },
    activeWhen: (loc) => loc.hash.startsWith('#/vue')
  })
  registerApplication({
    name: 'sub-react',
    app: async () => {
      log('  [sub-react] 加载模块…', 'info')
      return makeApp('sub-react', '#54b8e6', 'React 子应用(手写 single-spa 挂载)')
    },
    activeWhen: (loc) => loc.hash.startsWith('#/react')
  })

  patchHistoryApi({ urlRerouteOnly: true })
  start()
  log('single-spa 已 start(),注册了 sub-vue / sub-react', 'info')

  const status = () =>
    log(
      `  状态: sub-vue=${getAppStatus('sub-vue')}, sub-react=${getAppStatus('sub-react')}; 已挂载=[${getMountedApps()}]`,
      'warn'
    )

  document.getElementById('ss-vue').onclick = () => {
    log('→ 切到 /vue')
    location.hash = '#/vue'
    setTimeout(status, 100)
  }
  document.getElementById('ss-react').onclick = () => {
    log('→ 切到 /react')
    location.hash = '#/react'
    setTimeout(status, 100)
  }
  document.getElementById('ss-home').onclick = () => {
    log('→ 切到 /(两个都不激活,应全部 unmount)')
    location.hash = '#/'
    setTimeout(status, 100)
  }
})()

// ========== 2. mini-with-sandbox ==========
;(function demoWithSandbox() {
  const log = makeLogger('sb-log')
  const sandbox = new MiniWithSandbox('demo-app')

  // 子应用代码: 往"全局"写变量、定义函数
  const subAppCode = `
    window.pollutant = '我是子应用写的全局变量'
    window.sharedCounter = 42
    var localVar = 'block scoped'
    console.log('子应用内读到 window.pollutant =', window.pollutant)
  `

  document.getElementById('sb-run').onclick = () => {
    sandbox.exec(subAppCode)
    log('已在沙箱里执行子应用代码')
    log(`  沙箱内 microWindow.pollutant = "${sandbox.microWindow.pollutant}"`, '')
    log(`  沙箱记账 injectedKeys = [${[...sandbox.injectedKeys]}]`, 'info')
  }

  document.getElementById('sb-check').onclick = () => {
    const leaked = window.pollutant
    if (leaked === undefined) {
      log('✓ 真实 window.pollutant = undefined —— 隔离成功,没有泄漏', 'warn')
    } else {
      log(`✗ 真实 window 被污染: ${leaked}`, 'warn')
    }
  }

  document.getElementById('sb-stop').onclick = () => {
    sandbox.stop()
    log('已卸载沙箱', 'info')
    log(
      `  清理后 microWindow.pollutant = ${sandbox.microWindow.pollutant}, injectedKeys = [${[...sandbox.injectedKeys]}]`,
      ''
    )
  }
})()

// ========== 3. mini-wujie ==========
;(function demoWujie() {
  const log = makeLogger('wj-log')
  const viewport = document.getElementById('wj-viewport')
  let instance = null

  // 用 Blob 造一个子应用页面(含 DOM + 会操作 document 的脚本)
  const subAppHtml = `
    <div id="sub-root" style="padding:12px;border:2px dashed #e7b567;border-radius:8px;color:#e7b567">
      wujie 子应用初始 DOM
    </div>
    <script>
      // 子应用脚本: 在 iframe 里跑, 但 document 操作作用在 ShadowRoot
      var root = document.querySelector('#sub-root')
      if (root) {
        root.textContent = '子应用脚本改写了 DOM(通过 proxyDocument 作用到 ShadowRoot)'
        window.__SUB_APP_RAN__ = true // 这个全局写在 iframe window 上
      }
    <\/script>
  `

  document.getElementById('wj-load').onclick = async () => {
    if (instance) instance.destroy()
    viewport.innerHTML = ''
    const url = URL.createObjectURL(new Blob([subAppHtml], { type: 'text/html' }))
    instance = new MiniWujie('wujie-sub', url)
    await instance.start(viewport)
    log('已把子应用加载进 iframe(JS)+ ShadowRoot(DOM)双容器')
    log('  子应用的 <script> 被转接回 iframe 执行,ShadowRoot 里留注释占位', 'info')
  }

  document.getElementById('wj-inspect').onclick = () => {
    if (!instance) {
      log('请先加载子应用', 'warn')
      return
    }
    // 验证 1: 子应用脚本的全局写在 iframe window 上, 不在主 window
    const ranInIframe = instance.iframeWindow.__SUB_APP_RAN__ === true
    const notInMain = window.__SUB_APP_RAN__ === undefined
    log(
      `✓ JS 隔离: iframe.__SUB_APP_RAN__=${ranInIframe}, 主window.__SUB_APP_RAN__=${window.__SUB_APP_RAN__}`,
      'warn'
    )
    // 验证 2: DOM 渲染在 ShadowRoot, 不在主文档
    const inShadow = !!instance.shadowRoot.querySelector('#sub-root')
    const notInDoc = !document.querySelector('#sub-root')
    log(
      `✓ DOM 隔离: ShadowRoot 内有 #sub-root=${inShadow}, 主文档查不到=${notInDoc}`,
      'warn'
    )
    log(
      `  ShadowRoot 里 #sub-root 文本 = "${instance.shadowRoot.querySelector('#sub-root')?.textContent}"`,
      ''
    )
    if (ranInIframe && notInMain && inShadow && notInDoc) {
      log('  → 双容器隔离全部成立', 'warn')
    }
  }

  document.getElementById('wj-destroy').onclick = () => {
    if (instance) {
      instance.destroy()
      instance = null
      viewport.innerHTML = ''
      log('已销毁(iframe 与 ShadowRoot 移除)', 'info')
    }
  }
})()
