import { source } from 'common-tags';
import { z } from 'zod';
import type { DatabaseOperations } from '../platform/types.js';
import { injectableTool } from './util.js';

const SUCCESS_RESPONSE = { success: true };

// Inline table and extension schemas for self-hosted
const postgresTableSchema = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  rls_enabled: z.boolean(),
  rls_forced: z.boolean(),
  replica_identity: z.string(),
  bytes: z.number(),
  size: z.string(),
  live_rows_estimate: z.number(),
  dead_rows_estimate: z.number(),
  comment: z.string().nullable(),
  primary_keys: z.array(z.object({
    schema: z.string(),
    table_name: z.string(),
    name: z.string(),
    table_id: z.number(),
  })).optional(),
  relationships: z.array(z.object({
    id: z.number(),
    constraint_name: z.string(),
    source_schema: z.string(),
    source_table_name: z.string(),
    source_column_name: z.string(),
    target_table_schema: z.string(),
    target_table_name: z.string(),
    target_column_name: z.string(),
  })).optional(),
  columns: z.array(z.object({
    id: z.string(),
    table_id: z.number(),
    schema: z.string(),
    table: z.string(),
    name: z.string(),
    ordinal_position: z.number(),
    default_value: z.string().nullable(),
    data_type: z.string(),
    format: z.string(),
    is_identity: z.boolean(),
    identity_generation: z.string().nullable(),
    is_generated: z.boolean(),
    is_nullable: z.boolean(),
    is_updatable: z.boolean(),
    is_unique: z.boolean(),
    enums: z.array(z.string()),
    check: z.string().nullable(),
    comment: z.string().nullable(),
  })).optional(),
});

const postgresExtensionSchema = z.object({
  name: z.string(),
  schema: z.string().nullable(),
  default_version: z.string(),
  installed_version: z.string().nullable(),
  comment: z.string().nullable(),
});

// Simple SQL queries for self-hosted
function listTablesSql(schemas: string[]) {
  const schemaList = schemas.map(s => `'${s}'`).join(', ');
  return {
    query: `
      SELECT 
        c.oid::int8 AS id,
        nc.nspname AS schema,
        c.relname AS name,
        c.relrowsecurity AS rls_enabled,
        c.relforcerowsecurity AS rls_forced,
        CASE c.relreplident
          WHEN 'd' THEN 'DEFAULT'
          WHEN 'n' THEN 'NOTHING'
          WHEN 'f' THEN 'FULL'
          WHEN 'i' THEN 'INDEX'
        END AS replica_identity,
        pg_total_relation_size(c.oid)::int8 AS bytes,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
        c.reltuples::int8 AS live_rows_estimate,
        0::int8 AS dead_rows_estimate,
        obj_description(c.oid) AS comment,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'schema', nc.nspname,
            'table_name', c.relname,
            'name', a.attname,
            'table_id', c.oid::int8
          ))
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = c.oid AND i.indisprimary),
          '[]'::json
        ) AS primary_keys,
        '[]'::json AS relationships,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', nc.nspname || '.' || c.relname || '.' || a.attnum,
            'table_id', c.oid::int8,
            'schema', nc.nspname,
            'table', c.relname,
            'name', a.attname,
            'ordinal_position', a.attnum,
            'default_value', pg_get_expr(ad.adbin, ad.adrelid),
            'data_type', format_type(a.atttypid, a.atttypmod),
            'format', t.typname,
            'is_identity', a.attidentity != '',
            'identity_generation', NULLIF(a.attidentity, ''),
            'is_generated', a.attgenerated != '',
            'is_nullable', NOT a.attnotnull,
            'is_updatable', true,
            'is_unique', false,
            'enums', COALESCE((SELECT array_agg(e.enumlabel) FROM pg_enum e WHERE e.enumtypid = a.atttypid), ARRAY[]::text[]),
            'check', NULL,
            'comment', col_description(c.oid, a.attnum)
          ) ORDER BY a.attnum)
          FROM pg_attribute a
          LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
          LEFT JOIN pg_type t ON t.oid = a.atttypid
          WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped),
          '[]'::json
        ) AS columns
      FROM pg_class c
      JOIN pg_namespace nc ON nc.oid = c.relnamespace
      WHERE c.relkind IN ('r', 'p')
        AND nc.nspname IN (${schemaList})
      ORDER BY nc.nspname, c.relname
    `,
    parameters: [],
  };
}

function listExtensionsSql() {
  return `
    SELECT
      e.extname AS name,
      n.nspname AS schema,
      e.extversion AS installed_version,
      a.default_version,
      c.description AS comment
    FROM pg_extension e
    LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
    LEFT JOIN pg_available_extensions a ON a.name = e.extname
    LEFT JOIN pg_description c ON c.objoid = e.oid
    ORDER BY e.extname
  `;
}

export type DatabaseOperationToolsOptions = {
  database: DatabaseOperations;
  projectId?: string;
  readOnly?: boolean;
};

export function getDatabaseTools({
  database,
  projectId,
  readOnly,
}: DatabaseOperationToolsOptions) {
  const project_id = projectId;

  const databaseOperationTools = {
    list_tables: injectableTool({
      description: 'Lists all tables in one or more schemas.',
      annotations: {
        title: 'List tables',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      parameters: z.object({
        project_id: z.string(),
        schemas: z
          .array(z.string())
          .describe('List of schemas to include. Defaults to all schemas.')
          .default(['public']),
      }),
      inject: { project_id },
      execute: async ({ project_id, schemas }) => {
        const { query } = listTablesSql(schemas);
        const data = await database.executeSql(project_id, {
          query,
          read_only: true,
        });
        return data;
      },
    }),
    list_extensions: injectableTool({
      description: 'Lists all extensions in the database.',
      annotations: {
        title: 'List extensions',
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
        const query = listExtensionsSql();
        const data = await database.executeSql(project_id, {
          query,
          read_only: true,
        });
        return data;
      },
    }),
    list_migrations: injectableTool({
      description: 'Lists all migrations in the database.',
      annotations: {
        title: 'List migrations',
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
        return await database.listMigrations(project_id);
      },
    }),
    apply_migration: injectableTool({
      description:
        'Applies a migration to the database. Use this when executing DDL operations.',
      annotations: {
        title: 'Apply migration',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
      parameters: z.object({
        project_id: z.string(),
        name: z.string().describe('The name of the migration in snake_case'),
        query: z.string().describe('The SQL query to apply'),
      }),
      inject: { project_id },
      execute: async ({ project_id, name, query }) => {
        if (readOnly) {
          throw new Error('Cannot apply migration in read-only mode.');
        }

        await database.applyMigration(project_id, {
          name,
          query,
        });

        return SUCCESS_RESPONSE;
      },
    }),
    execute_sql: injectableTool({
      description:
        'Executes raw SQL in the Postgres database. Use `apply_migration` instead for DDL operations.',
      annotations: {
        title: 'Execute SQL',
        readOnlyHint: readOnly ?? false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
      parameters: z.object({
        project_id: z.string(),
        query: z.string().describe('The SQL query to execute'),
      }),
      inject: { project_id },
      execute: async ({ query, project_id }) => {
        const result = await database.executeSql(project_id, {
          query,
          read_only: readOnly,
        });

        const uuid = crypto.randomUUID();

        return source`
          Below is the result of the SQL query.

          <result-${uuid}>
          ${JSON.stringify(result)}
          </result-${uuid}>
        `;
      },
    }),
  };

  return databaseOperationTools;
}
