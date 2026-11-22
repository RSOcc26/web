# syntax=docker/dockerfile:1
# Static build served by an unprivileged nginx on port 8080 (non-root, read-only friendly).

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
