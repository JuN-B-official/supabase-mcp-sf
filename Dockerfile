# ═══════════════════════════════════════════════════════════════════════════════
# Supabase MCP Server (Self-Hosted) - Docker Image
# ═══════════════════════════════════════════════════════════════════════════════
#
# Build:
#   docker build -t supabase-mcp-sf .
#
# Run:
#   docker run -e SUPABASE_URL=http://host.docker.internal:8000 \
#              -e SUPABASE_SERVICE_ROLE_KEY=your-key \
#              supabase-mcp-sf
#
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/mcp-utils ./packages/mcp-utils
COPY packages/mcp-server-supabase ./packages/mcp-server-supabase

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm build

# ─────────────────────────────────────────────────────────────────────────────
# Production image
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 mcpserver
USER mcpserver

# Copy built files
COPY --from=builder --chown=mcpserver:nodejs /app/packages/mcp-server-supabase/dist ./dist
COPY --from=builder --chown=mcpserver:nodejs /app/packages/mcp-server-supabase/package.json ./
COPY --from=builder --chown=mcpserver:nodejs /app/node_modules ./node_modules

# Environment variables
ENV NODE_ENV=production
ENV SUPABASE_URL=""
ENV SUPABASE_SERVICE_ROLE_KEY=""
ENV SUPABASE_ANON_KEY=""

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Run MCP server
ENTRYPOINT ["node", "dist/transports/stdio-selfhosted.js"]
