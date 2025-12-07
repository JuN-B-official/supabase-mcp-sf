import { z } from 'zod';
import type { OperationsOperations } from '../operations/types.js';
import { injectableTool } from './util.js';

const SUCCESS_RESPONSE = { success: true };

export type OperationsToolsOptions = {
    operations: OperationsOperations;
    projectId?: string;
    readOnly?: boolean;
};

export function getOperationsTools({ operations, projectId, readOnly }: OperationsToolsOptions) {
    const project_id = projectId;

    const operationsTools = {
        check_health: injectableTool({
            description: `Performs a comprehensive health check of the Supabase instance.
Checks:
- Container health status (db, kong, auth, rest, realtime, storage, meta, functions, pooler, studio)
- Service endpoint availability
- Secret synchronization between env and database`,
            annotations: {
                title: 'Check Health',
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            parameters: z.object({
                project_id: z.string(),
            }),
            inject: { project_id },
            execute: async ({ project_id }) => {
                return await operations.checkHealth(project_id);
            },
        }),

        backup_now: injectableTool({
            description: `Creates an immediate database backup (pg_dumpall).
The backup includes all databases and can be restored with:
docker exec -i supabase-db psql -U postgres < backup_file.sql`,
            annotations: {
                title: 'Backup Now',
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                output_path: z.string().optional().describe('Custom backup output path'),
                include_storage: z.boolean().optional().describe('Include storage files in backup'),
            }),
            inject: { project_id },
            execute: async ({ project_id, output_path, include_storage }) => {
                if (readOnly) {
                    throw new Error('Cannot create backup in read-only mode.');
                }
                return await operations.backupNow(project_id, { output_path, include_storage });
            },
        }),

        rotate_secret: injectableTool({
            description: `Rotates a secret/credential with zero-downtime.
Available secrets to rotate:
- jwt: JWT signing secret (requires service restart)
- postgres_password: Database password
- vault_key: Vault encryption key
- anon_key: Anonymous API key
- service_role_key: Service role API key

WARNING: This is a critical operation. Use dry_run=true first to preview changes.`,
            annotations: {
                title: 'Rotate Secret',
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                secret_type: z.enum(['jwt', 'postgres_password', 'vault_key', 'anon_key', 'service_role_key'])
                    .describe('Type of secret to rotate'),
                dry_run: z.boolean().optional().describe('Preview changes without applying (default: true)'),
            }),
            inject: { project_id },
            execute: async ({ project_id, secret_type, dry_run = true }) => {
                if (readOnly) {
                    throw new Error('Cannot rotate secrets in read-only mode.');
                }
                return await operations.rotateSecret(project_id, { secret_type, dry_run });
            },
        }),

        get_stats: injectableTool({
            description: `Gets system statistics and metrics for the Supabase instance.
Includes:
- Database size and connection counts
- Storage bucket count and total size
- User count
- System uptime`,
            annotations: {
                title: 'Get Stats',
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            parameters: z.object({
                project_id: z.string(),
            }),
            inject: { project_id },
            execute: async ({ project_id }) => {
                return await operations.getStats(project_id);
            },
        }),

        run_script: injectableTool({
            description: `Executes a predefined maintenance script on the server.
Available scripts:
- check-health: Comprehensive health check
- backup: Create database backup
- env-info: Show environment information
- show-mcp: Show MCP configuration

This allows AI to trigger server-side maintenance operations.`,
            annotations: {
                title: 'Run Script',
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                script_name: z.enum(['check-health', 'backup', 'env-info', 'show-mcp'])
                    .describe('Name of the script to run'),
                args: z.array(z.string()).optional().describe('Additional arguments for the script'),
            }),
            inject: { project_id },
            execute: async ({ project_id, script_name, args }) => {
                if (readOnly && script_name === 'backup') {
                    throw new Error('Cannot run backup script in read-only mode.');
                }
                return await operations.runScript(project_id, { script_name, args });
            },
        }),
    };

    return operationsTools;
}
