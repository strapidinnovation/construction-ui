import { useOutletContext } from 'react-router';
import { useStartChat } from '../../../api/useStartChat.ts';
import { ChatHero, ChatScreen } from '../../../components/chat/ChatScreen/ChatScreen.tsx';
import { Composer } from '../../../components/chat/Composer/Composer.tsx';
import { Suggestions } from '../../../components/chat/Suggestions/Suggestions.tsx';
import type { ChatOutletContext } from '../ChatLayout/ChatLayout.tsx';

const PROMPTS = [
  {
    title: 'Which projects are delayed?',
    detail: 'and what is causing it',
    text: 'Which projects are delayed, and why?',
  },
  {
    title: 'Upcoming inspections',
    detail: 'for the next two weeks',
    text: 'What inspections are coming up in the next two weeks?',
  },
  {
    title: 'Budget check',
    detail: 'spend vs contract across projects',
    text: 'How is spending tracking against contract on each project?',
  },
  {
    title: 'Summarize River Bend',
    detail: 'status, issues and next steps',
    text: 'Give me a summary of River Bend Townhomes: status, open issues and next steps.',
  },
];

export default function ChatHome() {
  const { openSidebar } = useOutletContext<ChatOutletContext>();
  const { start, isPending, error } = useStartChat();

  return (
    <ChatScreen
      title="New chat"
      onMenu={openSidebar}
      error={error?.message}
      footer={<Composer onSend={start} sending={isPending} autoFocus />}
    >
      <ChatHero
        title="What are we building today?"
        description="Ask about schedules, delays, budgets and inspections, or have the agent design a house, estimate costs and plan a timeline."
      >
        <Suggestions prompts={PROMPTS} onPick={start} disabled={isPending} />
      </ChatHero>
    </ChatScreen>
  );
}
