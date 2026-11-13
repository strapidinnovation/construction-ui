import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Spinner } from '../../States/States.tsx';
import styles from './Composer.module.scss';

const MAX_LENGTH = 4000;

type Props = {
  onSend: (text: string) => void;
  sending?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

export function Composer({ onSend, sending = false, placeholder, autoFocus }: Props) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !sending;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend(trimmed);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
  };

  return (
    <form className={styles.composer} onSubmit={submit}>
      <div className={styles.box}>
        <textarea
          ref={ref}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? 'Message the construction agent…'}
          aria-label="Message"
          autoFocus={autoFocus}
        />
        <button type="submit" className={styles.send} disabled={!canSend} aria-label="Send">
          {sending ? <Spinner size={16} /> : <ArrowUp size={18} strokeWidth={2.4} />}
        </button>
      </div>
      <p className={styles.hint}>
        {trimmed.length > MAX_LENGTH ? (
          <span className={styles.over}>
            {trimmed.length - MAX_LENGTH} characters over the {MAX_LENGTH} limit
          </span>
        ) : (
          <>
            <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line. Big jobs
            run in the background, so you can leave and come back.
          </>
        )}
      </p>
    </form>
  );
}
