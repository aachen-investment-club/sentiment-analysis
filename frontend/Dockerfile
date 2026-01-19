FROM node:20-slim

WORKDIR /app
RUN corepack enable

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --shamefully-hoist
RUN ls -la node_modules/next/dist/bin/next

COPY frontend/ ./

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start", "-p", "3000", "-H", "0.0.0.0"]
