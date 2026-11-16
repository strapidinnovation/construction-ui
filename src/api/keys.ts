import type { ProjectFilter } from './types.ts';

export const keys = {
  health: ['health'] as const,
  projects: (filter: ProjectFilter, completed: boolean) =>
    ['projects', 'list', { filter, completed }] as const,
  summary: ['projects', 'summary'] as const,
  project: (id: string) => ['projects', 'detail', id] as const,
  vendors: ['vendors', 'list'] as const,
  projectOrders: (projectId: string) => ['orders', 'list', { projectId }] as const,
  projectPayments: (projectId: string) => ['payments', 'list', { projectId }] as const,
  projectChangeOrders: (projectId: string) => ['change-orders', 'list', { projectId }] as const,
  projectDocuments: (projectId: string) => ['projects', 'documents', projectId] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
};
