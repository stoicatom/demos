// 极简 single-spa —— 忠于官方源码核心机制的教学实现
// 对照仓库: github.com/single-spa/single-spa (main/src/)
//
// 还原了 single-spa 的三大核心, 每处标注对应源码文件:
//   1. 应用状态机          → src/applications/app.helpers.js
//   2. reroute 四桶调度     → src/navigation/reroute.js + src/applications/apps.js
//   3. 路由劫持(pushState) → src/navigation/navigation-events.js

// ---- 1. 状态常量: 对应 app.helpers.js 的 12 个状态(此处保留核心 8 个) ----
export const NOT_LOADED = 'NOT_LOADED'
export const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE'
export const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'
export const BOOTSTRAPPING = 'BOOTSTRAPPING'
export const NOT_MOUNTED = 'NOT_MOUNTED'
export const MOUNTING = 'MOUNTING'
export const MOUNTED = 'MOUNTED'
export const UNMOUNTING = 'UNMOUNTING'
export const SKIP_BECAUSE_BROKEN = 'SKIP_BECAUSE_BROKEN'
export const LOAD_ERROR = 'LOAD_ERROR'

const apps = [] // 注册表(对应 apps.js 的模块级 apps 数组)
let started = false // 对应 start.js 的 started 标志

// shouldBeActive: activeWhen 抛错即拉黑(对应 app.helpers.js 的 shouldBeActive)
function shouldBeActive(app) {
  try {
    return app.activeWhen(window.location)
  } catch (err) {
    app.status = SKIP_BECAUSE_BROKEN
    return false
  }
}

// ---- registerApplication: 对应 applications/apps.js ----
export function registerApplication({ name, app, activeWhen, customProps = {} }) {
  apps.push({
    name,
    loadApp: app,
    activeWhen,
    customProps,
    status: NOT_LOADED,
    bootstrap: null,
    mount: null,
    unmount: null,
    instance: null
  })
  if (started) reroute()
}

// ---- start: 对应 start.js(仅 17 行), 置 started 并触发首次 reroute ----
export function start() {
  started = true
  reroute()
}

export function getAppStatus(name) {
  const app = apps.find((a) => a.name === name)
  return app ? app.status : null
}
export function getMountedApps() {
  return apps.filter((a) => a.status === MOUNTED).map((a) => a.name)
}

// ---- getAppChanges: 对应 apps.js 的四桶分类 ----
function getAppChanges() {
  const appsToLoad = []
  const appsToMount = []
  const appsToUnmount = []
  apps.forEach((app) => {
    const active = shouldBeActive(app)
    switch (app.status) {
      case LOAD_ERROR:
      case NOT_LOADED:
      case LOADING_SOURCE_CODE:
        if (active) appsToLoad.push(app)
        break
      case NOT_BOOTSTRAPPED:
      case NOT_MOUNTED:
        if (active) appsToMount.push(app)
        break
      case MOUNTED:
        if (!active) appsToUnmount.push(app)
        break
      // SKIP_BECAUSE_BROKEN 没有 case → 永久忽略(源码同样如此)
      default:
        break
    }
  })
  return { appsToLoad, appsToMount, appsToUnmount }
}

// ---- 生命周期推进函数(对应 lifecycles/load|bootstrap|mount|unmount.js) ----
async function toLoad(app) {
  if (app.status !== NOT_LOADED && app.status !== LOAD_ERROR) return app
  app.status = LOADING_SOURCE_CODE // 进入即写中间态
  try {
    const instance = await app.loadApp(app.customProps)
    // 校验生命周期是有效函数(对应 load.js 的 validLifecycleFn 检查)
    if (typeof instance.mount !== 'function' || typeof instance.unmount !== 'function') {
      throw new Error(`应用 ${app.name} 缺少有效的 mount/unmount`)
    }
    app.bootstrap = instance.bootstrap || (async () => {})
    app.mount = instance.mount
    app.unmount = instance.unmount
    app.status = NOT_BOOTSTRAPPED
  } catch (err) {
    app.status = LOAD_ERROR // 加载失败可 200ms 后重试(此处简化为可重新 load)
    console.error(`[mini-single-spa] ${app.name} 加载失败`, err)
  }
  return app
}

