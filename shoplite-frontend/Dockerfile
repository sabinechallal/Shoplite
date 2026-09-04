# Étape 1 : compiler l'application Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Repère automatiquement où Angular a mis les fichiers compilés
# (dist/<nom>/browser sur les versions récentes, dist/<nom> sur les plus anciennes)
RUN set -eux; \
    OUT=$(find dist -maxdepth 2 -type d -name browser | head -n1); \
    if [ -z "$OUT" ]; then OUT=$(find dist -maxdepth 1 -mindepth 1 -type d | head -n1); fi; \
    mkdir -p /output && cp -r "$OUT"/* /output/

# Étape 2 : servir les fichiers compilés avec nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /output /usr/share/nginx/html