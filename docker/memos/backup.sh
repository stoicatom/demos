#!/usr/bin/env bash
# ==================================================
# memos SQLite 数据备份脚本
# 用法: bash backup.sh   (在远端 /opt/memos/ 下执行)
# 产物: /opt/memos/backup/memos-YYYYMMDD-HHMMSS.tar.gz
# 建议: 配合 crontab 每日定时执行
# ==================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${APP_DIR}/data"
BACKUP_DIR="${APP_DIR}/backup"
TS="$(date +%Y%m%d-%H%M%S)"
KEEP_DAYS=14 # 保留最近 14 天的备份

mkdir -p "${BACKUP_DIR}"

if [ ! -f "${DATA_DIR}/memos_prod.db" ]; then
  echo "[备份] 未找到 ${DATA_DIR}/memos_prod.db,退出" >&2
  exit 1
fi

# 用 sqlite3 的 .backup 做在线一致性备份(避免直接拷贝正在写入的库文件)
# memos 镜像内置 sqlite3;若宿主机有 sqlite3 亦可直接用
echo "[备份] 生成一致性快照..."
docker exec memos sqlite3 /var/opt/memos/memos_prod.db \
  ".backup '/var/opt/memos/memos_prod.backup.db'"

echo "[备份] 打包数据目录 -> ${BACKUP_DIR}/memos-${TS}.tar.gz"
tar -czf "${BACKUP_DIR}/memos-${TS}.tar.gz" -C "${DATA_DIR}" \
  memos_prod.backup.db \
  $(cd "${DATA_DIR}" && ls -d assets 2>/dev/null || true)

# 清理容器内临时快照
docker exec memos rm -f /var/opt/memos/memos_prod.backup.db

echo "[备份] 清理 ${KEEP_DAYS} 天前的旧备份..."
find "${BACKUP_DIR}" -name 'memos-*.tar.gz' -mtime +${KEEP_DAYS} -delete

echo "[备份] 完成: ${BACKUP_DIR}/memos-${TS}.tar.gz"
ls -lh "${BACKUP_DIR}/memos-${TS}.tar.gz"
