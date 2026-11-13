import { cx } from '../../lib/cx.ts';
import styles from './RuhMark.module.scss';

type Props = { size?: number; className?: string; label?: string };

/** The Ruh logo mark: the magenta-to-violet radial dot grid. */
export function RuhMark({ size = 32, className, label }: Props) {
  return (
    <img
      src="/ruh-mark.svg"
      width={size}
      height={size}
      className={cx(styles.mark, className)}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
    />
  );
}
