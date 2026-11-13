import {
  CalendarClock,
  ChevronRight,
  FolderKanban,
  MessageSquare,
  Plus,
  TriangleAlert,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';
import { useConversations, useProjects, useProjectSummary } from '../../api/queries.ts';
import type { ProjectCounts, ProjectSummary } from '../../api/types.ts';
import { ButtonLink } from '../../components/Button/Button.tsx';
import { Card, Page } from '../../components/Page/Page.tsx';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar.tsx';
import { EmptyState, ErrorState, Skeleton, Spinner } from '../../components/States/States.tsx';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge.tsx';
import {
  daysUntil,
  formatDate,
  formatRelative,
  formatUsdCompact,
  scheduleText,
  STATUS_LABEL,
  STATUS_ORDER,
} from '../../lib/format.ts';
import styles from './Dashboard.module.scss';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const summary = useProjectSummary();
  const projects = useProjects('all');

  return (
    <Page
      eyebrow={new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}
      title={greeting()}
      subtitle="Here's where your builds stand today."
      actions={
        <>
          <ButtonLink to="/projects">
            <FolderKanban size={16} /> All projects
          </ButtonLink>
          <ButtonLink to="/chat" variant="primary">
            <MessageSquare size={16} /> Ask the agent
          </ButtonLink>
        </>
      }
    >
      {summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
      ) : (
        <>
          <Stats counts={summary.data} />
          <div className={styles.grid}>
            <div className={styles.column}>
              <StatusBreakdown counts={summary.data} />
              <Attention projects={projects.data} error={projects.error} />
            </div>
            <div className={styles.column}>
              <Inspections projects={projects.data} />
              <RecentChats />
            </div>
          </div>
        </>
      )}
    </Page>
  );
}

function Stats({ counts }: { counts?: ProjectCounts }) {
  if (!counts)
    return (
      <div className={styles.stats}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={128} className={styles.statSkeleton} />
        ))}
      </div>
    );

  const { byStatus } = counts;
  const attention = byStatus.delayed + byStatus['at-risk'] + byStatus['on-hold'];
  const spent = counts.contractUsd ? (counts.spentUsd / counts.contractUsd) * 100 : 0;

  return (
    <div className={styles.stats}>
      <Stat icon={<FolderKanban size={18} />} label="Active projects" value={counts.ongoing}>
        {counts.total} total · {byStatus.completed} completed
      </Stat>
      <Stat
        icon={<TriangleAlert size={18} />}
        label="Need attention"
        value={attention}
        tone="danger"
      >
        {byStatus.delayed} delayed · {byStatus['at-risk']} at risk · {byStatus['on-hold']} on hold
      </Stat>
      <Stat icon={<Wrench size={18} />} label="Open issues" value={counts.openIssues} tone="warn">
        Across active projects
      </Stat>
      <Stat
        icon={<Wallet size={18} />}
        label="Budget spent"
        value={formatUsdCompact(counts.spentUsd)}
      >
        <span className={styles.budgetLine}>
          <ProgressBar value={spent} size="sm" label="Budget spent" />
          <span>
            {Math.round(spent)}% of {formatUsdCompact(counts.contractUsd)}
          </span>
        </span>
      </Stat>
    </div>
  );
}

type StatProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: 'accent' | 'danger' | 'warn';
  children: ReactNode;
};

function Stat({ icon, label, value, tone = 'accent', children }: StatProps) {
  return (
    <div className={styles.stat} data-tone={tone}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statIcon}>{icon}</span>
      </div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statNote}>{children}</div>
    </div>
  );
}

