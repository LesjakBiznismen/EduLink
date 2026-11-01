# EduLink frontend (React + Vite), postrežen z nginx prek HTTPS. Gradi se iz korena
# repozitorija, ker uporablja konfiguracijo iz mape nginx/:
#   docker build -f edulink-vite/Dockerfile .

# 1. korak: produkcijska gradnja aplikacije
FROM node:24-alpine AS build
WORKDIR /app
COPY edulink-vite/package.json edulink-vite/package-lock.json ./
RUN npm ci
COPY edulink-vite/ ./
RUN npm run build

# 2. korak: statične datoteke + obrnjeni posrednik za /api, HTTPS in samopodpisan certifikat za razvoj
FROM nginx:1.29-alpine
RUN apk add --no-cache openssl
ENV SSL_CERT=/etc/nginx/certs/fullchain.pem \
    SSL_KEY=/etc/nginx/certs/privkey.pem \
    HTTPS_PORT=8443
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 nginx/25-self-signed-cert.sh /docker-entrypoint.d/25-self-signed-cert.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443
