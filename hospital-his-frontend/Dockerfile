# Stage 1: Build
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Set production API URL to use relative paths (nginx will proxy)
ENV VITE_API_URL=/api/v1
ENV VITE_SOCKET_URL=
ENV VITE_OCR_URL=

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

