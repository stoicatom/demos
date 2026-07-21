import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const root = ReactDOM.createRoot(document.getElementById('sub-react-root'))
root.render(<App />)

// 官方约定:导出 unmount 供主应用卸载子应用时调用
window.unmount = () => {
  root.unmount()
}
