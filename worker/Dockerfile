FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /app/data/reports

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN addgroup -S worker && adduser -S worker -G worker \
    && chown -R worker:worker /app
USER worker

EXPOSE 5000

CMD ["node", "dist/index.js"]
