// qiankun 官方约定:被主应用加载时,用注入的运行时 publicPath 覆盖构建时值
// 必须在入口最顶部、所有其他 import 之前执行
if (window.__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line no-undef, camelcase
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
