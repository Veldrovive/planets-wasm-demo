# Install dependencies only when needed
FROM node:16.13-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk add curl
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM rust:1.57.0-slim-buster as rustbuilder
RUN apt-get update \
    && apt-get install -y curl make \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
# RUN echo $HOME
# RUN ls /usr/local/cargo -la
# RUN which rustup
COPY rust-planets/ ./rust-planets
RUN cd rust-planets && wasm-pack build --release

# Rebuild the source code only when needed
FROM node:16.13-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=rustbuilder /app/rust-planets/pkg ./rust-planets
COPY --from=deps /app/node_modules ./node_modules
RUN cd rust-planets && yarn link
RUN yarn link rust-planets
RUN yarn build && yarn install --production --ignore-scripts --prefer-offline

# Production image, copy all the files and run next
FROM node:16.13-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js ./
# COPY --from=builder /app/.env.local ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
# ENV NEXT_TELEMETRY_DISABLED 1

CMD ["yarn", "start"]
