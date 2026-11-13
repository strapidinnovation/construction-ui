import { LoaderCircle, RotateCw, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx.ts';
import styles from './States.module.scss';

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return <LoaderCircle size={size} className={cx(styles.spinner, className)} aria-hidden />;
}

export function Skeleton({ height = 16, className }: { height?: number; className?: string }) {
  return <div className={cx(styles.skeleton, className)} style={{ height }} />;
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className={styles.box} role="alert">
      <div className={cx(styles.icon, styles.danger)}>
        <TriangleAlert size={20} />
      </div>
      <div>
        <h3>Something went wrong</h3>
        <p>{error.message}</p>
      </div>
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          <RotateCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}

type EmptyProps = { icon: ReactNode; title: string; children?: ReactNode };

export function EmptyState({ icon, title, children }: EmptyProps) {
  return (
    <div className={styles.box}>
      <div className={styles.icon}>{icon}</div>
      <div>
        <h3>{title}</h3>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}
