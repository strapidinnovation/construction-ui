import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { upsertMessage } from './cache.ts';
import { API_URL } from './client.ts';
import { keys } from './keys.ts';
import type { ChatMessage, Conversation } from './types.ts';

const LIST_REFRESH_MS = 1_000;

/**
 * Keeps a conversation live while it is on screen: every new or edited
 * message from the agent is written straight into the React Query cache.
 */
export function useConversationStream(conversationId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const source = new EventSource(
      `${API_URL}/conversations/${encodeURIComponent(conversationId)}/stream`,
    );
    let listTimer: number | undefined;

    const refreshList = () => {
      if (listTimer !== undefined) return;
      listTimer = window.setTimeout(() => {
        listTimer = undefined;
        void qc.invalidateQueries({ queryKey: keys.conversations });
      }, LIST_REFRESH_MS);
    };

    // Messages sent before the stream (re)connected are picked up by a refetch.
    source.addEventListener('open', () => {
      void qc.invalidateQueries({ queryKey: keys.conversation(conversationId) });
    });
    source.addEventListener('message', (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as ChatMessage;
      qc.setQueryData<Conversation>(keys.conversation(conversationId), (c) =>
        c ? upsertMessage(c, message) : c,
      );
      refreshList();
    });

    return () => {
      source.close();
      window.clearTimeout(listTimer);
    };
  }, [conversationId, qc]);
}
