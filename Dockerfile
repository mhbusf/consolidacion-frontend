FROM node:24.15.0-alpine AS build
WORKDIR /app
ENV NG_BUILD_CACHE=false
COPY package*.json ./
RUN npm ci
COPY . .
# CAMBIO CRÍTICO: Agregar --configuration=production
RUN rm -rf dist .angular/cache && npm run build -- --configuration=production

FROM nginx:alpine
COPY --from=build /app/dist/consolidacion-frontend/browser /usr/share/nginx/html
COPY nginx.conf.template /tmp/default.conf.template
COPY docker-entrypoint.sh /usr/local/bin/app-entrypoint.sh
RUN chmod +x /usr/local/bin/app-entrypoint.sh

ENV PORT=80
ENV BACKEND_URL=http://backend:8080
EXPOSE 80

CMD ["/usr/local/bin/app-entrypoint.sh"]
