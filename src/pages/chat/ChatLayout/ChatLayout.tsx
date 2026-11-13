import { MessageSquare, PanelLeftClose, SquarePen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useMatch, useNavigate } from 'react-router';
import { useConversations, useDeleteConversation } from '../../../api/queries.ts';
import type { ConversationListItem } from '../../../api/types.ts';
import { Skeleton, Spinner } from '../../../components/States/States.tsx';
import { cx } from '../../../lib/cx.ts';
import styles from './ChatLayout.module.scss';

export type ChatOutletContext = { openSidebar: () => void };

const GROUPS = ['Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days', 'Older'] as const;

function groupOf(iso: string): (typeof GROUPS)[number] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = (startOfToday.getTime() - new Date(iso).getTime()) / 86_400_000;
  if (days <= 0) return 'Today';
  if (days <= 1) return 'Yesterday';
  if (days <= 7) return 'Previous 7 days';
  if (days <= 30) return 'Previous 30 days';
  return 'Older';
}

export default function ChatLayout() {
  const activeId = useMatch('/chat/:id')?.params.id;
  const [open, setOpen] = useState(false);
  const conversations = useConversations();
  const remove = useDeleteConversation();
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const onDelete = (c: ConversationListItem) => {
    if (!window.confirm(`Delete "${c.title}"? This can't be undone.`)) return;
    remove.mutate(c.id, {
      onSuccess: () => {
        if (c.id === activeId) void navigate('/chat');
      },
    });
  };

  const grouped = GROUPS.map((label) => ({
    label,
    items: (conversations.data ?? []).filter((c) => groupOf(c.updatedAt) === label),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={styles.layout}>
      <aside className={cx(styles.sidebar, open && styles.open)}>
        <div className={styles.sidebarHeader}>
          <Link to="/chat" className={styles.newChat} onClick={close}>
            <SquarePen size={17} />
            New chat
          </Link>
          <button
            type="button"
            className={styles.closeButton}
            onClick={close}
            aria-label="Close chat list"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <nav className={styles.list} aria-label="Chats">
          {conversations.isPending ? (
            <div className={styles.skeletons}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height={34} />
              ))}
            </div>
          ) : conversations.isError ? (
            <p className={styles.note}>Couldn't load chats. {conversations.error.message}</p>
          ) : grouped.length === 0 ? (
            <div className={styles.emptyList}>
              <MessageSquare size={18} />
              <p>Your chats will show up here.</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className={styles.group}>
                <h2>{group.label}</h2>
                <ul>
                  {group.items.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/chat/${c.id}`}
                        onClick={close}
                        className={cx(styles.item, c.id === activeId && styles.active)}
                        title={c.title}
                      >
                        <span className={styles.itemTitle}>{c.title}</span>
                        {c.busy && <Spinner size={13} className={styles.busy} />}
                      </Link>
                      <button
                        type="button"
                        className={styles.delete}
                        onClick={() => onDelete(c)}
                        disabled={remove.isPending && remove.variables === c.id}
                        aria-label={`Delete ${c.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </nav>
      </aside>

      {open && <div className={styles.backdrop} onClick={close} aria-hidden />}

      <section className={styles.main}>
        <Outlet context={{ openSidebar: () => setOpen(true) } satisfies ChatOutletContext} />
      </section>
    </div>
  );
}
