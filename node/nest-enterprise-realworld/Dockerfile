# ==========================================
# Stage 1: 构建阶段 (Builder)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖描述文件利用 Docker 缓存层
COPY package.json ./

# 安装依赖
RUN pnpm install

# 复制所有源码
COPY . .

# 编译为生产产物
RUN pnpm build

# 清理 dev 依赖，只保留生产运行依赖
RUN pnpm prune --prod

# ==========================================
# Stage 2: 纯净运行环境 (Runner)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 安全用户
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client ./client

# 切换为普通用户
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
