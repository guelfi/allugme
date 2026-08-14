# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY frontend/dashboard/package*.json ./
RUN npm install --no-audit --no-fund

COPY frontend/dashboard/ .

ARG VITE_API_URL=
ARG VITE_BASE_PATH=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