function StatusBreakdown({ counts }: { counts?: ProjectCounts }) {
  return (
    <Card title="Portfolio health">
      {!counts ? (
        <Skeleton height={60} />
      ) : (
        <>
          <div className={styles.stack}>
            {STATUS_ORDER.filter((s) => counts.byStatus[s] > 0).map((s) => (
              <div
                key={s}
                className={styles.segment}
                data-status={s}
                style={{ '--share': counts.byStatus[s] } as CSSProperties}
                title={`${STATUS_LABEL[s]}: ${counts.byStatus[s]}`}
              />
            ))}
          </div>
          <ul className={styles.legend}>
            {STATUS_ORDER.map((s) => (
              <li key={s} data-status={s}>
                <span className={styles.swatch} />
                {STATUS_LABEL[s]}
                <strong>{counts.byStatus[s]}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function Attention({ projects, error }: { projects?: ProjectSummary[]; error: Error | null }) {
  const flagged = projects?.filter((p) => p.status !== 'on-track');
  return (
    <Card
      title="Needs attention"
      action={
        <Link to="/projects?filter=attention" className={styles.more}>
          View all <ChevronRight size={14} />
        </Link>
      }
    >
      {error ? (
        <ErrorState error={error} />
      ) : !flagged ? (
        <div className={styles.rows}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : flagged.length === 0 ? (
        <EmptyState icon={<FolderKanban size={20} />} title="Everything is on track">
          No delayed, at-risk or paused projects right now.
        </EmptyState>
      ) : (
        <ul className={styles.rows}>
          {flagged.map((p) => (
            <li key={p.id}>
              <Link to={`/projects/${p.id}`} className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.rowTitle}>{p.name}</span>
                  <span className={styles.rowMeta}>
                    {p.onHold
                      ? `Paused: ${p.onHold.reason}`
                      : p.currentStages.map((s) => s.label).join(' + ') || 'Not started'}
                  </span>
                </div>
                <div className={styles.rowProgress}>
                  <ProgressBar value={p.percentComplete} status={p.status} size="sm" />
                  <span>{p.percentComplete}%</span>
                </div>
                <div className={styles.rowEnd}>
                  <StatusBadge status={p.status} />
                  <span className={styles.rowMeta}>{scheduleText(p.daysLate)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Inspections({ projects }: { projects?: ProjectSummary[] }) {
  const upcoming = (projects ?? [])
    .flatMap((p) => (p.nextInspection ? [{ project: p, inspection: p.nextInspection }] : []))
    .sort((a, b) => a.inspection.date.localeCompare(b.inspection.date));

  return (
    <Card title="Upcoming inspections">
      {!projects ? (
        <Skeleton height={120} />
      ) : upcoming.length === 0 ? (
        <EmptyState icon={<CalendarClock size={20} />} title="Nothing scheduled" />
      ) : (
        <ul className={styles.inspections}>
          {upcoming.map(({ project, inspection }) => {
            const days = daysUntil(inspection.date);
            const [month, day] = formatDate(inspection.date).split(' ');
            return (
              <li key={project.id}>
                <Link to={`/projects/${project.id}`} className={styles.inspection}>
                  <span className={styles.dateChip}>
                    <span>{month}</span>
                    <strong>{day}</strong>
                  </span>
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>{inspection.name}</span>
                    <span className={styles.rowMeta}>{project.name}</span>
                  </span>
                  <span className={styles.when} data-soon={days <= 3}>
                    {days === 0
                      ? 'Today'
                      : days === 1
                        ? 'Tomorrow'
                        : days < 0
                          ? 'Overdue'
                          : `In ${days} days`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function RecentChats() {
  const conversations = useConversations();
  const recent = conversations.data?.slice(0, 5);

  return (
    <Card
      title="Recent chats"
      action={
        <Link to="/chat" className={styles.more}>
          <Plus size={14} /> New chat
        </Link>
      }
    >
      {!recent ? (
        <Skeleton height={100} />
      ) : recent.length === 0 ? (
        <EmptyState icon={<MessageSquare size={20} />} title="No chats yet">
          Ask the agent about schedules, budgets, inspections or a new design.
        </EmptyState>
      ) : (
        <ul className={styles.chats}>
          {recent.map((c) => (
            <li key={c.id}>
              <Link to={`/chat/${c.id}`} className={styles.chat}>
                <MessageSquare size={16} className={styles.chatIcon} />
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{c.title}</span>
                  <span className={styles.rowMeta}>{formatRelative(c.updatedAt)}</span>
                </span>
                {c.busy && <Spinner size={14} className={styles.busy} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
