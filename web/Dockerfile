# Stage 1: build frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build


# Stage 2: serve with nginx
FROM nginx:alpine

# Vite outputs to 'dist'
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom entrypoint and make it executable
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy the template to a known path that entrypoint will read
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]