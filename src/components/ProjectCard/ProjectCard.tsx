import { CalendarClock, MapPin, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import type { ProjectSummary } from '../../api/types.ts';
import { formatDate, formatUsdCompact, scheduleText } from '../../lib/format.ts';
import { ProgressBar } from '../ProgressBar/ProgressBar.tsx';
import styles from './ProjectCard.module.scss';
import { StatusBadge } from '../StatusBadge/StatusBadge.tsx';

export function ProjectCard({ project: p }: { project: ProjectSummary }) {
  const stage = p.currentStages.map((s) => `${s.label} ${s.percent}%`).join(' · ');
  const spent = p.budget.contractUsd ? (p.budget.spentUsd / p.budget.contractUsd) * 100 : 0;

  return (
    <Link to={`/projects/${p.id}`} className={styles.card} data-status={p.status}>
      <div className={styles.top}>
        <div className={styles.titles}>
          <h3>{p.name}</h3>
          <span className={styles.client}>{p.client}</span>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <div className={styles.address}>
        <MapPin size={13} />
        <span>{p.address}</span>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressLabel}>
          <span>
            {p.status === 'completed'
              ? 'Complete'
              : p.onHold
                ? `On hold since ${formatDate(p.onHold.since)}`
                : stage || 'Not started'}
          </span>
          <strong>{p.percentComplete}%</strong>
        </div>
        <ProgressBar value={p.percentComplete} status={p.status} label={`${p.name} progress`} />
        <div className={styles.stages}>
          Stage {Math.min(p.doneStages + 1, p.totalStages)} of {p.totalStages}
        </div>
      </div>

      <dl className={styles.meta}>
        <div>
          <dt>Schedule</dt>
          <dd data-late={p.daysLate > 7}>{scheduleText(p.daysLate)}</dd>
        </div>
        <div>
          <dt>Finish</dt>
          <dd>{formatDate(p.dates.actualFinish ?? p.dates.forecastFinish, true)}</dd>
        </div>
        <div>
          <dt>Budget</dt>
          <dd>
            {formatUsdCompact(p.budget.spentUsd)}
            <span className={styles.of}> / {formatUsdCompact(p.budget.contractUsd)}</span>
          </dd>
        </div>
      </dl>
      <ProgressBar value={spent} size="sm" label="Budget spent" />

      <div className={styles.footer}>
        <span className={styles.chip} data-alert={p.openIssueCount > 0}>
          <Wrench size={13} />
          {p.openIssueCount} open issue{p.openIssueCount === 1 ? '' : 's'}
        </span>
        {p.nextInspection && (
          <span className={styles.chip}>
            <CalendarClock size={13} />
            {p.nextInspection.name} · {formatDate(p.nextInspection.date)}
          </span>
        )}
      </div>
    </Link>
  );
}
