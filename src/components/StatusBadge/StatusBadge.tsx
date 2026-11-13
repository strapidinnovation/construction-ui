import type { ProjectStatus } from '../../api/types.ts';
import { STATUS_LABEL } from '../../lib/format.ts';
import styles from './StatusBadge.module.scss';

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={styles.badge} data-status={status}>
      <span className={styles.dot} />
      {STATUS_LABEL[status]}
    </span>
  );
}
