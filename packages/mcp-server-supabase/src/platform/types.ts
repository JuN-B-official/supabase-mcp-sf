import type { InitData } from '../mcp-utils/server.js';
import { z } from 'zod';

export type SuccessResponse = {
  success: true;
};

// Storage schemas
export const storageBucketSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  public: z.boolean(),
});

export const storageConfigSchema = z.object({
  fileSizeLimit: z.number(),
  features: z.object({
    imageTransformation: z.object({ enabled: z.boolean() }),
    s3Protocol: z.object({ enabled: z.boolean() }),
  }),
});

export const storageFileSchema = z.object({
  name: z.string(),
  id: z.string().optional(),
  updated_at: z.string().optional(),
  created_at: z.string().optional(),
  last_accessed_at: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type StorageFile = z.infer<typeof storageFileSchema>;

// Database schemas
export const executeSqlOptionsSchema = z.object({
  query: z.string(),
  parameters: z.array(z.unknown()).optional(),
  read_only: z.boolean().optional(),
});

export const applyMigrationOptionsSchema = z.object({
  name: z.string(),
  query: z.string(),
});

export const migrationSchema = z.object({
  version: z.string(),
  name: z.string().optional(),
});

// Logs schemas
export const logsServiceSchema = z.enum([
  'api',
  'postgres',
  'auth',
  'storage',
  'realtime',
  'functions',
]);

export const getLogsOptionsSchema = z.object({
  service: logsServiceSchema,
  iso_timestamp_start: z.string().optional(),
  iso_timestamp_end: z.string().optional(),
});

export const generateTypescriptTypesResultSchema = z.object({
  types: z.string(),
});

// Type exports
export type ExecuteSqlOptions = z.infer<typeof executeSqlOptionsSchema>;
export type ApplyMigrationOptions = z.infer<typeof applyMigrationOptionsSchema>;
export type Migration = z.infer<typeof migrationSchema>;
export type ListMigrationsResult = z.infer<typeof migrationSchema>;

export type LogsService = z.infer<typeof logsServiceSchema>;
export type GetLogsOptions = z.infer<typeof getLogsOptionsSchema>;
export type GenerateTypescriptTypesResult = z.infer<
  typeof generateTypescriptTypesResultSchema
>;

export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type StorageBucket = z.infer<typeof storageBucketSchema>;

export const apiKeyTypeSchema = z.enum(['legacy', 'publishable']);
export type ApiKeyType = z.infer<typeof apiKeyTypeSchema>;

export type ApiKey = {
  api_key: string;
  name: string;
  type: ApiKeyType;
  description?: string;
  id?: string;
  disabled?: boolean;
};

// Operations interfaces
export type DatabaseOperations = {
  executeSql<T>(projectId: string, options: ExecuteSqlOptions): Promise<T[]>;
  listMigrations(projectId: string): Promise<Migration[]>;
  applyMigration(
    projectId: string,
    options: ApplyMigrationOptions
  ): Promise<void>;
};

export type DebuggingOperations = {
  getLogs(projectId: string, options: GetLogsOptions): Promise<unknown>;
  getSecurityAdvisors(projectId: string): Promise<unknown>;
  getPerformanceAdvisors(projectId: string): Promise<unknown>;
};

export type DevelopmentOperations = {
  getProjectUrl(projectId: string): Promise<string>;
  getPublishableKeys(projectId: string): Promise<ApiKey[]>;
  generateTypescriptTypes(
    projectId: string
  ): Promise<GenerateTypescriptTypesResult>;
};

export type StorageOperations = {
  getStorageConfig(projectId: string): Promise<StorageConfig>;
  updateStorageConfig(projectId: string, config: StorageConfig): Promise<void>;
  listAllBuckets(projectId: string): Promise<StorageBucket[]>;
  // File operations
  listFiles(projectId: string, bucket: string, path?: string): Promise<StorageFile[]>;
  uploadFile(projectId: string, bucket: string, path: string, content: string, contentType?: string): Promise<{ path: string }>;
  downloadFile(projectId: string, bucket: string, path: string): Promise<{ signedUrl: string }>;
  deleteFile(projectId: string, bucket: string, paths: string[]): Promise<void>;
  createSignedUrl(projectId: string, bucket: string, path: string, expiresIn: number): Promise<{ signedUrl: string }>;
};

// Re-export from separate type files
export type { AuthOperations } from '../auth/types.js';
export type { EdgeFunctionsOperations } from '../functions/types.js';
export type { BranchingOperations } from '../branching/types.js';
export type { DocsOperations } from '../docs/types.js';
export type { OperationsOperations } from '../operations/types.js';

// Import for SupabasePlatform
import type { AuthOperations } from '../auth/types.js';
import type { EdgeFunctionsOperations } from '../functions/types.js';
import type { BranchingOperations } from '../branching/types.js';
import type { DocsOperations } from '../docs/types.js';
import type { OperationsOperations } from '../operations/types.js';

/**
 * Self-hosted Supabase platform interface.
 */
export type SupabasePlatform = {
  init?(info: InitData): Promise<void>;
  database?: DatabaseOperations;
  debugging?: DebuggingOperations;
  development?: DevelopmentOperations;
  storage?: StorageOperations;
  auth?: AuthOperations;
  functions?: EdgeFunctionsOperations;
  branching?: BranchingOperations;
  docs?: DocsOperations;
  operations?: OperationsOperations;
};
