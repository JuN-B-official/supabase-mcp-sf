import { z } from 'zod';

// Self-hosted available feature groups
export const currentFeatureGroupSchema = z.enum([
  'database',
  'debugging',
  'development',
  'storage',
  'auth',
  'functions',
  'branching',
  'docs',
  'operations',
]);

export const featureGroupSchema = currentFeatureGroupSchema;

export type FeatureGroup = z.infer<typeof featureGroupSchema>;
