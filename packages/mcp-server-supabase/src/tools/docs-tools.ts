import { z } from 'zod';
import type { DocsOperations } from '../docs/types.js';
import { injectableTool } from './util.js';

export type DocsToolsOptions = {
    docs: DocsOperations;
};

export function getDocsTools({ docs }: DocsToolsOptions) {
    const docsTools = {
        search_docs: injectableTool({
            description: `Searches Supabase official documentation for relevant information.
Use this tool to find documentation about:
- Supabase features and APIs
- Best practices and guides
- Configuration options
- SDK usage examples`,
            annotations: {
                title: 'Search Docs',
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            parameters: z.object({
                query: z.string().describe('Search query for documentation'),
            }),
            inject: {},
            execute: async ({ query }) => {
                return await docs.searchDocs(query);
            },
        }),
    };

    return docsTools;
}
