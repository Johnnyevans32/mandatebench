# --- build stage: compile TS with dev deps -------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# --- runtime stage: prod deps + compiled output only ---------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean
COPY --from=build /app/dist ./dist
# Nest listens on configuration().port (PORT env, default 3001).
EXPOSE 3001
CMD ["node", "dist/main"]
