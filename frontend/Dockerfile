FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS development
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src ./src
ENV VITE_API_URL=/api
EXPOSE 80
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80", "--strictPort"]

FROM dependencies AS build
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src ./src
ENV VITE_API_URL=/api
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
