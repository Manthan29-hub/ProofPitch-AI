FROM node:22.22.3-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/proofpitch.sqlite
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME ["/app/data"]
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD node -e "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/src/server/index.js"]
