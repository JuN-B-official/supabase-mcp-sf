import { z } from 'zod';

export type EdgeFunctionsOperations = {
    listEdgeFunctions(projectId: string): Promise<EdgeFunction[]>;
    invokeEdgeFunction(projectId: string, options: InvokeEdgeFunctionOptions): Promise<InvokeEdgeFunctionResult>;
    deployEdgeFunction(projectId: string, options: DeployEdgeFunctionOptions): Promise<DeployEdgeFunctionResult>;
    getEdgeFunction(projectId: string, functionName: string): Promise<EdgeFunctionDetails>;
};

export const edgeFunctionSchema = z.object({
    name: z.string(),
    slug: z.string().optional(),
    status: z.string().optional(),
    version: z.number().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type EdgeFunction = z.infer<typeof edgeFunctionSchema>;

export const edgeFunctionDetailsSchema = edgeFunctionSchema.extend({
    entrypoint_path: z.string().optional(),
    import_map_path: z.string().optional(),
    verify_jwt: z.boolean().optional(),
});

export type EdgeFunctionDetails = z.infer<typeof edgeFunctionDetailsSchema>;

export const invokeEdgeFunctionOptionsSchema = z.object({
    function_name: z.string(),
    body: z.unknown().optional(),
    headers: z.record(z.string()).optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
});

export type InvokeEdgeFunctionOptions = z.infer<typeof invokeEdgeFunctionOptionsSchema>;

export const invokeEdgeFunctionResultSchema = z.object({
    status: z.number(),
    headers: z.record(z.string()).optional(),
    body: z.unknown(),
});

export type InvokeEdgeFunctionResult = z.infer<typeof invokeEdgeFunctionResultSchema>;

export const deployEdgeFunctionOptionsSchema = z.object({
    name: z.string(),
    code: z.string(),
    entrypoint: z.string().optional(),
    import_map: z.string().optional(),
    verify_jwt: z.boolean().optional(),
});

export type DeployEdgeFunctionOptions = z.infer<typeof deployEdgeFunctionOptionsSchema>;

export const deployEdgeFunctionResultSchema = z.object({
    name: z.string(),
    status: z.string(),
    message: z.string(),
    deployment_path: z.string().optional(),
});

export type DeployEdgeFunctionResult = z.infer<typeof deployEdgeFunctionResultSchema>;
