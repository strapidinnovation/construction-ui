import type { ChatMessage, Conversation } from './types.ts';

/** Add a message, or replace the one with the same id (the agent edits status messages in place). */
export function upsertMessage(conversation: Conversation, message: ChatMessage): Conversation {
  const i = conversation.messages.findIndex((m) => m.id === message.id);
  const messages =
    i >= 0
      ? conversation.messages.map((m, j) => (j === i ? message : m))
      : [...conversation.messages, message];
  return { ...conversation, messages, updatedAt: message.updatedAt };
}

export function removeMessage(conversation: Conversation, id: string): Conversation {
  return { ...conversation, messages: conversation.messages.filter((m) => m.id !== id) };
}
