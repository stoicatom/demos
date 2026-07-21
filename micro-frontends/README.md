# 微前端框架样例集

《微前端从入门到精通》一文的配套可运行样例。五大主流框架各一套「1 主应用 + 2 异构子应用(Vue 3 + React)」,均按各自**官方权威接入方式**构建。

在线预览:<https://stoicatom.github.io/demos/micro-frontends/>

## 框架清单

| # | 框架 | 维护方 | 构建工具 | 目录 |
|---|------|--------|----------|------|
| 01 | single-spa | 社区 | webpack 5 + SystemJS | [`single-spa/`](./single-spa/) |
| 02 | qiankun | 阿里 | Vue CLI / webpack | [`qiankun/`](./qiankun/) |
| 03 | Module Federation | Webpack 官方 | Rspack + `@module-federation/enhanced` | [`module-federation/`](./module-federation/) |
| 04 | wujie 无界 | 腾讯 | Vite | [`wujie/`](./wujie/) |
| 05 | micro-app | 京东 | Vite | [`micro-app/`](./micro-app/) |

## 端口分配

各框架端口段错开,可同时启动多套对比:

| 框架 | 主应用 | Vue 子应用 | React 子应用 |
|------|--------|-----------|-------------|
| qiankun | 7100 | 7101 | 7102 |
| Module Federation | 8100(host) | 8101(remote-vue) | 8102(remote-react) |
| wujie | 8200 | 8201 | 8202 |
| micro-app | 8300 | 8301 | 8302 |
| single-spa | 9100(root) | 9101 | 9102 |

## 本地运行

在仓库根目录安装依赖(pnpm workspace 会纳入所有样例):

```sh
pnpm install --filter "@mf-demo/*..."
```

以 qiankun 为例,需同时启动主应用与两个子应用(建议开三个终端):

```sh
pnpm --filter "@mf-demo/qiankun-sub-vue" dev
pnpm --filter "@mf-demo/qiankun-sub-react" dev
pnpm --filter "@mf-demo/qiankun-main" dev
# 打开 http://localhost:7100
```

其余框架同理,把 `qiankun` 换成对应包名前缀(`single-spa` / `mf` / `wujie` / `micro-app`),端口见上表。各 demo 目录下的 README 有更详细的说明。

## 构建与部署

所有应用通过环境变量 `PUBLIC_BASE_PATH` 注入部署前缀,实现可移植:

```sh
# 本地模拟生产构建
PUBLIC_BASE_PATH=/demos/ NODE_ENV=production pnpm --filter "@mf-demo/*" run build

# 汇聚产物到统一部署结构 dist/micro-frontends/<框架>/<应用>/
node micro-frontends/scripts/assemble-dist.mjs dist

# 本地预览汇聚结果
npx serve dist
```

CI 部署见 [`.github/workflows/micro-frontends.yml`](../.github/workflows/micro-frontends.yml):推送到 `master` 且改动 `micro-frontends/**` 时自动构建,产物部署到 `gh-pages` 分支的 `micro-frontends/` 子目录,不影响仓库其他已部署内容。

## 设计约定

- **base 注入**:每个应用读 `process.env.PUBLIC_BASE_PATH`(缺省 `/`),生产环境拼成 `<base>micro-frontends/<框架>/<应用>/`
- **跨应用引用**:主应用加载子应用一律用运行时 base 拼接,dev 用 localhost 端口、prod 用同源子目录,零硬编码域名
- **子应用路由**:统一 hash 路由,规避 GitHub Pages 无服务端 rewrite 的深链 404
- **版本锁定**:qiankun 2.10.16(3.0 仍 RC)、single-spa 6.0.3、`@module-federation/enhanced` 2.8.0、wujie 2.1.0、micro-app 1.0.0-rc.32
