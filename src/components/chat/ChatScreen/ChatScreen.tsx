import { Menu, TriangleAlert } from 'lucide-react';
import type { ReactNode, RefObject, UIEventHandler } from 'react';
import { RuhMark } from '../../RuhMark/RuhMark.tsx';
import styles from './ChatScreen.module.scss';

type Props = {
  title: ReactNode;
  onMenu: () => void;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  error?: string | null;
  scrollRef?: RefObject<HTMLDivElement | null>;
  onScroll?: UIEventHandler<HTMLDivElement>;
  children: ReactNode;
};

/** The frame of a chat screen: header, scrolling body, and the composer area. */
export function ChatScreen({
  title,
  onMenu,
  headerExtra,
  footer,
  error,
  scrollRef,
  onScroll,
  children,
}: Props) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.menu} onClick={onMenu} aria-label="Show chats">
          <Menu size={18} />
        </button>
        <h1 className={styles.title}>{title}</h1>
        {headerExtra}
      </header>

      <div className={styles.scroll} ref={scrollRef} onScroll={onScroll}>
        {children}
      </div>

      {(footer || error) && (
        <div className={styles.footer}>
          {error && (
            <p className={styles.error}>
              <TriangleAlert size={14} />
              {error}
            </p>
          )}
          {footer}
        </div>
      )}
    </div>
  );
}

type HeroProps = { title: ReactNode; description: ReactNode; children?: ReactNode };

export function ChatHero({ title, description, children }: HeroProps) {
  return (
    <div className={styles.hero}>
      <span className={styles.heroIcon}>
        <RuhMark size={64} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
