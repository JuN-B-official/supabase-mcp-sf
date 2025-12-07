import { z } from 'zod';

export type DocsOperations = {
    searchDocs(query: string): Promise<DocsSearchResult[]>;
};

export const docsSearchResultSchema = z.object({
    title: z.string(),
    url: z.string(),
    content: z.string(),
    section: z.string().optional(),
});

export type DocsSearchResult = z.infer<typeof docsSearchResultSchema>;
