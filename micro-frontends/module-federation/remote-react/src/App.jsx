import React, { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)
  return (
    <div style={{ padding: 16, border: '2px dashed #2f86c4', borderRadius: 8 }}>
      <h2 style={{ color: '#2f86c4' }}>React 18 远程模块</h2>
      <p>这是 Module Federation 的 React remote,被 host 运行时加载,共享同一份 React。</p>
      <p>计数器:{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  )
}
