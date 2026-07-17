# memos 记事本 — 生产部署

开源 [memos](https://github.com/usememos/memos) 自托管部署方案(Docker + SQLite),复用现有 nginx 反代与泛域名证书。

> 本目录是**通用部署模板**。真实的服务器 IP、域名、证书目录名等只存在于服务器与本地 `.env`,不入库。部署时替换文档中的占位符:
> - `<SERVER_IP>` —— 你的服务器公网 IP
> - `<MEMOS_DOMAIN>` —— memos 访问域名(如 `memos.example.com`)
> - `<CERT_DIR>` —— 泛域名证书目录名(服务器 `ls /var/www/nginx/certificates/` 查得)

- **数据库**: SQLite(零额外内存开销)
- **镜像版本**: `neosmemo/memos:0.29.1`(固定版本,可控升级)
- **反向代理**: 复用现有 nginx + 泛域名证书
- **部署目录**: `/opt/memos/`(遵循 `/opt/<项目名>` 规范)

## 架构

```
公网 :443 ──► nginx 容器 (泛域名证书) ──proxy──► 172.17.0.1:5230 ──► memos 容器 ──► /opt/memos/data (SQLite)
```

memos 端口**仅绑定 `172.17.0.1`(docker0 网桥)**,不暴露公网,避免 Docker 端口发布绕过云安全组。仅同机 nginx 反代可访问。

## 目录结构

```
docker/memos/
├── docker-compose.yaml   # 容器编排(SQLite + 172.17.0.1:5230 绑定)
├── .env.example          # 环境变量模板(复制为 .env 使用)
├── .gitignore            # 排除 data/ 与真实 .env
├── backup.sh             # SQLite 一致性备份脚本
├── nginx/
│   └── memos.conf        # 反代配置模板(部署到 /var/www/nginx/conf.d/)
└── README.md
```

## 部署步骤(在远端 /opt/memos/ 执行)

> ⚠️ 所有远端命令均需经服务器管理员审批后执行。

### 1. 上传部署文件

将 `docker/memos/` 下的 `docker-compose.yaml`、`.env.example`、`backup.sh`、`nginx/memos.conf` 上传到远端 `/opt/memos/`。

```bash
cd /opt/memos
cp .env.example .env    # 按需调整,生产保持 BIND_HOST=172.17.0.1
mkdir -p data
```

### 2. 启动容器

```bash
cd /opt/memos
docker compose up -d
docker compose ps          # 确认 memos 状态为 running/healthy
docker compose logs -f     # 观察启动日志
```

### 3. 内网验证(接域名前先自测)

```bash
curl -I http://172.17.0.1:5230/healthz    # 预期 200
```

### 4. 接入 nginx 反代(HTTPS)

先替换 `memos.conf` 里的 `<MEMOS_DOMAIN>` 与 `<CERT_DIR>` 两处占位符,再:

```bash
cp memos.conf /var/www/nginx/conf.d/<MEMOS_DOMAIN>.conf
docker exec nginx nginx -t                 # 校验
docker exec nginx nginx -s reload          # 校验通过才热加载
```

### 5. 解析域名 & 首次访问

- 在 DNS 服务商为 `<MEMOS_DOMAIN>` 添加 A 记录 → `<SERVER_IP>`
- 浏览器打开 `https://<MEMOS_DOMAIN>`
- **首个注册的账号即为管理员**,请第一时间注册并妥善保管密码

## 数据备份

SQLite 数据全部在 `/opt/memos/data/`,备份即拷贝该目录。使用内置脚本做在线一致性备份:

```bash
cd /opt/memos && bash backup.sh
```

配置每日自动备份(crontab):

```bash
# 每天凌晨 3:17 备份(错开整点)
17 3 * * * cd /opt/memos && bash backup.sh >> /opt/memos/backup/backup.log 2>&1
```

## 升级(固定版本策略)

```bash
cd /opt/memos
bash backup.sh                              # 1. 先备份
# 2. 编辑 docker-compose.yaml,将 image tag 改为新版本(如 0.30.0)
docker compose pull
docker compose up -d                        # 3. 滚动更新
docker compose logs -f                      # 4. 验证
```

## 回滚

```bash
cd /opt/memos
# 将 docker-compose.yaml 的 image tag 改回旧版本
docker compose up -d
# 如数据结构不兼容,恢复备份:
#   解压 backup/memos-*.tar.gz,将 memos_prod.backup.db 改名为 memos_prod.db 放回 data/
```

## 常用运维命令

| 操作 | 命令 |
|------|------|
| 查看状态 | `docker compose ps` |
| 查看日志 | `docker compose logs -f` |
| 重启 | `docker compose restart` |
| 停止 | `docker compose down`(保留数据) |
| 进入容器 | `docker compose exec memos sh` |

## 备注

- memos 单容器 Go 应用,SQLite 模式常驻内存通常 < 100MB
- 反代配置里 `client_max_body_size 32m` 控制附件上传上限,可按需调整
- 若后续迁移到 PostgreSQL,需改 `MEMOS_DRIVER` 与 `MEMOS_DSN` 并新增 db 容器
