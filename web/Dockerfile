# Stage 1: build frontend (build context must be repo root so shared/ is available)
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies from web/ first (for better layer caching)
COPY web/package*.json ./web/
RUN cd web && npm ci

# Copy web and shared so imports like ../../../shared/types/recipe resolve
COPY web ./web
COPY shared ./shared

WORKDIR /app/web
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
COPY --from=build /app/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
