import { z } from 'zod';

export type BranchingOperations = {
    listBranches(projectId: string): Promise<Branch[]>;
    createBranch(projectId: string, options: CreateBranchOptions): Promise<Branch>;
    deleteBranch(projectId: string, branchName: string): Promise<void>;
    mergeBranch(projectId: string, options: MergeBranchOptions): Promise<MergeBranchResult>;
    resetBranch(projectId: string, options: ResetBranchOptions): Promise<void>;
    rebaseBranch(projectId: string, options: RebaseBranchOptions): Promise<void>;
};

export const branchSchema = z.object({
    name: z.string(),
    schema_name: z.string(),
    created_at: z.string().optional(),
    is_default: z.boolean().optional(),
    parent_branch: z.string().optional(),
    migration_version: z.string().optional(),
});

export type Branch = z.infer<typeof branchSchema>;

export const createBranchOptionsSchema = z.object({
    name: z.string(),
    parent_branch: z.string().optional(),
});

export type CreateBranchOptions = z.infer<typeof createBranchOptionsSchema>;

export const mergeBranchOptionsSchema = z.object({
    source_branch: z.string(),
    target_branch: z.string().optional(),
});

export type MergeBranchOptions = z.infer<typeof mergeBranchOptionsSchema>;

export const mergeBranchResultSchema = z.object({
    success: z.boolean(),
    migrations_applied: z.array(z.string()).optional(),
    conflicts: z.array(z.string()).optional(),
});

export type MergeBranchResult = z.infer<typeof mergeBranchResultSchema>;

export const resetBranchOptionsSchema = z.object({
    branch_name: z.string(),
    migration_version: z.string().optional(),
});

export type ResetBranchOptions = z.infer<typeof resetBranchOptionsSchema>;

export const rebaseBranchOptionsSchema = z.object({
    branch_name: z.string(),
    target_branch: z.string().optional(),
});

export type RebaseBranchOptions = z.infer<typeof rebaseBranchOptionsSchema>;
