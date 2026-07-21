import React, { useState, useEffect } from 'react'

export default function App() {
  const [count, setCount] = useState(0)
  const [received, setReceived] = useState('')

  useEffect(() => {
    // micro-app EventCenter:监听主应用下发的数据
    const listener = (data) => {
      setReceived(JSON.stringify(data, null, 2))
    }
    window.microApp?.addDataListener(listener)
    const init = window.microApp?.getData()
    if (init) setReceived(JSON.stringify(init, null, 2))

    return () => {
      window.microApp?.removeDataListener(listener)
    }
  }, [])

  return (
    <div
      style={{
        padding: 16,
        border: '2px dashed #2f86c4',
        borderRadius: 8
      }}
    >
      <h2 style={{ color: '#2f86c4' }}>React 18 子应用</h2>
      <p>这是通过 micro-app(iframe 沙箱)加载的 React 子应用,演示技术栈无关。</p>
      <p>计数器:{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: '#f0f6fb',
          borderRadius: 6
        }}
      >
        <strong>收到主应用数据(addDataListener):</strong>
        {received ? (
          <pre style={{ margin: '8px 0 0', color: '#2f86c4' }}>{received}</pre>
        ) : (
          <em>暂无,点击主应用「发送数据给子应用」试试</em>
        )}
      </div>
    </div>
  )
}
