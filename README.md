# Supabase MCP Server (Self-Hosted)

> MCP Server for Self-Hosted Supabase - Optimized for single-instance management

This is a one-person project, built and maintained in spare time.

[![npm version](https://img.shields.io/npm/v/@jun-b/supabase-mcp-sf@latest)](https://www.npmjs.com/package/@jun-b/supabase-mcp-sf@latest)

## 💖 Sponsor

[![GitHub Sponsors](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/JuN-B-official)

> Your sponsorship helps me continuously develop and release more useful and amazing open source projects. Your support powers not only this project but also future projects to come!

Connect AI assistants (Claude, Cursor, etc.) directly to your self-hosted Supabase instance via the [Model Context Protocol](https://modelcontextprotocol.io/introduction).

# Related projects

- [supabase-sf](https://github.com/Song-JunHyeong/supabase-sf)

## Key Features

- **Self-Hosted First** - Designed specifically for self-hosted Supabase instances
- **SRE/Operations Tools** - Health checks, backups, secret rotation (unlike official MCP)
- **Granular Security** - Fine-grained read-only/read-write control
- **Server Panel/PaaS Ready** - Script integration for automated maintenance

## Comparison: Official vs Self-Hosted MCP

| Feature                    | Official Supabase MCP |    Supabase MCP (Self-Hosted)    |
| -------------------------- | :-------------------: | :------------------------------: |
| Target Environment         |  Supabase Cloud Only  |     Self-Hosted (Docker/VPS)     |
| Authentication             | OAuth (Cloud Account) | Direct Key (Service Role / Anon) |
| Multi-Project Management   |          ✅          |  ⚠️ (Single Instance Focus)  |
| SRE Tools (Backup, Rotate) |          ❌          |      ✅ (via Shell Scripts)      |
| Health Checks              |          ❌          |        ✅ (Service-level)        |
| Storage Management         |          ✅          |   ✅ (Supports Local Storage)   |
| Cost Management            |          ✅          |        N/A (Self-Hosted)        |
| Branching                  |       ✅ (Paid)       |        ✅ (Schema-based)        |
| Edge Functions Deploy      |      ✅ (Cloud)      |        ✅ (Manual + API)        |
| Custom AI Agent Role       |          ❌          |       ✅ (RLS Integration)       |

## Installation

```bash
npx @jun-b/supabase-mcp-sf@latest
```

That's it! No global installation required.

### Docker (Optional)

For server deployment (EasyPanel, Coolify, etc.):

```bash
# Build
docker build -t supabase-mcp-sf .

# Run
docker run -e SUPABASE_URL=http://host.docker.internal:8000 \
           -e SUPABASE_SERVICE_ROLE_KEY=your-key \
           supabase-mcp-sf
```

Or use Docker Compose:

```bash
docker compose -f docker-compose.mcp.yml up -d
```

## Configuration

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "supabase-sf": {
      "command": "npx",
      "args": ["-y", "@jun-b/supabase-mcp-sf@latest"],
      "env": {
        "SUPABASE_URL": <URL>,
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

### Troubleshooting: Antigravity IDE
If you encounter an Error: calling "initialize": EOF when connecting to Antigravity, it indicates that environment variables are failing to load at startup.

To resolve this, configure your mcp_config.json to pass credentials directly via args CLI arguments instead of using the env object.

File Location: ~/.gemini/antigravity/mcp_config.json

```json
{
  "mcpServers": {
    "supabase-mcp-sf": {
      "command": "npx",
      "args": [
        "-y",
        "@jun-b/supabase-mcp-sf@latest",
        "--supabase-url",
        "YOUR_SUPABASE_URL",
        "--service-role-key",
        "YOUR_SERVICE_ROLE_KEY",
        "--anon-key",
        "YOUR_ANON_KEY"
      ],
      "env": {}
    }
  }
}
```

Note: The --anon-key is optional but recommended for client-side operations that respect Row Level Security (RLS). Ensure you use the correct keys for --service-role-key (admin access) and --anon-key (public access).

### Environment Variables

| Variable                      | Required | Description              |
| ----------------------------- | -------- | ------------------------ |
| `SUPABASE_URL`              | ✅       | Self-hosted Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅       | Service role key         |
| `SUPABASE_ANON_KEY`         | ❌       | Anonymous key (optional) |

## Supported Tools

### Database

- `execute_sql`: Execute SQL queries
- `list_tables`: List tables in schemas
- `list_extensions`: List database extensions
- `list_migrations`: List applied migrations
- `apply_migration`: Apply schema migrations

### Docs (Knowledge Base)

- `search_docs`: Search Supabase official documentation

### Debugging

- `get_logs`: Get service logs (api, postgres, auth, storage, realtime, functions)
- `get_advisors`: Get security/performance recommendations

### Development

- `get_project_url`: Get project URL
- `get_anon_key`: Get anonymous API key
- `get_publishable_keys`: Get all API keys
- `generate_typescript_types`: Generate TypeScript types from schema

### Edge Functions

- `list_edge_functions`: List deployed functions
- `get_edge_function`: Get function details
- `invoke_edge_function`: Invoke a function
- `deploy_edge_function`: Deploy/update a function

### Branching (Experimental)

- `list_branches`: List database branches
- `create_branch`: Create a new branch
- `delete_branch`: Delete a branch
- `merge_branch`: Merge changes between branches
- `reset_branch`: Reset to migration version
- `rebase_branch`: Rebase onto another branch

### Storage (File Management)

- `create_storage_bucket`: Create a new storage bucket (via SQL) 🆕
- `list_storage_buckets`: List storage buckets
- `list_files`: List files in a bucket
- `upload_file`: Upload a file (base64)
- `download_file`: Get signed download URL
- `delete_file`: Delete files
- `create_signed_url`: Create temporary access URL
- `get_storage_config`: Get storage configuration
- `update_storage_config`: Update storage configuration

### Auth (User Management)

- `list_users`: List all users
- `get_user`: Get user by ID
- `create_user`: Create a new user
- `delete_user`: Delete a user
- `generate_link`: Generate magic/recovery/invite links

### Operations (SRE) 🆕

- `check_health`: Comprehensive health check of all services
- `backup_now`: Create immediate database backup
- `rotate_secret`: Rotate secrets (JWT, postgres password, vault key)
- `get_stats`: Get system statistics (DB size, connections, users)
- `run_script`: Execute maintenance scripts

#### AI as Your SRE: Auto-Healing Scenario

With Operations tools, your AI assistant can act as an autonomous SRE:

```
1. AI detects an issue via `check_health`
   → "Auth service is unhealthy"

2. AI reads logs via `get_logs`
   → "JWT validation errors detected"

3. AI decides to rotate secrets via `rotate_secret`
   → "Rotating JWT secret (dry-run first)..."

4. AI triggers `backup_now` before applying critical fixes
   → "Backup created: backup_20241207_120000.sql"

5. AI provides remediation instructions
   → "Run: docker compose restart auth"
```

This enables **AI-powered incident response** for your self-hosted Supabase!

## CLI Options

```bash
supabase-mcp-sf [options]

Options:
  --supabase-url <url>        Supabase URL
  --service-role-key <key>    Service role key
  --anon-key <key>            Anon key (optional)
  --read-only                 Read-only mode (disable writes)
  --features <list>           Enable specific features
  --version                   Show version
```

## Feature Control

Enable specific features via `--features`:

```bash
# Enable only database and operations
supabase-mcp-sf --features database,operations

# All features
supabase-mcp-sf --features database,debugging,development,storage,auth,functions,branching,docs,operations
```

## Security Best Practices

> ⚠️ **Important**: Security is critical when connecting AI assistants to your database. Follow these best practices to protect your data.

### 1. Use Read-Only Mode (Recommended)

**Always start with read-only mode**, especially in production environments:

```bash
supabase-mcp-sf --read-only
```

```json
{
  "mcpServers": {
    "supabase-sf": {
      "command": "npx",
      "args": ["-y", "@jun-b/supabase-mcp-sf@latest", "--read-only"],
      "env": {
        "SUPABASE_URL": "<URL>",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

This disables all write operations:
- ❌ SQL INSERT/UPDATE/DELETE
- ❌ File uploads
- ❌ User creation/deletion
- ❌ Migration applications
- ❌ Secret rotations

### 2. Service Role Key Precautions

> 🚨 **Critical Warning**: `SERVICE_ROLE_KEY` **bypasses all Row Level Security (RLS)** policies. It has full database access.

| Key Type | RLS | Use Case | Risk Level |
|----------|-----|----------|------------|
| `SERVICE_ROLE_KEY` | ❌ Bypassed | Admin operations, server-side only | 🔴 High |
| `ANON_KEY` | ✅ Applied | Client-side, public APIs | 🟢 Low |

**Recommendations:**
- ✅ **Only use SERVICE_ROLE_KEY in trusted, server-side environments**
- ✅ **Never expose SERVICE_ROLE_KEY to client-side code**
- ✅ **Prefer ANON_KEY when RLS policies are properly configured**
- ✅ **Rotate keys regularly using `rotate_secret` tool**

### 3. Row Level Security (RLS)

RLS is your primary defense layer. Always enable it:

```sql
-- Enable RLS on all tables
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too
ALTER TABLE public.your_table FORCE ROW LEVEL SECURITY;
```

> **💡 Note**: When using `ANON_KEY`, all queries respect RLS policies. This is the safest way to let AI access your data.

### 4. Custom AI Agent Role (Production Recommended)

For production, create a dedicated database role for AI agents with minimal permissions:

```sql
-- Create AI agent role with limited permissions
CREATE ROLE ai_agent WITH LOGIN PASSWORD 'secure-random-password-here';

-- Grant only SELECT on specific tables
GRANT SELECT ON public.products, public.categories TO ai_agent;

-- Grant EXECUTE on specific functions only
GRANT EXECUTE ON FUNCTION public.search_products TO ai_agent;

-- Deny access to sensitive tables
REVOKE ALL ON auth.users FROM ai_agent;
REVOKE ALL ON storage.objects FROM ai_agent;
```

#### RLS Policies for AI Agent

Create RLS policies specifically for the `ai_agent` role:

```sql
-- AI can only see non-sensitive, public data
CREATE POLICY ai_agent_products ON public.products
  FOR SELECT TO ai_agent
  USING (is_public = true);

-- AI can only see anonymized user data
CREATE POLICY ai_agent_users ON public.user_profiles
  FOR SELECT TO ai_agent
  USING (
    privacy_setting = 'public' 
    AND sensitive_data IS NULL
  );

-- AI cannot access admin data
CREATE POLICY ai_agent_no_admin ON public.admin_settings
  FOR SELECT TO ai_agent
  USING (false);
```

### 5. Environment-Specific Configuration

| Environment | Recommended Mode | Key Type | Features |
|-------------|------------------|----------|----------|
| **Development** | Read-Write | SERVICE_ROLE_KEY | All |
| **Staging** | Read-Only | SERVICE_ROLE_KEY | database,debugging |
| **Production** | Read-Only | ANON_KEY + Custom Role | database,docs |

```bash
# Development (full access)
supabase-mcp-sf --features database,operations,storage,auth

# Staging (monitoring only)
supabase-mcp-sf --read-only --features database,debugging,docs

# Production (minimal, safe access)
supabase-mcp-sf --read-only --features database,docs
```

### 6. Security Checklist

Before deploying AI access to your Supabase instance:

- [ ] Enable RLS on ALL tables containing user data
- [ ] Create dedicated AI agent role with minimal permissions
- [ ] Use `--read-only` mode in production
- [ ] Never expose SERVICE_ROLE_KEY to clients
- [ ] Limit features using `--features` flag
- [ ] Regularly audit AI query logs via `get_logs`
- [ ] Set up alerts for unusual database activity
- [ ] Rotate secrets periodically using `rotate_secret`

### 7. Audit and Monitoring

Use the debugging tools to monitor AI activity:

```
"Show me all database queries from the last hour and flag any suspicious patterns"
```

```
"Check the logs for any failed authentication attempts or permission errors"
```

## Integration with Server Panel / PaaS

The operations tools can trigger server-side scripts for automated maintenance:

```bash
# AI can request backup
./scripts/backup.sh

# AI can rotate secrets
./scripts/rotate-jwt-secret.sh

# AI can check health
./scripts/check-health.sh
```

### Example AI Prompts

**Health Check & Backup:**

```
"Check the health of my Supabase instance. If everything is healthy, 
create a database backup and then list all users created in the last 24 hours."
```

**Incident Response:**

```
"The auth service seems slow. Check the logs for any errors in the last hour, 
and tell me if I need to restart any services."
```

**Statistics Report:**

```
"Give me a summary of my Supabase instance: database size, active connections, 
total users, and storage usage."
```

## Related Projects

- **[supabase-sf](https://github.com/Song-JunHyeong/supabase-sf)** - Production-ready Docker Compose setup for self-hosting Supabase with automated secret management. This MCP server is designed to work seamlessly with supabase-sf.

## License

Apache 2.0
