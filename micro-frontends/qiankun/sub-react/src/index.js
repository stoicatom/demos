import './public-path'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

let root = null

function render(props = {}) {
  const { container } = props
  const dom = container
    ? container.querySelector('#sub-react-root')
    : document.getElementById('sub-react-root')
  root = ReactDOM.createRoot(dom)
  root.render(<App />)
}

// 独立运行(非 qiankun 环境)时直接渲染
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

// qiankun 生命周期
export async function bootstrap() {}

export async function mount(props) {
  render(props)
}

export async function unmount() {
  root?.unmount()
  root = null
}
