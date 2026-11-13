import type { CSSProperties } from 'react';
import type { ProjectStatus } from '../../api/types.ts';
import { cx } from '../../lib/cx.ts';
import styles from './ProgressBar.module.scss';

type Props = {
  value: number;
  status?: ProjectStatus;
  size?: 'sm' | 'md';
  label?: string;
};

export function ProgressBar({ value, status, size = 'md', label }: Props) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cx(styles.track, styles[size])}
      data-status={status}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={styles.fill} style={{ '--value': `${percent}%` } as CSSProperties} />
    </div>
  );
}
