import { FolderKanban, MessageSquareOff } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useOutletContext, useParams } from 'react-router';
import { ApiError } from '../../../api/client.ts';
import {
  useConversation,
  useConversations,
  useProject,
  useRunAction,
  useSendMessage,
} from '../../../api/queries.ts';
import type { ChatAction, ProjectDetail } from '../../../api/types.ts';
import { useConversationStream } from '../../../api/useConversationStream.ts';
import { ButtonLink } from '../../../components/Button/Button.tsx';
import { ChatHero, ChatScreen } from '../../../components/chat/ChatScreen/ChatScreen.tsx';
import { Composer } from '../../../components/chat/Composer/Composer.tsx';
import { Message, Thinking } from '../../../components/chat/Message/Message.tsx';
import { Suggestions, type Prompt } from '../../../components/chat/Suggestions/Suggestions.tsx';
import { EmptyState, ErrorState, Spinner } from '../../../components/States/States.tsx';
import type { ChatOutletContext } from '../ChatLayout/ChatLayout.tsx';
import styles from './ChatConversation.module.scss';

export default function ChatConversation() {
  const { id = '' } = useParams();
  return <Conversation key={id} id={id} />;
}

function projectPrompts(name: string): Prompt[] {
  return [
    {
      title: 'Where does it stand?',
      detail: 'status and progress',
      text: `Where does ${name} stand right now?`,
    },
    {
      title: 'Why is it late?',
      detail: 'delay causes and impact',
      text: `What is delaying ${name}, and by how much?`,
    },
    {
      title: 'Open issues',
      detail: 'owners and next steps',
      text: `List the open issues on ${name} with owners and next steps.`,
    },
    {
      title: 'Budget',
      detail: 'spent vs contract',
      text: `How is ${name} tracking against its budget?`,
    },
  ];
}

function Conversation({ id }: { id: string }) {
  const { openSidebar } = useOutletContext<ChatOutletContext>();
  const conversation = useConversation(id);
  const listItem = useConversations().data?.find((c) => c.id === id);
  const project = useProject(conversation.data?.projectId);
  const send = useSendMessage();
  const action = useRunAction();
  useConversationStream(id);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const messages = conversation.data?.messages;
  const lastUpdate = messages?.at(-1)?.updatedAt;

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages?.length, lastUpdate]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const sendText = (text: string) => {
    stickToBottom.current = true;
    send.mutate({ conversationId: id, text });
  };

  const runAction = (a: ChatAction) =>
    action.mutate({ conversationId: id, actionId: a.actionId, value: a.value });

  const title = conversation.data?.title ?? 'Chat';
  const headerExtra = (
    <>
      {project.data && <ProjectChip project={project.data} />}
      {listItem?.busy && (
        <span className={styles.working}>
          <Spinner size={13} /> Agent working
        </span>
      )}
    </>
  );

  if (conversation.isError) {
    const notFound = conversation.error instanceof ApiError && conversation.error.status === 404;
    return (
      <ChatScreen title={title} onMenu={openSidebar} headerExtra={headerExtra}>
        <div className={styles.center}>
          {notFound ? (
            <>
              <EmptyState icon={<MessageSquareOff size={20} />} title="Chat not found">
                It may have been deleted.
              </EmptyState>
              <ButtonLink to="/chat" variant="primary">
                Start a new chat
              </ButtonLink>
            </>
          ) : (
            <ErrorState error={conversation.error} onRetry={() => void conversation.refetch()} />
          )}
        </div>
      </ChatScreen>
    );
  }

  const waitingForReply = messages?.at(-1)?.role === 'user';

  return (
    <ChatScreen
      title={title}
      onMenu={openSidebar}
      headerExtra={headerExtra}
      scrollRef={scrollRef}
      onScroll={onScroll}
      error={(send.error ?? action.error)?.message}
      footer={
        <Composer
          onSend={sendText}
          autoFocus
          placeholder={project.data ? `Ask about ${project.data.name}…` : undefined}
        />
      }
    >
      {!messages ? (
        <div className={styles.center}>
          <Spinner size={22} />
        </div>
      ) : messages.length === 0 ? (
        <ChatHero
          title={project.data ? `Ask about ${project.data.name}` : 'How can I help?'}
          description={
            project.data
              ? 'This chat is about this project, so you can skip naming it.'
              : 'Ask anything about your projects, or have the agent design and estimate a build.'
          }
        >
          {project.data && (
            <Suggestions prompts={projectPrompts(project.data.name)} onPick={sendText} />
          )}
        </ChatHero>
      ) : (
        <div className={styles.messages}>
          {messages.map((m) => (
            <Message
              key={m.id}
              message={m}
              onAction={runAction}
              runningAction={action.isPending ? action.variables : undefined}
            />
          ))}
          {waitingForReply && <Thinking />}
        </div>
      )}
    </ChatScreen>
  );
}

function ProjectChip({ project }: { project: ProjectDetail }) {
  return (
    <Link to={`/projects/${project.id}`} className={styles.projectChip}>
      <FolderKanban size={13} />
      <span>{project.name}</span>
    </Link>
  );
}
