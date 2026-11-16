import type { UseQueryResult } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  ExternalLink,
  FilePenLine,
  FileText,
  MessageSquare,
  PencilRuler,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { apiUrl } from '../../api/client.ts';
import { useCreateConversation } from '../../api/queries.ts';
import type {
  ChangeOrder,
  ChangeOrderKind,
  ChangeOrderStatus,
  ChangeOrderSummary,
  ProjectDetail,
} from '../../api/types.ts';
import { CHANGE_ORDER_STATUSES } from '../../api/types.ts';
import { useStartChat } from '../../api/useStartChat.ts';
import { Button } from '../../components/Button/Button.tsx';
import { FilterTabs } from '../../components/FilterBar/FilterBar.tsx';
import { Card } from '../../components/Page/Page.tsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/States/States.tsx';
import {
  CHANGE_ORDER_KIND_LABEL,
  CHANGE_ORDER_STATUS_LABEL,
  formatDate,
  formatSignedDays,
  formatSignedUsd,
  formatUsd,
} from '../../lib/format.ts';
import styles from './ProjectChangeOrders.module.scss';

type Data = { changeOrders: ChangeOrder[]; summary: ChangeOrderSummary };
type StatusFilter = 'all' | ChangeOrderStatus;
type KindFilter = 'all' | ChangeOrderKind;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Pending first (oldest request first: it has waited longest), then the rest newest first. */
function byStatus(a: ChangeOrder, b: ChangeOrder) {
  if ((a.status === 'pending') !== (b.status === 'pending')) return a.status === 'pending' ? -1 : 1;
  return a.status === 'pending'
    ? a.createdAt.localeCompare(b.createdAt)
    : b.createdAt.localeCompare(a.createdAt);
}

