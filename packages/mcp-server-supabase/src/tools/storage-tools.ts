import { z } from 'zod';
import type { StorageOperations } from '../platform/types.js';
import { injectableTool } from './util.js';

const SUCCESS_RESPONSE = { success: true };

export type StorageToolsOptions = {
  storage: StorageOperations;
  projectId?: string;
  readOnly?: boolean;
};

export function getStorageTools({
  storage,
  projectId,
  readOnly,
}: StorageToolsOptions) {
  const project_id = projectId;

  return {
    list_storage_buckets: injectableTool({
      description: 'Lists all storage buckets in a Supabase project.',
      annotations: {
        title: 'List storage buckets',
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
        return await storage.listAllBuckets(project_id);
      },
    }),

    get_storage_config: injectableTool({
      description: 'Get the storage config for a Supabase project.',
      annotations: {
        title: 'Get storage config',
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
        return await storage.getStorageConfig(project_id);
      },
    }),

    update_storage_config: injectableTool({
      description: 'Update the storage config for a Supabase project.',
      annotations: {
        title: 'Update storage config',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      parameters: z.object({
        project_id: z.string(),
        config: z.object({
          fileSizeLimit: z.number(),
          features: z.object({
            imageTransformation: z.object({ enabled: z.boolean() }),
            s3Protocol: z.object({ enabled: z.boolean() }),
          }),
        }),
      }),
      inject: { project_id },
      execute: async ({ project_id, config }) => {
        if (readOnly) {
          throw new Error('Cannot update storage config in read-only mode.');
        }

        await storage.updateStorageConfig(project_id, config);
        return SUCCESS_RESPONSE;
      },
    }),

    // File Management Tools
    list_files: injectableTool({
      description: 'Lists all files in a storage bucket.',
      annotations: {
        title: 'List files',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      parameters: z.object({
        project_id: z.string(),
        bucket: z.string().describe('Name of the storage bucket'),
        path: z.string().optional().describe('Path prefix to filter files'),
      }),
      inject: { project_id },
      execute: async ({ project_id, bucket, path }) => {
        return await storage.listFiles(project_id, bucket, path);
      },
    }),

    upload_file: injectableTool({
      description: 'Uploads a file to a storage bucket. Content should be base64 encoded.',
      annotations: {
        title: 'Upload file',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      parameters: z.object({
        project_id: z.string(),
        bucket: z.string().describe('Name of the storage bucket'),
        path: z.string().describe('Path where the file will be stored'),
        content: z.string().describe('Base64 encoded file content'),
        content_type: z.string().optional().describe('MIME type of the file (e.g., image/png)'),
      }),
      inject: { project_id },
      execute: async ({ project_id, bucket, path, content, content_type }) => {
        if (readOnly) {
          throw new Error('Cannot upload file in read-only mode.');
        }
        return await storage.uploadFile(project_id, bucket, path, content, content_type);
      },
    }),

    download_file: injectableTool({
      description: 'Gets a signed URL to download a file from storage.',
      annotations: {
        title: 'Download file',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      parameters: z.object({
        project_id: z.string(),
        bucket: z.string().describe('Name of the storage bucket'),
        path: z.string().describe('Path to the file'),
      }),
      inject: { project_id },
      execute: async ({ project_id, bucket, path }) => {
        return await storage.downloadFile(project_id, bucket, path);
      },
    }),

    delete_file: injectableTool({
      description: 'Deletes one or more files from a storage bucket.',
      annotations: {
        title: 'Delete file',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
      parameters: z.object({
        project_id: z.string(),
        bucket: z.string().describe('Name of the storage bucket'),
        paths: z.array(z.string()).describe('Array of file paths to delete'),
      }),
      inject: { project_id },
      execute: async ({ project_id, bucket, paths }) => {
        if (readOnly) {
          throw new Error('Cannot delete files in read-only mode.');
        }
        await storage.deleteFile(project_id, bucket, paths);
        return SUCCESS_RESPONSE;
      },
    }),

    create_signed_url: injectableTool({
      description: 'Creates a signed URL for temporary access to a file.',
      annotations: {
        title: 'Create signed URL',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      parameters: z.object({
        project_id: z.string(),
        bucket: z.string().describe('Name of the storage bucket'),
        path: z.string().describe('Path to the file'),
        expires_in: z.number().describe('Expiration time in seconds (e.g., 3600 for 1 hour)'),
      }),
      inject: { project_id },
      execute: async ({ project_id, bucket, path, expires_in }) => {
        return await storage.createSignedUrl(project_id, bucket, path, expires_in);
      },
    }),
  };
}
