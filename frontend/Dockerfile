# =============================================================================
# Stage 1 – Build (Node + Vite)
# =============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# VITE_API_URL é embutida no bundle em tempo de build; pode ser sobrescrita via
# build-arg no docker-compose (args: VITE_API_URL: ...).
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

# Cache de dependências separado do código-fonte
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# =============================================================================
# Stage 2 – Runtime (Nginx)
# =============================================================================
FROM nginx:1.27-alpine

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
