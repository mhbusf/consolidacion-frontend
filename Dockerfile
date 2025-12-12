FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# CAMBIO CRÍTICO: Agregar --configuration=production
RUN npm run build -- --configuration=production

FROM nginx:alpine
COPY --from=build /app/dist/consolidacion-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

ENV PORT=80
EXPOSE ${PORT}

CMD ["sh", "-c", "nginx -g 'daemon off;'"]
