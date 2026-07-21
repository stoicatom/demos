# single-spa 样例

基于 single-spa 6.0.3 的微前端样例:root-config(基座) + Vue 3 子应用 + React 18 子应用,通过 SystemJS import map 加载。

在线预览:<https://stoicatom.github.io/demos/micro-frontends/single-spa/>

## 结构

| 应用 | 技术栈 | 端口 | 说明 |
|------|--------|------|------|
| `root-config/` | webpack 5 + SystemJS | 9100 | 基座:import map + `registerApplication` |
| `sub-vue/` | Vue 3 + single-spa-vue | 9101 | 子应用:编译为 system 格式 |
| `sub-react/` | React 18 + single-spa-react | 9102 | 子应用:编译为 system 格式 |

## 运行

```sh
pnpm --filter "@mf-demo/single-spa-sub-vue" dev
pnpm --filter "@mf-demo/single-spa-sub-react" dev
pnpm --filter "@mf-demo/single-spa-root" dev
# http://localhost:9100
```

## 官方接入要点

- **基座**:`registerApplication({ name, app, activeWhen })` + `start({ urlRerouteOnly: true })`(Vue 3 路由要求开启);子应用地址写在 HTML 的 `systemjs-importmap` 里
- **子应用**:用 `single-spa-vue` / `single-spa-react` 把框架实例包装成 `bootstrap` / `mount` / `unmount`;webpack `output.libraryTarget: 'system'` 编译为 SystemJS 格式
- **通信**:single-spa **无官方内置通信 API**,只有注册时的 `customProps` / 生命周期 props;跨应用状态需自行用 import map 共享模块实现
- **可移植**:import map 的子应用 URL 用相对 `publicPath` 拼接,换部署路径无需重构基座

官方文档:<https://single-spa.js.org/docs/getting-started-overview>
