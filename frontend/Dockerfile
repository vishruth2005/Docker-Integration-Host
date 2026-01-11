# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Execution (The "Always Running" part)
FROM nginx:alpine
# Vite builds to 'dist' by default
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (Nginx default)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]