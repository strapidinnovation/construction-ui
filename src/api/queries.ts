import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { removeMessage, upsertMessage } from './cache.ts';
import { api, ApiError } from './client.ts';
import { keys } from './keys.ts';
import type {
  ChatMessage,
  Conversation,
  ConversationListItem,
  ProjectCounts,
  ProjectDetail,
  ProjectFilter,
  ProjectSummary,
} from './types.ts';

export function useHealth() {
  return useQuery({
    queryKey: keys.health,
    queryFn: ({ signal }) => api<{ ok: boolean }>('/health', { signal }),
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useProjects(filter: ProjectFilter = 'all', completed = false) {
  return useQuery({
    queryKey: keys.projects(filter, completed),
    queryFn: ({ signal }) =>
      api<{ projects: ProjectSummary[] }>(
        `/projects?filter=${filter}${completed ? '&completed=true' : ''}`,
        { signal },
      ),
    select: (data) => data.projects,
  });
}

export function useProjectSummary() {
  return useQuery({
    queryKey: keys.summary,
    queryFn: ({ signal }) => api<ProjectCounts>('/projects/summary', { signal }),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: keys.project(id ?? ''),
    queryFn: ({ signal }) =>
      api<ProjectDetail>(`/projects/${encodeURIComponent(id ?? '')}`, { signal }),
    enabled: Boolean(id),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}

export function useConversations() {
  return useQuery({
    queryKey: keys.conversations,
    queryFn: ({ signal }) =>
      api<{ conversations: ConversationListItem[] }>('/conversations', { signal }),
    select: (data) => data.conversations,
    refetchInterval: (query) =>
      query.state.data?.conversations.some((c) => c.busy) ? 5_000 : 30_000,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: keys.conversation(id),
    queryFn: ({ signal }) =>
      api<Conversation>(`/conversations/${encodeURIComponent(id)}`, { signal }),
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId?: string) =>
      api<Conversation>('/conversations', { method: 'POST', body: { projectId } }),
    onSuccess: (conversation) => {
      qc.setQueryData(keys.conversation(conversation.id), conversation);
      void qc.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ deleted: string }>(`/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: keys.conversation(id) });
      void qc.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

type SendVars = { conversationId: string; text: string };

/** Shows the message straight away; the agent's replies arrive on the conversation stream. */
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, text }: SendVars) =>
      api<ChatMessage>(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: 'POST',
        body: { text },
      }),
    onMutate: ({ conversationId, text }) => {
      const now = new Date().toISOString();
      const temp: ChatMessage = {
        id: `pending-${now}`,
        role: 'user',
        kind: 'text',
        text,
        createdAt: now,
        updatedAt: now,
      };
      qc.setQueryData<Conversation>(keys.conversation(conversationId), (c) =>
        c ? upsertMessage(c, temp) : c,
      );
      return { tempId: temp.id };
    },
    onSuccess: (message, { conversationId }, context) => {
      qc.setQueryData<Conversation>(keys.conversation(conversationId), (c) =>
        c ? upsertMessage(removeMessage(c, context.tempId), message) : c,
      );
    },
    onError: (_err, { conversationId }, context) => {
      if (!context) return;
      qc.setQueryData<Conversation>(keys.conversation(conversationId), (c) =>
        c ? removeMessage(c, context.tempId) : c,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.conversations }),
  });
}

type ActionVars = { conversationId: string; actionId: string; value: string };

export function useRunAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, actionId, value }: ActionVars) =>
      api<{ ok: true }>(`/conversations/${encodeURIComponent(conversationId)}/actions`, {
        method: 'POST',
        body: { actionId, value },
      }),
    onSettled: (_data, _err, { conversationId }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: keys.conversation(conversationId) }),
        qc.invalidateQueries({ queryKey: keys.conversations }),
      ]),
  });
}
