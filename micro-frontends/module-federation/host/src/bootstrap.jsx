import React, { Suspense, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { registerRemotes, loadRemote } from '@module-federation/enhanced/runtime'

// 运行时推导 remote 地址,零硬编码、可移植
// dev:remote 跑在独立端口;prod:host 位于 .../host/,remote 是同级目录
const isDev = process.env.NODE_ENV !== 'production'
const vueEntry = isDev
  ? 'http://localhost:8101/mf-manifest.json'
  : `${new URL('../', document.baseURI).href}remote-vue/mf-manifest.json`
const reactEntry = isDev
  ? 'http://localhost:8102/mf-manifest.json'
  : `${new URL('../', document.baseURI).href}remote-react/mf-manifest.json`

registerRemotes([
  { name: 'remote_vue', entry: vueEntry },
  { name: 'remote_react', entry: reactEntry }
])

// 用 React.lazy + loadRemote 动态加载远程模块
const RemoteVue = React.lazy(() =>
  loadRemote('remote_vue/mount').then((m) => ({
    default: makeVueWrapper(m.mount)
  }))
)
const RemoteReact = React.lazy(() => loadRemote('remote_react/App'))

// remote-vue 暴露的是挂载函数,用一个 React 包装组件承载 Vue 应用
function makeVueWrapper(mountVue) {
  return function VueHost() {
    const ref = React.useRef(null)
    React.useEffect(() => {
      const unmount = mountVue(ref.current)
      return () => unmount && unmount()
    }, [])
    return <div ref={ref} />
  }
}

function App() {
  const [tab, setTab] = useState('vue')
  return (
    <div>
      <header
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          padding: '12px 20px',
          background: '#16315f',
          color: '#fff'
        }}
      >
        <strong>Module Federation Host</strong>
        <button onClick={() => setTab('vue')}>Vue Remote</button>
        <button onClick={() => setTab('react')}>React Remote</button>
      </header>
      <main style={{ padding: 20 }}>
        <Suspense fallback={<p>加载远程模块中…</p>}>
          {tab === 'vue' ? <RemoteVue /> : <RemoteReact />}
        </Suspense>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
