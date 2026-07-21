import React from 'react'
import ReactDOMClient from 'react-dom/client'
import singleSpaReact from 'single-spa-react'
import Root from './root.component.jsx'

// single-spa-react 把 React 组件包装成 single-spa 生命周期
const lifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: Root,
  // 挂载到基座 viewport,而非默认追加到 body
  domElementGetter: () => document.getElementById('app-viewport'),
  errorBoundary() {
    return null
  }
})

export const bootstrap = lifecycles.bootstrap
export const mount = lifecycles.mount
export const unmount = lifecycles.unmount
