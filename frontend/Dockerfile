# =============================================================================
# Stage 1 – Build (Node + Vite)
# =============================================================================
FROM node:20-alpine3.19 AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# =============================================================================
# Stage 2 – Runtime (Nginx)
# =============================================================================
FROM nginx:1.27-alpine3.19

# 🔥 garante atualização de pacotes (remove vulnerabilidades conhecidas)
RUN apk update && apk upgrade

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]