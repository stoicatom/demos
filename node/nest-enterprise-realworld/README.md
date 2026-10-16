# NestJS Enterprise Realworld Boilerplate

> 结合业界大型 NestJS 真实项目最佳实践的企业级架构实战工程。

## 🌟 核心技术栈与特性

- **应用框架**：[NestJS 10.x](https://nestjs.com/) (TypeScript First, IoC / DI 架构设计)
- **持久化层**：[TypeORM 0.3.x](https://typeorm.io/) + **MySQL 8.x**（软删除、审计字段、`QueryRunner` 编程式 ACID 事务）
- **高速缓存**：**Redis 7.x** + [ioredis](https://github.com/redis/ioredis)（查询缓存加速、异常自动降级、分布式锁防线）
- **安全鉴权**：[Passport](http://www.passportjs.org/) + **JWT 双令牌机制**（15分钟短效 Access Token + 7天长效 Refresh Token 无感轮换续期）
- **权限模型**：基于角色的访问控制（**RBAC**），支持 `@Roles()` 声明与自定义 `RolesGuard`
- **工业级健壮性**：
  - 全局统一 API 响应拦截器（`TransformInterceptor`）
  - 全局兜底异常过滤器（`AllExceptionsFilter`）
  - 全链路网络日志追踪（`LoggingInterceptor`）
  - 强类型入参转换与白名单验证（`ValidationPipe` + `class-validator`）
- **契约与文档**：基于 **OpenAPI (Swagger 3.0)** 规范自动生成交互式接口文档
- **前端全栈联调**：内置可视化联调控制台（`/client/index.html`），演示双 Token 拦截重发与业务 API 消费
- **生产容器化 & CI/CD**：
  - 多阶段瘦身构建 `Dockerfile`（生产镜像体积仅 ~120MB）
  - `docker-compose.yml` 一键编排拉起 MySQL + Redis + NestJS API
  - GitHub Actions 自动化 CI 流水线（代码校验、TypeScript 编译检查、镜像自动化构建）

---

## 📁 目录架构全景

```
nest-enterprise-realworld/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions 自动化构建与测试流水线
├── client/
│   └── index.html             # 前端可视化联调控制台 (BEM 规范，支持无感换票调试)
├── src/
│   ├── common/                # 通用基础设施切面
│   │   ├── constants/         # 响应码与全局常量 (ResponseCode)
│   │   ├── decorators/        # 自定义装饰器 (@CurrentUser, @Roles, @Public)
│   │   ├── entities/          # 持久化基类实体 (AppBaseEntity)
│   │   ├── filters/           # 全局异常捕获过滤器 (AllExceptionsFilter)
│   │   ├── guards/            # 鉴权守卫 (JwtAuthGuard, RolesGuard)
│   │   └── interceptors/      # 切面拦截器 (TransformInterceptor, LoggingInterceptor)
│   ├── config/                # 动态环境配置管理 (configuration.ts)
│   ├── modules/               # 领域业务模块
│   │   ├── auth/              # 身份认证中枢 (登录、JWT 双 Token 签发、无感刷新)
│   │   ├── users/             # 用户领域 (Bcrypt 加密、用户实体、资料管理)
│   │   ├── posts/             # 业务内容领域 (分页查询、QueryRunner 事务、Redis 缓存)
│   │   └── redis/             # Redis 驱动与缓存包装模块
│   ├── app.module.ts          # 根模块组装
│   └── main.ts                # 入口文件 (Swagger 挂载、全局中间件、端口监听)
├── .env.example               # 环境变量配置模板
├── Dockerfile                 # 多阶段生产级瘦身构建 Dockerfile
├── docker-compose.yml         # 编排 MySQL 8.0 + Redis 7.0 + API 全栈容器
├── nest-cli.json              # Nest CLI 脚手架配置
├── package.json               # 模块依赖与脚本定义
├── tsconfig.json              # TypeScript 编译配置
└── README.md                  # 工程说明与架构指南
```

---

## 🚀 快速上手与运行指南

### 1. 本地一键容器编排启动 (推荐)

无需在宿主机安装 MySQL 或 Redis，通过 Docker Compose 即可一键拉起全套生产环境：

```bash
# 启动 MySQL、Redis 及 NestJS API
docker compose up -d

# 查看容器运行日志
docker compose logs -f app
```

服务就绪后访问：
- **前端全栈联调控制台**：[http://localhost:3000](http://localhost:3000)
- **Swagger 交互式文档**：[http://localhost:3000/docs](http://localhost:3000/docs)

---

### 2. 宿主机源码调试运行

如果你本地已安装有 Node.js 20+、MySQL 与 Redis：

```bash
# 1. 复制环境变量配置文件
cp .env.example .env

# 2. 安装项目依赖
pnpm install

# 3. 启动开发模式 (热更新)
pnpm start:dev

# 4. 生产编译与打包
pnpm build
pnpm start:prod
```

---

## 📖 核心 API 端点一览

| 请求方法 | 路由地址 | 鉴权要求 | 描述说明 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/users/register` | 公开 | 用户注册，密码自动经过 Bcrypt 强哈希加密 |
| `POST` | `/api/v1/auth/login` | 公开 | 用户登录，签发 Access Token (15m) 与 Refresh Token (7d) |
| `POST` | `/api/v1/auth/refresh` | 公开 | 双令牌轮换无感刷新，换取全新 Token 对 |
| `GET` | `/api/v1/users/profile` | Bearer 鉴权 | 获取当前登录用户脱敏资料 |
| `POST` | `/api/v1/posts` | Bearer 鉴权 | 采用 `QueryRunner` 严格 ACID 事务创建文章 |
| `GET` | `/api/v1/posts` | 公开 | 文章分页列表（自动命中 Redis 缓存加速） |
| `GET` | `/api/v1/posts/:id` | 公开 | 文章详情（异步累加浏览计数 views） |
| `DELETE`| `/api/v1/posts/:id` | Bearer 鉴权 | 文章软删除（作者本人权限校验） |
