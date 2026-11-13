import type { ProjectFilter } from './types.ts';

export const keys = {
  health: ['health'] as const,
  projects: (filter: ProjectFilter, completed: boolean) =>
    ['projects', 'list', { filter, completed }] as const,
  summary: ['projects', 'summary'] as const,
  project: (id: string) => ['projects', 'detail', id] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
};
