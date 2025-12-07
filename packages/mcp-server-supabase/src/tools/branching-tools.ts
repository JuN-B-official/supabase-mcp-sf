import { z } from 'zod';
import type { BranchingOperations } from '../branching/types.js';
import { injectableTool } from './util.js';

const SUCCESS_RESPONSE = { success: true };

export type BranchingToolsOptions = {
    branching: BranchingOperations;
    projectId?: string;
    readOnly?: boolean;
};

export function getBranchingTools({ branching, projectId, readOnly }: BranchingToolsOptions) {
    const project_id = projectId;

    const branchingTools = {
        list_branches: injectableTool({
            description: 'Lists all database branches in the project. Branches are implemented as separate PostgreSQL schemas.',
            annotations: {
                title: 'List branches',
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
                return await branching.listBranches(project_id);
            },
        }),

        create_branch: injectableTool({
            description: `Creates a new database branch. In self-hosted mode, branches are implemented as separate PostgreSQL schemas.
This creates a new schema and optionally copies the structure from a parent branch.

Note: This is an experimental feature for self-hosted environments.`,
            annotations: {
                title: 'Create branch',
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                name: z.string().describe('Name of the new branch (will be used as schema name)'),
                parent_branch: z.string().optional().describe('Parent branch to copy structure from (default: public)'),
            }),
            inject: { project_id },
            execute: async ({ project_id, name, parent_branch }) => {
                if (readOnly) {
                    throw new Error('Cannot create branch in read-only mode.');
                }
                return await branching.createBranch(project_id, { name, parent_branch });
            },
        }),

        delete_branch: injectableTool({
            description: 'Deletes a database branch (drops the schema). Warning: This permanently removes all data in the branch.',
            annotations: {
                title: 'Delete branch',
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                branch_name: z.string().describe('Name of the branch to delete'),
            }),
            inject: { project_id },
            execute: async ({ project_id, branch_name }) => {
                if (readOnly) {
                    throw new Error('Cannot delete branch in read-only mode.');
                }
                await branching.deleteBranch(project_id, branch_name);
                return SUCCESS_RESPONSE;
            },
        }),

        merge_branch: injectableTool({
            description: `Merges changes from a source branch to a target branch.
This applies any migrations from the source branch to the target branch.`,
            annotations: {
                title: 'Merge branch',
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                source_branch: z.string().describe('Branch to merge from'),
                target_branch: z.string().optional().describe('Branch to merge into (default: public)'),
            }),
            inject: { project_id },
            execute: async ({ project_id, source_branch, target_branch }) => {
                if (readOnly) {
                    throw new Error('Cannot merge branch in read-only mode.');
                }
                return await branching.mergeBranch(project_id, { source_branch, target_branch });
            },
        }),

        reset_branch: injectableTool({
            description: 'Resets a branch to a specific migration version or to the initial state.',
            annotations: {
                title: 'Reset branch',
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                branch_name: z.string().describe('Name of the branch to reset'),
                migration_version: z.string().optional().describe('Migration version to reset to (omit to reset to initial state)'),
            }),
            inject: { project_id },
            execute: async ({ project_id, branch_name, migration_version }) => {
                if (readOnly) {
                    throw new Error('Cannot reset branch in read-only mode.');
                }
                await branching.resetBranch(project_id, { branch_name, migration_version });
                return SUCCESS_RESPONSE;
            },
        }),

        rebase_branch: injectableTool({
            description: 'Rebases a branch onto another branch, updating it with the latest changes from the target.',
            annotations: {
                title: 'Rebase branch',
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                branch_name: z.string().describe('Name of the branch to rebase'),
                target_branch: z.string().optional().describe('Branch to rebase onto (default: public)'),
            }),
            inject: { project_id },
            execute: async ({ project_id, branch_name, target_branch }) => {
                if (readOnly) {
                    throw new Error('Cannot rebase branch in read-only mode.');
                }
                await branching.rebaseBranch(project_id, { branch_name, target_branch });
                return SUCCESS_RESPONSE;
            },
        }),
    };

    return branchingTools;
}
