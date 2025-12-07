import { z } from 'zod';
import type {
    AuthOperations,
    CreateUserOptions,
    GenerateLinkOptions,
    ListUsersOptions,
} from '../auth/types.js';
import { injectableTool } from './util.js';

const SUCCESS_RESPONSE = { success: true };

export type AuthToolsOptions = {
    auth: AuthOperations;
    projectId?: string;
    readOnly?: boolean;
};

export function getAuthTools({ auth, projectId, readOnly }: AuthToolsOptions) {
    const project_id = projectId;

    const authTools = {
        list_users: injectableTool({
            description: 'Lists all users in the auth system.',
            annotations: {
                title: 'List users',
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            parameters: z.object({
                project_id: z.string(),
                page: z.number().optional().describe('Page number (1-indexed)'),
                per_page: z.number().optional().describe('Number of users per page (default: 50)'),
            }),
            inject: { project_id },
            execute: async ({ project_id, page, per_page }) => {
                return await auth.listUsers(project_id, { page, per_page });
            },
        }),

        get_user: injectableTool({
            description: 'Gets a user by their ID.',
            annotations: {
                title: 'Get user',
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            parameters: z.object({
                project_id: z.string(),
                user_id: z.string().describe('The UUID of the user'),
            }),
            inject: { project_id },
            execute: async ({ project_id, user_id }) => {
                return await auth.getUser(project_id, user_id);
            },
        }),

        create_user: injectableTool({
            description: 'Creates a new user in the auth system.',
            annotations: {
                title: 'Create user',
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                email: z.string().optional().describe('User email address'),
                phone: z.string().optional().describe('User phone number'),
                password: z.string().optional().describe('User password'),
                email_confirm: z.boolean().optional().describe('Auto-confirm email'),
                phone_confirm: z.boolean().optional().describe('Auto-confirm phone'),
                user_metadata: z.record(z.unknown()).optional().describe('Custom user metadata'),
            }),
            inject: { project_id },
            execute: async ({ project_id, ...options }) => {
                if (readOnly) {
                    throw new Error('Cannot create user in read-only mode.');
                }
                return await auth.createUser(project_id, options);
            },
        }),

        delete_user: injectableTool({
            description: 'Deletes a user from the auth system.',
            annotations: {
                title: 'Delete user',
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                user_id: z.string().describe('The UUID of the user to delete'),
            }),
            inject: { project_id },
            execute: async ({ project_id, user_id }) => {
                if (readOnly) {
                    throw new Error('Cannot delete user in read-only mode.');
                }
                await auth.deleteUser(project_id, user_id);
                return SUCCESS_RESPONSE;
            },
        }),

        generate_link: injectableTool({
            description: 'Generates a magic link, recovery link, or invite link for a user.',
            annotations: {
                title: 'Generate link',
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: true,
            },
            parameters: z.object({
                project_id: z.string(),
                type: z.enum(['signup', 'magiclink', 'recovery', 'invite', 'email_change_new', 'email_change_current'])
                    .describe('Type of link to generate'),
                email: z.string().describe('Email address for the link'),
                password: z.string().optional().describe('Password for signup links'),
                redirect_to: z.string().optional().describe('URL to redirect after verification'),
            }),
            inject: { project_id },
            execute: async ({ project_id, type, email, password, redirect_to }) => {
                if (readOnly) {
                    throw new Error('Cannot generate link in read-only mode.');
                }
                return await auth.generateLink(project_id, { type, email, password, redirect_to });
            },
        }),
    };

    return authTools;
}
