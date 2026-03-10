# Stage 1 - build
FROM node:20-alpine AS build
WORKDIR /app
ENV CI=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2 - production runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache tini curl

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/docs ./docs

RUN mkdir -p /app/uploads /app/uploads/temp && chown -R node:node /app

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/ready" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
