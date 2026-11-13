import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  CircleCheck,
  CircleDot,
  Circle,
  CircleX,
  CirclePause,
  FolderX,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import { useCreateConversation, useProject } from '../../api/queries.ts';
import type { Inspection, Issue, ProjectDetail as Project, Stage } from '../../api/types.ts';
import { Button, ButtonLink } from '../../components/Button/Button.tsx';
import { Card, PageContainer } from '../../components/Page/Page.tsx';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar.tsx';
import { EmptyState, ErrorState, Skeleton, Spinner } from '../../components/States/States.tsx';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge.tsx';
import {
  daysBetween,
  formatDate,
  formatNumber,
  formatUsd,
  formatUsdCompact,
  initials,
  scheduleText,
  titleCase,
} from '../../lib/format.ts';
import styles from './ProjectDetail.module.scss';

export default function ProjectDetail() {
  const { id = '' } = useParams();
  const project = useProject(id);

  if (project.isError) {
    const notFound = project.error instanceof ApiError && project.error.status === 404;
    return (
      <PageContainer>
        <BackLink />
        {notFound ? (
          <EmptyState icon={<FolderX size={20} />} title="Project not found">
            There's no project called "{id}".
          </EmptyState>
        ) : (
          <ErrorState error={project.error} onRetry={() => void project.refetch()} />
        )}
      </PageContainer>
    );
  }

  if (!project.data)
    return (
      <PageContainer>
        <BackLink />
        <Skeleton height={44} className={styles.titleSkeleton} />
        <div className={styles.kpis}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={110} />
          ))}
        </div>
        <Skeleton height={420} />
      </PageContainer>
    );

  return <ProjectView project={project.data} />;
}

function BackLink() {
  return (
    <Link to="/projects" className={styles.back}>
      <ArrowLeft size={15} /> Projects
    </Link>
  );
}

