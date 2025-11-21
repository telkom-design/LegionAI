# ---- build stage ----
FROM playcourt/nodejs:22-jammy AS build
WORKDIR /app

# CI-friendly env
ENV HUSKY=0
ENV CI=true

# Use pnpm
USER root
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Ensure git is available for build and runtime scripts
RUN apt-get update && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

# Accept (optional) build-time public URL for Remix/Vite (Coolify can pass it)
ARG VITE_PUBLIC_APP_URL
ENV VITE_PUBLIC_APP_URL=${VITE_PUBLIC_APP_URL}

# Accept all VITE_* variables as build args
ARG VITE_AZURE_CLIENT_ID
ARG VITE_AZURE_TENANT_ID
ARG VITE_AZURE_CLIENT_SECRET
ARG VITE_AZURE_REDIRECT_URI
ARG VITE_DEFAULT_THEME
ARG VITE_DEFAULT_PROVIDER
ARG VITE_DEFAULT_MODEL
ARG VITE_BASE_URL
ARG VITE_GITHUB_ACCESS_TOKEN
ARG VITE_GITHUB_TOKEN_TYPE
ARG VITE_NETLIFY_ACCESS_TOKEN
ARG VITE_MCP_SERVERS
ARG VITE_LOG_LEVEL

# Set them as ENV variables so they're available during build
ENV VITE_AZURE_CLIENT_ID=${VITE_AZURE_CLIENT_ID}
ENV VITE_AZURE_TENANT_ID=${VITE_AZURE_TENANT_ID}
ENV VITE_AZURE_CLIENT_SECRET=${VITE_AZURE_CLIENT_SECRET}
ENV VITE_AZURE_REDIRECT_URI=${VITE_AZURE_REDIRECT_URI}
ENV VITE_DEFAULT_THEME=${VITE_DEFAULT_THEME}
ENV VITE_DEFAULT_PROVIDER=${VITE_DEFAULT_PROVIDER}
ENV VITE_DEFAULT_MODEL=${VITE_DEFAULT_MODEL}
ENV VITE_BASE_URL=${VITE_BASE_URL}
ENV VITE_GITHUB_ACCESS_TOKEN=${VITE_GITHUB_ACCESS_TOKEN}
ENV VITE_GITHUB_TOKEN_TYPE=${VITE_GITHUB_TOKEN_TYPE}
ENV VITE_NETLIFY_ACCESS_TOKEN=${VITE_NETLIFY_ACCESS_TOKEN}
ENV VITE_MCP_SERVERS=${VITE_MCP_SERVERS}
ENV VITE_LOG_LEVEL=${VITE_LOG_LEVEL}

# Install deps efficiently
COPY package.json pnpm-lock.yaml* ./
RUN pnpm fetch

# Copy source and build
COPY . .
# install with dev deps (needed to build)
RUN pnpm install --offline --frozen-lockfile

# Build the Remix app (SSR + client)
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm run build

# ---- production dependencies stage ----
FROM build AS prod-deps

# Keep only production deps for runtime
RUN pnpm prune --prod --ignore-scripts

# Reinstall wrangler as it's needed for runtime
RUN pnpm add wrangler --save-prod --ignore-scripts

# ---- production stage ----
FROM prod-deps AS bolt-ai-production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

# Non-sensitive build arguments
ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX

# Set non-sensitive environment variables
ENV WRANGLER_SEND_METRICS=false \
    VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX} \
    RUNNING_IN_DOCKER=true
# Note: API keys should be provided at runtime via docker run -e or docker-compose
# Example: docker run -e OPENAI_API_KEY=your_key_here ...

# Install curl for healthchecks and copy bindings script
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# Copy built files and scripts
COPY --from=prod-deps /app/build /app/build
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/package.json /app/package.json
COPY --from=prod-deps /app/bindings.sh /app/bindings.sh

# Pre-configure wrangler to disable metrics
RUN mkdir -p /root/.config/.wrangler && \
    echo '{"enabled":false}' > /root/.config/.wrangler/metrics.json

# Make bindings script executable
RUN chmod +x /app/bindings.sh

EXPOSE 5173

# Healthcheck for deployment platforms
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD curl -fsS http://localhost:5173/ || exit 1

# Start using dockerstart script with Wrangler
CMD ["pnpm", "run", "dockerstart"]


# ---- development stage ----
FROM build AS bolt-ai-development

# Non-sensitive development arguments
ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX

# Set non-sensitive environment variables for development
ENV VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX} \
    RUNNING_IN_DOCKER=true

# Note: API keys should be provided at runtime via docker run -e or docker-compose
# Example: docker run -e OPENAI_API_KEY=your_key_here ...

RUN mkdir -p /app/run
CMD ["pnpm", "run", "dev", "--host"]
