FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation \
    libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    libpango-1.0-0 libcairo2 libnspr4 libcups2 libatk1.0-0 libgtk-3-0 \
    libxshmfence1 libxss1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/playwright

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npx puppeteer browsers install chrome
RUN npx playwright install chromium

RUN npm run build

RUN mkdir -p /data
ENV DATA_DIR=/data
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
