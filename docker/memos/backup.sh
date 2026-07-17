#!/usr/bin/env bash
# ==================================================
# memos 数据备份脚本(停机一致性备份)
# 用法: bash backup.sh   (在远端 /opt/memos/ 下执行)
# 产物: /opt/memos/backup/memos-YYYYMMDD-HHMMSS.tar.gz
# 机制: SQLite 为 WAL 模式,直接拷贝主库文件会漏 WAL 数据。
#       故先 stop 容器(库落到一致状态),再打包整个 data 目录,最后 start。
#       停机窗口约 2-3 秒,对个人/小团队记事本无感。
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

# 记录容器备份前是否在运行,便于结束时恢复原状
WAS_RUNNING=false
if docker compose ps --status running 2>/dev/null | grep -q memos; then
  WAS_RUNNING=true
fi

# 无论中途成功失败,都确保容器被重新拉起(避免备份失败导致服务停摆)
restart_guard() {
  if [ "${WAS_RUNNING}" = true ]; then
    docker compose start memos >/dev/null 2>&1 || docker compose up -d >/dev/null 2>&1 || true
  fi
}
trap restart_guard EXIT

echo "[备份] 停止 memos 容器(短暂停机以保证一致性)..."
docker compose stop memos >/dev/null 2>&1

echo "[备份] 打包数据目录 -> ${BACKUP_DIR}/memos-${TS}.tar.gz"
tar -czf "${BACKUP_DIR}/memos-${TS}.tar.gz" -C "${DATA_DIR}" .

echo "[备份] 启动 memos 容器..."
docker compose start memos >/dev/null 2>&1
WAS_RUNNING=false # 已手动拉起,trap 无需再动

echo "[备份] 清理 ${KEEP_DAYS} 天前的旧备份..."
find "${BACKUP_DIR}" -name 'memos-*.tar.gz' -mtime +${KEEP_DAYS} -delete

echo "[备份] 完成: ${BACKUP_DIR}/memos-${TS}.tar.gz"
ls -lh "${BACKUP_DIR}/memos-${TS}.tar.gz"
