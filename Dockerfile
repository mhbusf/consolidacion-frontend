FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/consolidacion-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Render usa PORT como variable de entorno
ENV PORT=80
EXPOSE ${PORT}

CMD ["sh", "-c", "nginx -g 'daemon off;'"]



#FROM node:18-alpine AS build

#WORKDIR /app

#COPY package*.json ./
#RUN npm ci

#COPY . .
#RUN npm run build

#FROM nginx:alpine

# CAMBIO CRÍTICO: Agregar /browser al final
#COPY --from=build /app/dist/consolidacion-frontend/browser /usr/share/nginx/html
#COPY nginx.conf /etc/nginx/conf.d/default.conf

#EXPOSE 80

#CMD ["nginx", "-g", "daemon off;"]