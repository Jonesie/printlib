# Single-container build: builds the web PWA and the API, then serves both
# from one Node process (API serves the built SPA as static files). This
# matches how other personal apps in this home stack are deployed — one
# container per app, reached only via the shared nginx reverse proxy.

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV WEB_DIST_DIR=/app/web-dist
ENV PORT=8000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/apps/web/dist ./web-dist

EXPOSE 8000
VOLUME ["/data"]
CMD ["node", "apps/api/dist/server.js"]
