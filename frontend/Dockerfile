FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY . ./

RUN npm install && npm run build

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["sh", "-c", "npm run start"]