function ProjectView({ project: p }: { project: Project }) {
  const navigate = useNavigate();
  const createChat = useCreateConversation();

  const askAgent = () =>
    createChat.mutate(p.id, { onSuccess: (c) => void navigate(`/chat/${c.id}`) });

  const spent = p.budget.contractUsd ? (p.budget.spentUsd / p.budget.contractUsd) * 100 : 0;
  const delayDays = p.delayCauses
    .filter((i) => i.status === 'open')
    .reduce((n, i) => n + i.impactDays, 0);
  const openIssues = [...p.openIssues].sort((a, b) => b.impactDays - a.impactDays);
  const resolved = p.issues.filter((i) => i.status === 'resolved');

  return (
    <PageContainer>
      <BackLink />

      <header className={styles.header}>
        <div className={styles.headline}>
          <div className={styles.titleRow}>
            <h1>{p.name}</h1>
            <StatusBadge status={p.status} />
          </div>
          <p className={styles.sub}>
            <span>{p.client}</span>
            <span className={styles.sep} />
            <MapPin size={14} />
            <span>{p.address}</span>
          </p>
        </div>
        <Button variant="primary" onClick={askAgent} disabled={createChat.isPending}>
          {createChat.isPending ? <Spinner size={16} /> : <MessageSquare size={16} />}
          Ask the agent about this project
        </Button>
      </header>

      {p.onHold && (
        <div className={styles.hold}>
          <CirclePause size={18} />
          <div>
            <strong>On hold since {formatDate(p.onHold.since, true)}</strong>
            <span>{p.onHold.reason}</span>
          </div>
        </div>
      )}

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Progress</span>
          <span className={styles.kpiValue}>{p.percentComplete}%</span>
          <ProgressBar value={p.percentComplete} status={p.status} size="sm" label="Progress" />
          <span className={styles.kpiNote}>
            {p.doneStages} of {p.totalStages} stages done
          </span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>
            {p.dates.actualFinish ? 'Finished' : 'Forecast finish'}
          </span>
          <span className={styles.kpiValue}>
            {formatDate(p.dates.actualFinish ?? p.dates.forecastFinish, true)}
          </span>
          <span className={styles.kpiNote}>
            Planned {formatDate(p.dates.plannedFinish, true)} ·{' '}
            <strong data-late={p.daysLate > 7} className={styles.late}>
              {scheduleText(p.daysLate)}
            </strong>
          </span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Budget spent</span>
          <span className={styles.kpiValue}>{formatUsdCompact(p.budget.spentUsd)}</span>
          <ProgressBar value={spent} size="sm" label="Budget spent" />
          <span className={styles.kpiNote}>
            {Math.round(spent)}% of {formatUsd(p.budget.contractUsd)}
            {p.budget.approvedChangeOrdersUsd > 0 &&
              ` · +${formatUsdCompact(p.budget.approvedChangeOrdersUsd)} change orders`}
          </span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Open issues</span>
          <span className={styles.kpiValue}>{p.openIssues.length}</span>
          <span className={styles.kpiNote}>
            {delayDays > 0 ? `${delayDays} days of delay still open` : 'None delaying the schedule'}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.column}>
          <Card title="Schedule">
            <Schedule stages={p.stages} />
          </Card>

          <Card title={`Open issues (${openIssues.length})`}>
            {openIssues.length === 0 ? (
              <EmptyState icon={<CircleCheck size={20} />} title="No open issues" />
            ) : (
              <ul className={styles.issues}>
                {openIssues.map((issue) => (
                  <IssueItem key={issue.id} issue={issue} stages={p.stages} />
                ))}
              </ul>
            )}
            {resolved.length > 0 && (
              <details className={styles.resolved}>
                <summary>Resolved issues ({resolved.length})</summary>
                <ul className={styles.issues}>
                  {resolved.map((issue) => (
                    <IssueItem key={issue.id} issue={issue} stages={p.stages} />
                  ))}
                </ul>
              </details>
            )}
          </Card>
        </div>

        <div className={styles.column}>
          <Card title="Team">
            <ul className={styles.team}>
              {[
                ['Project manager', p.team.projectManager],
                ['Superintendent', p.team.superintendent],
                ['Builder', p.team.builder],
              ].map(([role, name]) => (
                <li key={role}>
                  <span className={styles.avatar}>{initials(name ?? '')}</span>
                  <span>
                    <strong>{name}</strong>
                    <span>{role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Site & scope">
            <p className={styles.scope}>{p.scope.description}</p>
            <dl className={styles.facts}>
              <div>
                <dt>Homes</dt>
                <dd>{p.scope.homes}</dd>
              </div>
              <div>
                <dt>Heated sq ft</dt>
                <dd>{formatNumber(p.scope.heatedSqft)}</dd>
              </div>
              <div>
                <dt>Lot sq ft</dt>
                <dd>{formatNumber(p.site.lotSqft)}</dd>
              </div>
              <div>
                <dt>Zoning</dt>
                <dd>{p.site.zoning}</dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd>{formatDate(p.dates.start, true)}</dd>
              </div>
              <div>
                <dt>Contract</dt>
                <dd>{formatUsdCompact(p.budget.contractUsd)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Inspections">
            {p.inspections.length === 0 ? (
              <EmptyState icon={<CalendarClock size={20} />} title="No inspections yet" />
            ) : (
              <ul className={styles.inspections}>
                {p.inspections.map((i) => (
                  <InspectionItem key={`${i.name}-${i.date}`} inspection={i} />
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent updates">
            <ol className={styles.updates}>
              {p.updates.map((u) => (
                <li key={`${u.date}-${u.author}`}>
                  <span className={styles.avatar}>{initials(u.author)}</span>
                  <div>
                    <div className={styles.updateMeta}>
                      <strong>{u.author}</strong>
                      <span>{formatDate(u.date)}</span>
                    </div>
                    <p>{u.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <ButtonLink to="/chat" variant="ghost" className={styles.allChats}>
            <MessageSquare size={15} /> Open all chats
          </ButtonLink>
        </div>
      </div>
    </PageContainer>
  );
}

const STAGE_ICON = {
  done: <CircleCheck size={16} />,
  'in-progress': <CircleDot size={16} />,
  'not-started': <Circle size={16} />,
};

function Schedule({ stages }: { stages: Stage[] }) {
  const ends = stages.flatMap((s) => [s.plannedEnd, s.actualEnd, s.forecastEnd]);
  const starts = stages.flatMap((s) => [s.plannedStart, s.actualStart]);
  const dates = [...starts, ...ends].filter((d): d is string => Boolean(d)).sort();
  const first = dates[0] ?? '';
  const last = dates[dates.length - 1] ?? '';
  const span = Math.max(1, daysBetween(first, last));
  const at = (date: string) => `${(daysBetween(first, date) / span) * 100}%`;
  const today = new Date().toISOString().slice(0, 10);
  const showToday = today >= first && today <= last;

  return (
    <div className={styles.schedule}>
      <div className={styles.scheduleAxis}>
        <span>{formatDate(first, true)}</span>
        <span>{formatDate(last, true)}</span>
      </div>
      {stages.map((s) => {
        const start = s.actualStart ?? s.plannedStart;
        const end = s.actualEnd ?? s.forecastEnd ?? s.plannedEnd;
        const lateBy = daysBetween(s.plannedEnd, end);
        const bar = (from: string, to: string) =>
          ({ '--from': at(from), '--to': at(to) }) as CSSProperties;

        return (
          <div key={s.stage} className={styles.stage} data-state={s.status}>
            <div className={styles.stageLabel}>
              <span className={styles.stageIcon}>{STAGE_ICON[s.status]}</span>
              <div>
                <strong>{s.label}</strong>
                <span>
                  {s.status === 'in-progress'
                    ? `${s.percent}% · due ${formatDate(end)}`
                    : s.status === 'done'
                      ? `Done ${formatDate(end)}`
                      : `${formatDate(s.plannedStart)} – ${formatDate(s.plannedEnd)}`}
                </span>
              </div>
              {lateBy > 0 && s.status !== 'not-started' && (
                <span className={styles.stageLate}>+{lateBy}d</span>
              )}
            </div>
            <div className={styles.track}>
              {showToday && <span className={styles.today} style={{ left: at(today) }} />}
              <span
                className={styles.planned}
                style={bar(s.plannedStart, s.plannedEnd)}
                title={`Planned ${formatDate(s.plannedStart)} – ${formatDate(s.plannedEnd)}`}
              />
              {s.status !== 'not-started' && (
                <span
                  className={styles.actual}
                  data-late={lateBy > 0}
                  style={bar(start, end)}
                  title={`${s.status === 'done' ? 'Actual' : 'Forecast'} ${formatDate(start)} – ${formatDate(end)}`}
                >
                  {s.status === 'in-progress' && (
                    <span className={styles.actualProgress} style={{ width: `${s.percent}%` }} />
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div className={styles.scheduleLegend}>
        <span>
          <i className={styles.legendPlanned} /> Planned
        </span>
        <span>
          <i className={styles.legendActual} /> Actual / forecast
        </span>
        <span>
          <i className={styles.legendLate} /> Late
        </span>
        {showToday && (
          <span>
            <i className={styles.legendToday} /> Today
          </span>
        )}
      </div>
    </div>
  );
}

function IssueItem({ issue, stages }: { issue: Issue; stages: Stage[] }) {
  const stage = stages.find((s) => s.stage === issue.stage)?.label ?? titleCase(issue.stage);
  return (
    <li className={styles.issue} data-status={issue.status}>
      <div className={styles.issueTop}>
        <span className={styles.issueId}>{issue.id}</span>
        <h3>{issue.title}</h3>
        {issue.impactDays > 0 && <span className={styles.impact}>+{issue.impactDays} days</span>}
      </div>
      <p>{issue.description}</p>
      {issue.nextStep && (
        <p className={styles.nextStep}>
          <strong>Next step:</strong> {issue.nextStep}
        </p>
      )}
      <div className={styles.issueMeta}>
        <span className={styles.tag}>{titleCase(issue.category)}</span>
        <span>{stage}</span>
        <span>Owner: {issue.owner}</span>
        <span>
          {issue.status === 'resolved' && issue.resolvedOn
            ? `Resolved ${formatDate(issue.resolvedOn)}`
            : issue.expectedResolution
              ? `Expected ${formatDate(issue.expectedResolution)}`
              : `Raised ${formatDate(issue.raisedOn)}`}
        </span>
      </div>
    </li>
  );
}

const RESULT_ICON = {
  passed: <CircleCheck size={16} />,
  failed: <CircleX size={16} />,
  scheduled: <CalendarCheck size={16} />,
};

function InspectionItem({ inspection: i }: { inspection: Inspection }) {
  return (
    <li className={styles.inspection} data-result={i.result}>
      <span className={styles.resultIcon}>{RESULT_ICON[i.result]}</span>
      <div>
        <strong>{i.name}</strong>
        <span>
          {formatDate(i.date, true)} · {titleCase(i.result)}
          {i.notes && ` · ${i.notes}`}
        </span>
      </div>
    </li>
  );
}
