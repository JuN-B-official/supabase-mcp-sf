import { z } from 'zod';

export type OperationsOperations = {
    checkHealth(projectId: string): Promise<HealthCheckResult>;
    backupNow(projectId: string, options?: BackupOptions): Promise<BackupResult>;
    rotateSecret(projectId: string, options: RotateSecretOptions): Promise<RotateSecretResult>;
    getStats(projectId: string): Promise<SystemStats>;
    runScript(projectId: string, options: RunScriptOptions): Promise<ScriptResult>;
};

// Health check types
export const serviceHealthSchema = z.object({
    name: z.string(),
    status: z.enum(['healthy', 'unhealthy', 'starting', 'not_running', 'unknown']),
    message: z.string().optional(),
});

export type ServiceHealth = z.infer<typeof serviceHealthSchema>;

export const healthCheckResultSchema = z.object({
    overall: z.enum(['healthy', 'degraded', 'unhealthy']),
    services: z.array(serviceHealthSchema),
    endpoints: z.array(serviceHealthSchema),
    secrets_synced: z.boolean().optional(),
    timestamp: z.string(),
});

export type HealthCheckResult = z.infer<typeof healthCheckResultSchema>;

// Backup types
export const backupOptionsSchema = z.object({
    output_path: z.string().optional(),
    include_storage: z.boolean().optional(),
});

export type BackupOptions = z.infer<typeof backupOptionsSchema>;

export const backupResultSchema = z.object({
    success: z.boolean(),
    file_path: z.string().optional(),
    file_size: z.string().optional(),
    timestamp: z.string(),
    message: z.string(),
});

export type BackupResult = z.infer<typeof backupResultSchema>;

// Secret rotation types
export const rotateSecretOptionsSchema = z.object({
    secret_type: z.enum(['jwt', 'postgres_password', 'vault_key', 'anon_key', 'service_role_key']),
    dry_run: z.boolean().optional(),
});

export type RotateSecretOptions = z.infer<typeof rotateSecretOptionsSchema>;

export const rotateSecretResultSchema = z.object({
    success: z.boolean(),
    secret_type: z.string(),
    message: z.string(),
    requires_restart: z.boolean().optional(),
    new_value_preview: z.string().optional(),
});

export type RotateSecretResult = z.infer<typeof rotateSecretResultSchema>;

// System stats types
export const systemStatsSchema = z.object({
    database: z.object({
        size: z.string().optional(),
        connections_active: z.number().optional(),
        connections_max: z.number().optional(),
    }).optional(),
    storage: z.object({
        buckets_count: z.number().optional(),
        total_size: z.string().optional(),
    }).optional(),
    users: z.object({
        total_count: z.number().optional(),
    }).optional(),
    uptime: z.string().optional(),
    timestamp: z.string(),
});

export type SystemStats = z.infer<typeof systemStatsSchema>;

// Script execution types
export const runScriptOptionsSchema = z.object({
    script_name: z.enum(['check-health', 'backup', 'env-info', 'show-mcp']),
    args: z.array(z.string()).optional(),
});

export type RunScriptOptions = z.infer<typeof runScriptOptionsSchema>;

export const scriptResultSchema = z.object({
    success: z.boolean(),
    exit_code: z.number(),
    stdout: z.string(),
    stderr: z.string().optional(),
});

export type ScriptResult = z.infer<typeof scriptResultSchema>;
