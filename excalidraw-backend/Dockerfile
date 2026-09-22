FROM node:22-alpine AS build

WORKDIR /app

COPY package.json yarn.lock* ./
COPY prisma ./prisma

RUN yarn install

COPY tsconfig.json ./
COPY src ./src

RUN yarn prisma:generate
RUN yarn tsc

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock* ./
COPY prisma ./prisma

RUN yarn install --production
RUN yarn prisma:generate

COPY --from=build /app/dist ./dist

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
