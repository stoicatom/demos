import { useState, useEffect } from 'react'

export default function App() {
  const [count, setCount] = useState(0)
  const [lastMsg, setLastMsg] = useState(null)

  useEffect(() => {
    // wujie 注入 window.$wujie;独立运行时可能不存在,做兜底
    const bus = window.$wujie?.bus
    const handler = (payload) => setLastMsg(payload)
    bus?.$on('main-message', handler)
    return () => bus?.$off('main-message', handler)
  }, [])

  return (
    <div className="sub-react">
      <h2>React 18 子应用</h2>
      <p>
        计数器:
        <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
      </p>
      <div className="msg">
        <strong>收到主应用消息:</strong>
        {lastMsg ? (
          <span>
            {lastMsg.text}（ts: {lastMsg.ts}）
          </span>
        ) : (
          <em>暂无,点主应用「广播消息」按钮</em>
        )}
      </div>
    </div>
  )
}
