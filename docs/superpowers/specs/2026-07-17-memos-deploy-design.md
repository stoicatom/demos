# memos 记事本生产部署设计

- **日期**: 2026-07-17
- **目标服务器**: 生产服务器(Debian 13 trixie, x86_64)—— 真实 IP/域名见本地 `.env`,不入库
- **部署产物目录**: `docker/memos/`
- **状态**: 已设计,待生产上线审批

> 本文档为公开仓库文档,涉及真实主机的坐标以占位符表示:
> `<SERVER_IP>`(服务器公网 IP)、`<MEMOS_DOMAIN>`(memos 域名)、`<CERT_DIR>`(证书目录名)。

## 1. 背景与目标

将开源自托管记事本 [memos](https://github.com/usememos/memos) 部署到远端生产服务器,遵循服务器既有的目录与服务管理规范,复用现有反向代理与泛域名证书,以最小内存与安全代价对外提供 HTTPS 服务。

**核心约束**:

| 维度 | 现状 | 决策影响 |
|------|------|----------|
| 可用内存 | 总 1.9G / 可用 ~1G / 无 Swap | 选 SQLite,避免额外 DB 容器 |
| Docker | 29.4.3 + Compose v5.1.3 | 无需安装 |
| 部署根目录规范 | `/opt/<项目名>/`(现有其他业务同规范) | memos → `/opt/memos` |
| 反向代理 | 现有 nginx 反代容器独占 80/443 | 复用,不新起 nginx |
| 泛域名证书 | `泛域名`(<CERT_DIR>) | memos 用子域名,共享证书 |
| 防火墙约定 | 端口绑 `172.17.0.1`,禁 `0.0.0.0` | memos 沿用,不暴露公网 |

## 2. 架构与数据流

```
                    公网 :443 (HTTPS)
                          │
              ┌───────────▼─────────────┐
              │  现有 nginx 反代容器        │  ← 已存在,独占 80/443
              │  泛域名证书 <CERT_DIR>   │     配置在 /var/www/nginx/conf.d/
              └───────────┬─────────────┘
        <MEMOS_DOMAIN> │ proxy_pass
                          ▼
                   172.17.0.1:5230        ← docker0 网桥,不暴露公网
              ┌───────────────────────┐
              │  memos 容器             │  ← 新增 neosmemo/memos:0.29.1
              │  监听 :5230             │
              └───────────┬───────────┘
                          ▼
              /opt/memos/data/memos_prod.db  ← SQLite 持久化
```

**请求链路**: 用户访问 `https://<MEMOS_DOMAIN>` → 现有 nginx 用泛域名证书终止 TLS → 反代到 `172.17.0.1:5230` → memos 容器 → SQLite 文件。

## 3. 关键设计决策

### 3.1 数据库:SQLite
官方默认驱动,单文件存储,零额外内存开销,契合 ~1G 可用内存。备份即拷贝 `data/` 目录。高并发多人场景才需 PG/MySQL,当前不需要。

### 3.2 镜像版本:固定 `0.29.1`
锁定当前最新稳定版(2026-06-05 发布),升级/回滚可控。不用 `stable` 滚动标签,避免重拉镜像时版本漂移。tag 来自 Docker Hub `neosmemo/memos`(无 `v` 前缀)。

### 3.3 端口绑定:`172.17.0.1:5230`(不暴露公网)
沿用 现有业务样板中的硬规范:Docker 直接发布端口的 DNAT 在 PREROUTING 阶段执行,不经过 INPUT 链,会绕过云安全组导致端口公网可达。绑定 `172.17.0.1`(docker0 网桥)后,仅宿主机与同机 nginx 反代可访问。5230 端口经确认未被占用。

### 3.4 HTTPS 接入:复用 现有 nginx + 泛域名证书
现有 nginx 反代 独占 80/443,memos 无法另起 nginx 抢占。现有 `conf.d/` 各站点均手写配置并共用泛域名证书 `<CERT_DIR>`。memos 新增 `<MEMOS_DOMAIN>.conf`,写法对齐 现有反代样板(反代型),额外补 WebSocket 支持与 32M 上传上限。`default.conf` 用 `return 444` 兜底,故新域名必须显式加配置。

## 4. 交付物清单(docker/memos/)

| 文件 | 作用 |
|------|------|
| `docker-compose.yaml` | 容器编排:SQLite、172.17.0.1:5230 绑定、日志轮转、健康检查 |
| `.env.example` | 环境变量模板(MEMOS_PORT / BIND_HOST) |
| `.gitignore` | 排除 `data/`、真实 `.env`、备份文件 |
| `backup.sh` | SQLite 在线一致性备份 + 14 天滚动清理 |
| `nginx/memos.conf` | 反代配置模板(占位符 `<MEMOS_DOMAIN>`/`<CERT_DIR>`),部署到 `/var/www/nginx/conf.d/` |
| `README.md` | 部署/上线/备份/升级/回滚全流程文档 |

## 5. 上线步骤(均需审批)

1. **上传**: `docker/memos/` → 远端 `/opt/memos/`
2. **准备**: `cp .env.example .env` && `mkdir -p data`
3. **启动**: `docker compose up -d`
4. **内网自测**: `curl -I http://172.17.0.1:5230/healthz` 预期 200
5. **接反代**: 复制 conf → `docker exec nginx nginx -t && nginx -s reload`
6. **DNS**: `<MEMOS_DOMAIN>` A 记录 → <SERVER_IP>
7. **首访**: 注册首个账号(即管理员)

## 6. 数据持久化与备份

- 全部数据在 `/opt/memos/data/`(SQLite 库 + 上传附件)
- `backup.sh` 用 `sqlite3 .backup` 做在线一致性快照后打包
- crontab 每日 03:17 自动备份,保留 14 天

## 7. 风险与回滚

| 风险 | 应对 |
|------|------|
| 内存不足 | SQLite 模式常驻 < 100MB,余量充足;必要时加 swap |
| 版本升级不兼容 | 升级前强制 `backup.sh`;回滚改 tag + 恢复备份 |
| 反代配置误伤现有站点 | 独立新增 conf 文件,`nginx -t` 校验后再 reload |
| 端口误暴露公网 | `.env` 锁定 `BIND_HOST=172.17.0.1`,README 多处告警 |

## 8. 非目标(YAGNI)

- 不引入 PostgreSQL/MySQL(内存不允许且无需求)
- 不在项目内自建 nginx 容器(复用现有反代)
- 不做多副本/负载均衡(个人/小团队记事本)
- 不自动化 DNS 与证书签发(泛域名证书已覆盖)
