// 极简 wujie —— 忠于官方源码核心机制的教学实现
// 对照仓库: github.com/Tencent/wujie (packages/wujie-core/src/)
//
// 还原了 wujie 的双容器架构, 每处标注对应源码文件:
//   1. iframe(JS 沙箱)+ ShadowRoot(DOM/CSS 沙箱)双容器 → sandbox.ts
//   2. proxyDocument 把 document 操作分流到 shadowRoot        → proxy.ts
//   3. patchIframeDocument 劫持 iframe 的 Document.prototype   → iframe.ts
//   4. 动态脚本转接回 iframe 执行、ShadowRoot 留注释占位       → effect.ts

// 需要被代理到 shadowRoot 的 document 属性(对应 proxy.ts 的 documentProxyProperties)
const DOCUMENT_PROXY_PROPS = [
  'querySelector',
  'querySelectorAll',
  'getElementById',
  'getElementsByClassName',
  'getElementsByTagName',
  'head',
  'body',
  'documentElement',
  'createElement',
  'createTextNode'
]

export class MiniWujie {
  constructor(name, url) {
    this.name = name
    this.url = url

    // 1. iframe: JS 沙箱(独立 window realm)—— 对应 iframe.ts iframeGenerator
    this.iframe = document.createElement('iframe')
    this.iframe.style.display = 'none'
    // 真实 wujie 用 srcdoc 空白页 + document.open() 同源改写; 此处简化为 about:blank
    document.body.appendChild(this.iframe)
    this.iframeWindow = this.iframe.contentWindow

    // 2. <wujie-app> 自定义元素的 ShadowRoot: DOM/CSS 沙箱 —— 对应 shadow.ts
    this.shadowHost = document.createElement('wujie-app')
    this.shadowHost.setAttribute('name', name)
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'open' })

    // 3. proxyDocument: 连接 iframe 与 shadowRoot 的桥 —— 对应 proxy.ts proxyGenerator
    this.proxyDocument = this.createProxyDocument()

    // 4. 劫持 iframe 的 Document.prototype, 让子应用 document.xxx 走 proxyDocument
    this.patchIframeDocument()

    // 把 __WUJIE 注入 iframe, 供子应用取 proxy(对应 iframe.ts 注入 __WUJIE)
    this.iframeWindow.__WUJIE = {
      proxyDocument: this.proxyDocument,
      shadowRoot: this.shadowRoot
    }
  }

  // proxyDocument: target 是空对象, 一切靠 get 分流(对应 proxy.ts)
  createProxyDocument() {
    const { shadowRoot, iframeWindow } = this
    const rawDocument = iframeWindow.document
    return new Proxy(
      {},
      {
        get(_, key) {
          // querySelector: 先查 shadowRoot, 查不到兜底 iframe document(对应 proxy.ts)
          if (key === 'querySelector') {
            return (sel) => shadowRoot.querySelector(sel) || rawDocument.querySelector(sel)
          }
          if (key === 'querySelectorAll') {
            return (sel) => shadowRoot.querySelectorAll(sel)
          }
          if (key === 'getElementById') {
            return (id) => shadowRoot.querySelector(`#${id}`)
          }
          if (key === 'getElementsByClassName') {
            return (cls) => shadowRoot.querySelectorAll(`.${cls}`) // 转 CSS 选择器
          }
          if (key === 'getElementsByTagName') {
            return (tag) => shadowRoot.querySelectorAll(tag)
          }
          // head/body/documentElement → 指向 shadowRoot 的容器节点
          if (key === 'head' || key === 'body' || key === 'documentElement') {
            return shadowRoot.querySelector('wujie-body') || shadowRoot
          }
          // createElement 用 iframe 原生方法(保持正确 ownerDocument)
          if (key === 'createElement' || key === 'createTextNode') {
            return rawDocument[key].bind(rawDocument)
          }
          const value = rawDocument[key] // 其余穿透到 iframe document
          return typeof value === 'function' ? value.bind(rawDocument) : value
        }
      }
    )
  }

  // 把 iframe 里 Document.prototype 上的属性劫持到 proxyDocument(对应 iframe.ts patchDocumentEffect)
  patchIframeDocument() {
    const DocProto = this.iframeWindow.Document.prototype
    const proxyDocument = this.proxyDocument
    DOCUMENT_PROXY_PROPS.forEach((key) => {
      Object.defineProperty(DocProto, key, {
        configurable: true,
        get: () => proxyDocument[key]
      })
    })
  }

  async start(container) {
    // 挂载 shadowHost 到主应用容器
    container.appendChild(this.shadowHost)
    // 给 shadowRoot 建一个 body 容器节点
    const body = document.createElement('wujie-body')
    this.shadowRoot.appendChild(body)

    // 加载子应用 HTML
    const html = await fetch(this.url).then((r) => r.text())
    const template = document.createElement('template')
    template.innerHTML = html

    // 分离脚本与 DOM: DOM 进 shadowRoot, script 转接回 iframe 执行
    const scripts = []
    template.content.querySelectorAll('script').forEach((s) => {
      scripts.push(s.textContent)
      // 对应 effect.ts: ShadowRoot 里只留注释占位, 不真的执行
      const comment = document.createComment('dynamic script replaced by wujie')
      s.replaceWith(comment)
    })
    body.appendChild(template.content)

    // 子应用 JS 在 iframe window 上下文执行(对应 iframe.ts insertScriptToIframe)
    scripts.forEach((code) => {
      // 真实 wujie 用 (function(window,location){...})(proxy, proxyLocation) 闭包注入
      const wrapped = `(function(window, self){ ${code} \n}).call(window.__WUJIE.proxyDocument, window, window)`
      try {
        this.iframeWindow.eval(wrapped)
      } catch (err) {
        console.error(`[mini-wujie] ${this.name} 脚本执行失败`, err)
      }
    })
  }

  destroy() {
    this.iframe.remove()
    this.shadowHost.remove()
  }
}
