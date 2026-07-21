# 手写微前端内核 · From Scratch

把《微前端从入门到精通》一文里的手写实现做成**真实可运行**的代码。三个内核各自剥离到最小可跑,但每一处核心逻辑都忠于官方源码,并在注释里标注对应的源码文件,方便对照印证。

在线运行:<https://stoicatom.github.io/demos/micro-frontends/from-scratch/>

## 三个内核

| 内核 | 还原的核心机制 | 对照官方源码 |
|---|---|---|
| `mini-single-spa` | 应用状态机 + reroute 四桶调度 + pushState 路由劫持 | [single-spa](https://github.com/single-spa/single-spa) `src/applications/app.helpers.js`、`src/navigation/reroute.js` |
| `mini-wujie` | iframe(JS 沙箱)+ ShadowRoot(DOM/CSS 沙箱)双容器 + proxyDocument 分流 | [Tencent/wujie](https://github.com/Tencent/wujie) `packages/wujie-core/src/{sandbox,proxy,iframe,effect}.ts` |
| `mini-with-sandbox` | fakeWindow + Proxy 拦截 + `with(){}` 劫持标识符 + injectedKeys 清算 | [jd-opensource/micro-app](https://github.com/jd-opensource/micro-app) `src/sandbox/with/window.ts` |

## 各内核在演示什么

### 1. mini-single-spa —— 状态机流转

注册 `sub-vue`(`#/vue` 激活)与 `sub-react`(`#/react` 激活)两个"子应用",点击切路由,观察状态机从 `NOT_LOADED → ... → MOUNTED → UNMOUNTING` 的流转。核心是 `reroute` 把当前应用分成 toUnmount / toUnload / toLoad / toMount 四桶依次调度,并用 `appChangeUnderway` 做并发护栏。

### 2. mini-with-sandbox —— Proxy 隔离验证

在沙箱里执行一段"污染全局"的子应用代码(`window.pollutant = ...`),验证它写的全局变量**不泄漏到真实 window**,卸载后按 `injectedKeys` 记账自动清理。核心是 `with(proxyWindow){}` 劫持标识符解析,get 拦截做"隔离 vs 穿透"判断,穿透到 `rawWindow` 的方法要 `.bind(rawWindow)` 规避 Illegal invocation。

### 3. mini-wujie —— 双容器隔离验证

把一个子应用页面加载进"iframe 跑 JS + ShadowRoot 渲染 DOM"的双容器,点击验证:子应用脚本的全局写在 iframe window 上(主 window 查不到)、DOM 渲染在 ShadowRoot 里(主文档查不到)。核心是 `createProxyDocument()` 把 `document.querySelector` 等操作分流到 shadowRoot,动态脚本被转接回 iframe 执行。

## 本地运行

```bash
pnpm --filter @mf-demo/from-scratch dev      # http://localhost:8400
pnpm --filter @mf-demo/from-scratch build    # 产物 dist/
pnpm --filter @mf-demo/from-scratch preview
```

## 说明

这些实现是**教学用的最小内核**,只保留能体现关键原理的主干,省略了官方源码里的错误边界、生命周期超时、预加载、插件体系等工程细节。要读完整实现请对照上表的官方仓库。
