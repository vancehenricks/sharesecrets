# Multi-stage Dockerfile: build Vite then run Node server that serves distilled `dist`
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || true
COPY . .
RUN npm install --no-audit
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || true
COPY --from=builder /app/dist ./dist
COPY server ./server
EXPOSE 3000
ENV PORT=3000
# Run migrations at container start, then start the server
CMD ["sh","-c","npm run migrate && node server/index.js"]
