# Module Federation 样例

基于 `@module-federation/enhanced` 2.8.0(MF 2.0)+ Rspack 的模块联邦样例:React host 运行时加载 Vue 与 React 两个 remote。

在线预览:<https://stoicatom.github.io/demos/micro-frontends/module-federation/host/>

## 结构

| 应用 | 技术栈 | 端口 | 说明 |
|------|--------|------|------|
| `host/` | React 18 + Rspack | 8100 | 消费方:`registerRemotes` 运行时注入 + `loadRemote` |
| `remote-vue/` | Vue 3 + Rspack | 8101 | 暴露方:`exposes` 一个框架无关的 `mount` 函数 |
| `remote-react/` | React 18 + Rspack | 8102 | 暴露方:`exposes` App 组件,`shared` React 单例 |

## 运行

```sh
pnpm --filter "@mf-demo/mf-remote-vue" dev
pnpm --filter "@mf-demo/mf-remote-react" dev
pnpm --filter "@mf-demo/mf-host" dev
# http://localhost:8100
```

## 官方接入要点

- **MF 2.0 ≠ webpack 内置**:用 `@module-federation/enhanced/rspack` 的 `ModuleFederationPlugin`,权威文档在 <https://module-federation.io>(webpack.js.org 那篇是 1.0 内置版)
- **remote(暴露方)**:`name` + `filename: 'remoteEntry.js'` + `exposes`;产物含 `mf-manifest.json`(MF 2.0 推荐 entry,带类型提示/预载)
- **host(消费方)**:用运行时 API `registerRemotes([{ name, entry }])` 注入 remote 地址(比构建期写死可移植),`loadRemote('name/expose')` + `React.lazy` 动态加载
- **shared**:`react` / `react-dom` 必须 `singleton: true`,否则多实例导致 Hooks 报错
- **跨框架**:remote-vue 暴露框架无关的 `mount(container)` 契约,让 React host 也能挂载 Vue 应用
- **Rspack + vue-loader**:开启 `experiments.css` 时 vue-loader 需 `experimentalInlineMatchResource: true`

官方文档:<https://module-federation.io/guide/start/index.html>
