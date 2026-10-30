# EduLink frontend (React + Vite), postrežen z nginx. Gradi se iz korena
# repozitorija, ker uporablja konfiguracijo iz mape nginx/:
#   docker build -f edulink-vite/Dockerfile .

# 1. korak: produkcijska gradnja aplikacije
FROM node:24-alpine AS build
WORKDIR /app
COPY edulink-vite/package.json edulink-vite/package-lock.json ./
RUN npm ci
COPY edulink-vite/ ./
RUN npm run build

# 2. korak: statične datoteke + obratni posrednik za /api
FROM nginx:1.29-alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
