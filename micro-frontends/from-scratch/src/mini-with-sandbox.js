// 极简 with 沙箱 —— 忠于 micro-app 官方源码核心机制的教学实现
// 对照仓库: github.com/jd-opensource/micro-app (src/sandbox/with/)
//
// 还原了 micro-app 默认 with 沙箱的核心, 每处标注对应源码:
//   1. fakeWindow(空对象)+ Proxy 拦截读写   → sandbox/with/window.ts createProxyWindow
//   2. with(microWindow){} 劫持标识符解析     → source/scripts.ts bindScope
//   3. get 的"隔离 vs 穿透"判断 + 函数 bind    → window.ts get handler
//   4. set 挂账 injectedKeys, unmount 清算      → window.ts set + clearRouteState

// 默认作用域隔离的属性(对应 window.ts 的 scopeProperties)
const SCOPE_PROPERTIES = [
  'webpackJsonp',
  'webpackHotUpdate',
  'Vue',
  'onpopstate',
  'onhashchange',
  'event'
]

// window/self/globalThis 都要指向 proxy(对应 window.ts GLOBAL_KEY_TO_WINDOW)
const GLOBAL_KEY_TO_WINDOW = ['window', 'self', 'globalThis']

export class MiniWithSandbox {
  constructor(appName) {
    this.appName = appName
    this.microWindow = {} // fakeWindow: 子应用的"假 window"(对应 CustomWindow)
    this.injectedKeys = new Set() // 记录子应用新增的全局 key, 卸载时清理
    this.active = false
    this.proxyWindow = this.createProxyWindow()
  }

  createProxyWindow() {
    const rawWindow = window
    const microWindow = this.microWindow
    const injectedKeys = this.injectedKeys

    // window/self/globalThis 指向 proxy 自身
    const proxyWindow = new Proxy(microWindow, {
      get: (target, key) => {
        if (GLOBAL_KEY_TO_WINDOW.includes(key)) return proxyWindow
        // 隔离条件: 子应用自己写过的、__MICRO_APP_ 开头的、scopeProperties → 读 fakeWindow
        if (
          Reflect.has(target, key) ||
          (typeof key === 'string' && key.startsWith('__MICRO_APP_')) ||
          SCOPE_PROPERTIES.includes(key)
        ) {
          return Reflect.get(target, key)
        }
        // 其余(document/定时器/DOM 构造函数)穿透到真实 window
        const value = rawWindow[key]
        // 关键坑: 函数必须 bind 到 rawWindow, 否则 Illegal invocation
        return typeof value === 'function' && !isConstructor(value)
          ? value.bind(rawWindow)
          : value
      },
      set: (target, key, value) => {
        if (!this.active) return true
        // 写操作只落 fakeWindow, 不污染真实 window
        if (!Reflect.has(target, key)) injectedKeys.add(key) // 挂账
        Reflect.set(target, key, value)
        return true
      },
      has: (target, key) => {
        // 解决 window.Vue===undefined 且 'Vue' in window===false(issue #686)
        if (SCOPE_PROPERTIES.includes(key)) return Reflect.has(target, key)
        return Reflect.has(target, key) || Reflect.has(rawWindow, key)
      },
      deleteProperty: (target, key) => {
        if (Reflect.has(target, key)) {
          injectedKeys.delete(key)
          return Reflect.deleteProperty(target, key)
        }
        return true
      }
    })
    return proxyWindow
  }

  start() {
    this.active = true
  }

  // 用 with 包裹子应用代码(对应 source/scripts.ts bindScope)
  // with(microWindow) 让裸写的全局标识符先在 fakeWindow 上解析
  exec(code) {
    if (!this.active) this.start()
    const wrappedCode = `(function(proxyWindow){ with(proxyWindow){ ${code} \n} }).call(this.proxyWindow, this.proxyWindow)`
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('', wrappedCode)
      fn.call(this)
    } catch (err) {
      console.error(`[mini-with-sandbox] ${this.appName} 执行失败`, err)
    }
  }

  // 卸载: 清理子应用新增的全局变量(对应 window.ts 的 clearRouteState 思路)
  stop() {
    this.active = false
    this.injectedKeys.forEach((key) => {
      Reflect.deleteProperty(this.microWindow, key)
    })
    this.injectedKeys.clear()
  }
}

// 粗略判断是否构造函数(构造函数 bind 后会丢失 new 能力, 不能 bind)
function isConstructor(fn) {
  const str = fn.toString()
  return (
    /^class\b/.test(str) ||
    (/^function\b/.test(str) && /^[A-Z]/.test(fn.name || ''))
  )
}
