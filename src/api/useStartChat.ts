import { useNavigate } from 'react-router';
import { useCreateConversation, useSendMessage } from './queries.ts';

/** Opens a new chat with `text` as its first message. */
export function useStartChat() {
  const navigate = useNavigate();
  const create = useCreateConversation();
  const send = useSendMessage();

  const start = (text: string) =>
    create.mutate(undefined, {
      onSuccess: (c) => {
        send.mutate({ conversationId: c.id, text });
        void navigate(`/chat/${c.id}`);
      },
    });

  return { start, isPending: create.isPending, error: create.error };
}