async function toBootstrap(app) {
  if (app.status !== NOT_BOOTSTRAPPED) return app
  app.status = BOOTSTRAPPING
  try {
    await app.bootstrap(app.customProps)
    app.status = NOT_MOUNTED
  } catch (err) {
    app.status = SKIP_BECAUSE_BROKEN
    console.error(`[mini-single-spa] ${app.name} bootstrap 失败`, err)
  }
  return app
}

async function toMount(app) {
  if (app.status !== NOT_MOUNTED) return app
  app.status = MOUNTING
  try {
    await app.mount(app.customProps)
    app.status = MOUNTED
  } catch (err) {
    // mount 失败: 先假装 MOUNTED、尝试 unmount 清理, 再落 broken(对应 mount.js:64-68)
    app.status = MOUNTED
    await toUnmount(app)
    app.status = SKIP_BECAUSE_BROKEN
    console.error(`[mini-single-spa] ${app.name} mount 失败`, err)
  }
  return app
}

async function toUnmount(app) {
  if (app.status !== MOUNTED) return app
  app.status = UNMOUNTING
  try {
    await app.unmount(app.customProps)
    app.status = NOT_MOUNTED
  } catch (err) {
    app.status = SKIP_BECAUSE_BROKEN
    console.error(`[mini-single-spa] ${app.name} unmount 失败`, err)
  }
  return app
}

// ---- reroute: 唯一调度中枢, 对应 reroute.js ----
let appChangeUnderway = false
const pendingPromises = []

async function reroute() {
  if (appChangeUnderway) {
    // 并发保护: 当前调度未完成时排队(对应 reroute.js 的 peopleWaitingOnAppChange)
    return new Promise((resolve) => pendingPromises.push(resolve))
  }
  const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges()

  // started 分叉(对应 reroute.js:74): 未 start 只 load、不 mount
  if (!started) {
    await Promise.all(appsToLoad.map(toLoad))
    return
  }

  appChangeUnderway = true

  // 先卸载, 卸载完成的 Promise 供 mount 等待(mount 必须等 unmount 完成)
  const unmountAll = Promise.all(appsToUnmount.map(toUnmount))

  // 加载 + bootstrap 与 unmount 并发; 但 mount 等 unmountAll
  const loadThenMount = appsToMount.map(async (app) => {
    await toLoad(app)
    await tryToBootstrapAndMount(app, unmountAll)
  })
  // appsToLoad 里已激活的也走 load→mount
  const loadOnly = appsToLoad.map(async (app) => {
    await toLoad(app)
    await tryToBootstrapAndMount(app, unmountAll)
  })

  await Promise.all([unmountAll, ...loadThenMount, ...loadOnly])

  appChangeUnderway = false
  if (pendingPromises.length) {
    const waiting = pendingPromises.splice(0)
    await reroute()
    waiting.forEach((resolve) => resolve())
  }
}

// tryToBootstrapAndMount: 双重 shouldBeActive 检查(对应 reroute.js, 应对 issue #524)
async function tryToBootstrapAndMount(app, unmountAll) {
  if (shouldBeActive(app)) {
    await toBootstrap(app)
    await unmountAll // 等所有卸载完成, 再挂载
    if (shouldBeActive(app)) {
      // 加载慢时用户可能已切走, 挂载前再查一次
      await toMount(app)
    }
  } else {
    await unmountAll
  }
}

// ---- 路由劫持: 对应 navigation-events.js ----
export function patchHistoryApi({ urlRerouteOnly = true } = {}) {
  ;['pushState', 'replaceState'].forEach((methodName) => {
    const rawFn = window.history[methodName]
    window.history[methodName] = function (...args) {
      const urlBefore = window.location.href
      const result = rawFn.apply(this, args)
      const urlAfter = window.location.href
      // urlRerouteOnly: 只有 URL 真变化才 reroute(对应 navigation-events.js:95)
      if (!urlRerouteOnly || urlBefore !== urlAfter) reroute()
      return result
    }
  })
  // 浏览器前进后退
  window.addEventListener('popstate', () => reroute())
}
