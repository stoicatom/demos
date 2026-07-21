import React, { useState } from 'react'

export default function Root() {
  const [count, setCount] = useState(0)
  return (
    <div
      style={{ padding: 16, border: '2px dashed #2f86c4', borderRadius: 8 }}
    >
      <h2 style={{ color: '#2f86c4' }}>React 18 子应用</h2>
      <p>这是通过 single-spa + SystemJS 加载的 React 子应用,演示技术栈无关。</p>
      <p>计数器:{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  )
}
