import { z } from 'zod';
import { tool } from '../mcp-utils/server.js';

export type AuthOperations = {
    listUsers(projectId: string, options?: ListUsersOptions): Promise<User[]>;
    getUser(projectId: string, userId: string): Promise<User>;
    createUser(projectId: string, options: CreateUserOptions): Promise<User>;
    deleteUser(projectId: string, userId: string): Promise<void>;
    generateLink(projectId: string, options: GenerateLinkOptions): Promise<GenerateLinkResult>;
};

export const userSchema = z.object({
    id: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string().optional(),
    last_sign_in_at: z.string().optional(),
    email_confirmed_at: z.string().optional(),
    phone_confirmed_at: z.string().optional(),
    role: z.string().optional(),
    app_metadata: z.record(z.unknown()).optional(),
    user_metadata: z.record(z.unknown()).optional(),
});

export type User = z.infer<typeof userSchema>;

export const listUsersOptionsSchema = z.object({
    page: z.number().optional(),
    per_page: z.number().optional(),
});

export type ListUsersOptions = z.infer<typeof listUsersOptionsSchema>;

export const createUserOptionsSchema = z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().optional(),
    email_confirm: z.boolean().optional(),
    phone_confirm: z.boolean().optional(),
    user_metadata: z.record(z.unknown()).optional(),
    app_metadata: z.record(z.unknown()).optional(),
});

export type CreateUserOptions = z.infer<typeof createUserOptionsSchema>;

export const generateLinkOptionsSchema = z.object({
    type: z.enum(['signup', 'magiclink', 'recovery', 'invite', 'email_change_new', 'email_change_current']),
    email: z.string(),
    password: z.string().optional(),
    redirect_to: z.string().optional(),
});

export type GenerateLinkOptions = z.infer<typeof generateLinkOptionsSchema>;

export const generateLinkResultSchema = z.object({
    action_link: z.string(),
    email_otp: z.string().optional(),
    hashed_token: z.string().optional(),
    verification_type: z.string().optional(),
});

export type GenerateLinkResult = z.infer<typeof generateLinkResultSchema>;
