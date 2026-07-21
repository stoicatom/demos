# qiankun 样例

基于 qiankun 2.10.16 的微前端样例:Vue CLI 主应用(基座) + Vue 3 子应用 + React 18 子应用。

在线预览:<https://stoicatom.github.io/demos/micro-frontends/qiankun/>

## 结构

| 应用 | 技术栈 | 端口 | 说明 |
|------|--------|------|------|
| `main/` | Vue 3 + Vue CLI | 7100 | 基座:`registerMicroApps` + `initGlobalState` |
| `sub-vue/` | Vue 3 + Vue CLI | 7101 | 子应用:`public-path.js` + 生命周期 + umd |
| `sub-react/` | React 18 + webpack | 7102 | 子应用:技术栈无关演示 |

## 运行

```sh
pnpm --filter "@mf-demo/qiankun-sub-vue" dev
pnpm --filter "@mf-demo/qiankun-sub-react" dev
pnpm --filter "@mf-demo/qiankun-main" dev
# http://localhost:7100
```

## 官方接入要点

- **主应用**:`registerMicroApps([{ name, entry, container, activeRule }])` + `start({ sandbox: { experimentalStyleIsolation: true } })`
- **子应用**:入口第一行引入 `public-path.js`(运行时覆盖 `__webpack_public_path__`);导出 `bootstrap` / `mount` / `unmount`;打包成 umd 并设 `library` 名
- **跨域**:子应用 devServer 必须 `Access-Control-Allow-Origin: *`(qiankun 用 fetch 拉资源)
- **通信**:`initGlobalState` 全局状态,主子应用通过 `onGlobalStateChange` / `setGlobalState` 收发

官方文档:<https://qiankun.umijs.org/zh/guide/getting-started>
