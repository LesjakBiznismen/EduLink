# EduLink backend (Node.js + Express + SQLite). Gradi se iz korena repozitorija,
# ker potrebuje tudi SQL datoteke iz mape PB/:
#   docker build -f backend/Dockerfile .
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/edulink.db \
    UPLOAD_DIR=/data/uploads \
    SQL_DIR=/app/sql

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend/src ./src
COPY PB/schema.sql PB/insert.sql ./sql/

RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
