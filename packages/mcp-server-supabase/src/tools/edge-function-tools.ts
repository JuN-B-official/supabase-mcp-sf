import { z } from 'zod';
import type { EdgeFunctionsOperations } from '../functions/types.js';
import { injectableTool } from './util.js';

export type EdgeFunctionToolsOptions = {
    functions: EdgeFunctionsOperations;
    projectId?: string;
    readOnly?: boolean;
};

export function getEdgeFunctionTools({ functions, projectId, readOnly }: EdgeFunctionToolsOptions) {
    const project_id = projectId;

    const edgeFunctionTools = {
        list_edge_functions: injectableTool({
            description: 'Lists all Edge Functions deployed in the project.',
            annotations: {
                title: 'List Edge Functions',
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
                return await functions.listEdgeFunctions(project_id);
            },
        }),

        get_edge_function: injectableTool({
            description: 'Gets details of a specific Edge Function including its code.',
            annotations: {
                title: 'Get Edge Function',
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            parameters: z.object({
                project_id: z.string(),
                function_name: z.string().describe('Name of the Edge Function'),
            }),
            inject: { project_id },
            execute: async ({ project_id, function_name }) => {
                return await functions.getEdgeFunction(project_id, function_name);
            },
        }),

        invoke_edge_function: injectableTool({
            description: 'Invokes an Edge Function with the given parameters.',
            annotations: {
                title: 'Invoke Edge Function',
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                function_name: z.string().describe('Name of the Edge Function to invoke'),
                body: z.unknown().optional().describe('Request body (will be JSON stringified)'),
                headers: z.record(z.string()).optional().describe('Additional headers'),
                method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional().describe('HTTP method (default: POST)'),
            }),
            inject: { project_id },
            execute: async ({ project_id, function_name, body, headers, method }) => {
                return await functions.invokeEdgeFunction(project_id, {
                    function_name,
                    body,
                    headers,
                    method,
                });
            },
        }),

        deploy_edge_function: injectableTool({
            description: `Deploys a new Edge Function or updates an existing one in self-hosted Supabase.
The function code should be valid Deno/TypeScript code.

Example function code:
\`\`\`typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { name } = await req.json()
  return new Response(JSON.stringify({ message: \`Hello \${name}!\` }), {
    headers: { "Content-Type": "application/json" },
  })
})
\`\`\`

Note: In self-hosted mode, deployment creates the function file in the functions volume.
The functions service will automatically detect and load the new function.`,
            annotations: {
                title: 'Deploy Edge Function',
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                name: z.string().describe('Name of the function (used as the endpoint path)'),
                code: z.string().describe('The TypeScript/Deno code for the function'),
                entrypoint: z.string().optional().describe('Entry point file name (default: index.ts)'),
                import_map: z.string().optional().describe('Optional import map JSON string'),
                verify_jwt: z.boolean().optional().describe('Whether to verify JWT tokens (default: true)'),
            }),
            inject: { project_id },
            execute: async ({ project_id, name, code, entrypoint, import_map, verify_jwt }) => {
                if (readOnly) {
                    throw new Error('Cannot deploy Edge Function in read-only mode.');
                }
                return await functions.deployEdgeFunction(project_id, {
                    name,
                    code,
                    entrypoint,
                    import_map,
                    verify_jwt,
                });
            },
        }),
    };

    return edgeFunctionTools;
}