export function ProjectChangeOrders({
  changeOrders,
  project: p,
}: {
  changeOrders: UseQueryResult<Data>;
  project: ProjectDetail;
}) {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [kind, setKind] = useState<KindFilter>('all');
  const chat = useStartChat();
  const createChat = useCreateConversation();
  const navigate = useNavigate();
  const closed = p.status === 'completed';

  if (changeOrders.isError)
    return <ErrorState error={changeOrders.error} onRetry={() => void changeOrders.refetch()} />;
  if (!changeOrders.data)
    return (
      <div className={styles.wrap}>
        <div className={styles.totals}>
          <Skeleton height={150} />
          <Skeleton height={150} />
        </div>
        <Skeleton height={320} />
      </div>
    );

  const { changeOrders: all, summary } = changeOrders.data;
  const askButton = !closed && (
    <Button
      onClick={() => createChat.mutate(p.id, { onSuccess: (c) => void navigate(`/chat/${c.id}`) })}
      disabled={createChat.isPending}
    >
      <MessageSquare size={15} /> Ask the agent for a change
    </Button>
  );

  if (all.length === 0)
    return (
      <div className={styles.wrap}>
        <EmptyState icon={<FilePenLine size={20} />} title="No change orders yet">
          When the client asks for something different from the contract, tell the agent: it prices
          the change, says whether the design needs revising, and writes the change order.
        </EmptyState>
        {askButton && <div className={styles.emptyAction}>{askButton}</div>}
      </div>
    );

  const ofKind = all.filter((c) => kind === 'all' || c.kind === kind);
  const shown = ofKind.filter((c) => status === 'all' || c.status === status).sort(byStatus);
  const count = (s: ChangeOrderStatus) => ofKind.filter((c) => c.status === s).length;
  const decide = (co: ChangeOrder, verb: 'Approve' | 'Reject') =>
    chat.start(`${verb} change order ${co.id}`, p.id);

  return (
    <div className={styles.wrap}>
      <div className={styles.totals}>
        <Contract project={p} summary={summary} />
        <StatusTotals summary={summary} />
      </div>

      <Card
        title="Change orders"
        action={
          <div className={styles.filters}>
            <FilterTabs<KindFilter>
              label="Kind"
              value={kind}
              onChange={setKind}
              options={[
                { value: 'all', label: 'All' },
                { value: 'small', label: 'Small' },
                { value: 'design', label: 'Design' },
              ]}
            />
            <FilterTabs<StatusFilter>
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'Any status' },
                ...CHANGE_ORDER_STATUSES.map((s) => ({
                  value: s,
                  label: (
                    <>
                      {CHANGE_ORDER_STATUS_LABEL[s]}
                      <span className={styles.count}>{count(s)}</span>
                    </>
                  ),
                })),
              ]}
            />
          </div>
        }
      >
        {shown.length === 0 ? (
          <p className={styles.none}>Nothing matches these filters.</p>
        ) : (
          <ul className={styles.list}>
            {shown.map((co) => (
              <li key={co.id}>
                <ChangeOrderRow
                  changeOrder={co}
                  onDecide={closed ? undefined : (verb) => decide(co, verb)}
                  busy={chat.isPending}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {askButton && <div className={styles.footer}>{askButton}</div>}
    </div>
  );
}

function Contract({
  project: p,
  summary,
}: {
  project: ProjectDetail;
  summary: ChangeOrderSummary;
}) {
  const { contractUsd, approvedChangeOrdersUsd } = p.budget;
  const untracked = Math.round(approvedChangeOrdersUsd - summary.approved.usd);
  return (
    <section className={styles.total}>
      <header>
        <h3>Contract</h3>
        <p>The original contract plus approved change orders</p>
      </header>
      <dl className={styles.contract}>
        <div>
          <dt>Original</dt>
          <dd>{formatUsd(contractUsd)}</dd>
        </div>
        <div>
          <dt>Approved changes</dt>
          <dd data-sign={Math.sign(approvedChangeOrdersUsd)}>
            {formatSignedUsd(approvedChangeOrdersUsd)}
          </dd>
        </div>
        <div className={styles.current}>
          <dt>Current contract</dt>
          <dd>{formatUsd(contractUsd + approvedChangeOrdersUsd)}</dd>
        </div>
      </dl>
      <p className={styles.schedule}>
        Forecast finish <strong>{formatDate(p.dates.forecastFinish, true)}</strong>
        {summary.approved.days !== 0 &&
          ` · ${formatSignedDays(summary.approved.days)} from approved change orders`}
        {untracked !== 0 &&
          ` · approved changes include ${formatSignedUsd(untracked)} recorded before these change orders`}
      </p>
    </section>
  );
}

function StatusTotals({ summary }: { summary: ChangeOrderSummary }) {
  return (
    <section className={styles.total}>
      <header>
        <h3>By status</h3>
        <p>What each status adds to the contract and the schedule</p>
      </header>
      <dl className={styles.figures}>
        {CHANGE_ORDER_STATUSES.map((s) => (
          <div key={s} data-status={s} data-any={summary[s].count > 0}>
            <dt>
              <i />
              {CHANGE_ORDER_STATUS_LABEL[s]}
            </dt>
            <dd>{formatSignedUsd(summary[s].usd)}</dd>
            <dd className={styles.sub}>
              {plural(summary[s].count, 'change')} · {formatSignedDays(summary[s].days)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ChangeOrderRow({
  changeOrder: co,
  onDecide,
  busy,
}: {
  changeOrder: ChangeOrder;
  onDecide?: (verb: 'Approve' | 'Reject') => void;
  busy: boolean;
}) {
  const Icon = co.kind === 'design' ? PencilRuler : Wrench;
  const linesTotal = co.lines.reduce((n, l) => n + l.newUsd - l.oldUsd, 0);
  return (
    <details className={styles.item} data-status={co.status} open={co.status === 'pending'}>
      <summary className={styles.row}>
        <span className={styles.what}>
          <span
            className={styles.icon}
            data-kind={co.kind}
            title={CHANGE_ORDER_KIND_LABEL[co.kind]}
          >
            <Icon size={14} />
          </span>
          <span className={styles.titles}>
            <strong>{co.title}</strong>
            <span>
              <span className={styles.id}>{co.id}</span> · {CHANGE_ORDER_KIND_LABEL[co.kind]} ·
              requested {formatDate(co.requestedOn, true)}
              {co.decidedOn &&
                ` · ${co.status === 'approved' ? 'approved' : 'rejected'} ${formatDate(co.decidedOn, true)}`}
            </span>
          </span>
        </span>
        <span className={styles.status} data-status={co.status}>
          {CHANGE_ORDER_STATUS_LABEL[co.status]}
        </span>
        <span className={styles.days} data-sign={Math.sign(co.daysAdded)}>
          {formatSignedDays(co.daysAdded)}
        </span>
        <span className={styles.amount}>{formatSignedUsd(co.amountUsd)}</span>
        <ChevronDown size={16} className={styles.chevron} aria-hidden />
      </summary>

      <div className={styles.body}>
        {co.reason && (
          <p className={styles.reason}>
            <strong>Why:</strong> {co.reason}
          </p>
        )}

        {co.revision && co.revision.changes.length > 0 && (
          <div>
            <h4 className={styles.subhead}>Design changes</h4>
            <ul className={styles.changes}>
              {co.revision.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {co.lines.length > 0 && (
          <table className={styles.lines}>
            <thead>
              <tr>
                <th>{co.kind === 'design' ? 'Affected trade' : 'Trade / item'}</th>
                <th>Before</th>
                <th>After</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {co.lines.map((l) => (
                <tr key={`${l.trade}-${l.item ?? ''}`}>
                  <td>
                    <strong>{l.trade}</strong>
                    {l.item && <span> · {l.item}</span>}
                    {l.note && <em>{l.note}</em>}
                  </td>
                  <td>{formatUsd(l.oldUsd)}</td>
                  <td>{formatUsd(l.newUsd)}</td>
                  <td>{formatSignedUsd(l.newUsd - l.oldUsd)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  {Math.round(linesTotal) === Math.round(co.amountUsd)
                    ? 'Total'
                    : `Lines total ${formatSignedUsd(linesTotal)} · change order amount`}
                </td>
                <td>{formatSignedUsd(co.amountUsd)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {co.notes && <p className={styles.notes}>{co.notes}</p>}

        <div className={styles.actions}>
          <div className={styles.links}>
            {co.pdfUrl && (
              <a href={apiUrl(co.pdfUrl)} target="_blank" rel="noopener noreferrer">
                <FileText size={14} /> Change order PDF <ExternalLink size={12} />
              </a>
            )}
            {co.revision?.planUrl && (
              <a href={apiUrl(co.revision.planUrl)} target="_blank" rel="noopener noreferrer">
                <PencilRuler size={14} /> Revised plan <ExternalLink size={12} />
              </a>
            )}
            {co.revision?.originalPlanUrl && (
              <a
                href={apiUrl(co.revision.originalPlanUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PencilRuler size={14} /> Original plan <ExternalLink size={12} />
              </a>
            )}
          </div>
          {co.status === 'pending' && onDecide && (
            <div className={styles.decide}>
              <Button variant="danger" onClick={() => onDecide('Reject')} disabled={busy}>
                <X size={15} /> Reject
              </Button>
              <Button variant="primary" onClick={() => onDecide('Approve')} disabled={busy}>
                <Check size={15} /> Approve
              </Button>
            </div>
          )}
        </div>
        {co.status === 'pending' && onDecide && (
          <p className={styles.hint}>
            Approve or Reject opens a chat with the agent, which asks you to confirm.
          </p>
        )}
      </div>
    </details>
  );
}
