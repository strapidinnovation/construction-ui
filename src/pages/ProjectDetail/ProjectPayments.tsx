import type { UseQueryResult } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { useState } from 'react';
import type {
  Payment,
  PaymentKind,
  PaymentState,
  PaymentSummary,
  PaymentTotals,
} from '../../api/types.ts';
import { FilterTabs } from '../../components/FilterBar/FilterBar.tsx';
import { Card } from '../../components/Page/Page.tsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/States/States.tsx';
import { formatDate, formatUsd, formatUsdCompact, STAGE_LABEL } from '../../lib/format.ts';
import styles from './ProjectPayments.module.scss';

type Data = { payments: Payment[]; summary: PaymentSummary };
type KindFilter = 'all' | PaymentKind;
type StateFilter = 'all' | PaymentState;

const STATES: PaymentState[] = ['overdue', 'pending', 'completed'];
const STATE_LABEL: Record<PaymentState, string> = {
  pending: 'Pending',
  overdue: 'Overdue',
  completed: 'Completed',
};

/** Overdue first (most overdue first), then pending (soonest first), then completed (latest first). */
function byUrgency(a: Payment, b: Payment) {
  if (a.state !== b.state) return STATES.indexOf(a.state) - STATES.indexOf(b.state);
  return a.state === 'completed'
    ? (b.actualDate ?? '').localeCompare(a.actualDate ?? '')
    : a.proposedDate.localeCompare(b.proposedDate);
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function ProjectPayments({
  payments,
  client,
}: {
  payments: UseQueryResult<Data>;
  client: string;
}) {
  const [kind, setKind] = useState<KindFilter>('all');
  const [state, setState] = useState<StateFilter>('all');

  if (payments.isError)
    return <ErrorState error={payments.error} onRetry={() => void payments.refetch()} />;
  if (!payments.data)
    return (
      <div className={styles.wrap}>
        <div className={styles.totals}>
          <Skeleton height={168} />
          <Skeleton height={168} />
        </div>
        <Skeleton height={320} />
      </div>
    );

  const { payments: all, summary } = payments.data;
  if (all.length === 0)
    return (
      <EmptyState icon={<Wallet size={20} />} title="No payments yet">
        No client collections or vendor payments have been recorded for this project.
      </EmptyState>
    );

  const ofKind = all.filter((p) => kind === 'all' || p.kind === kind);
  const shown = ofKind.filter((p) => state === 'all' || p.state === state).sort(byUrgency);
  const count = (s: PaymentState) => ofKind.filter((p) => p.state === s).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.totals}>
        <Totals
          kind="collection"
          title="Client collections"
          subtitle={`From ${client}`}
          totals={summary.collections}
          doneLabel="Collected"
        />
        <Totals
          kind="vendor-payment"
          title="Vendor payments"
          subtitle="To subcontractors, suppliers and consultants"
          totals={summary.vendorPayments}
          doneLabel="Paid"
        />
      </div>

      <div className={styles.net}>
        <span>Net cash so far</span>
        <strong data-negative={summary.netCashUsd < 0}>{formatUsd(summary.netCashUsd)}</strong>
        <span>
          {formatUsdCompact(summary.collections.completed.usd)} collected −{' '}
          {formatUsdCompact(summary.vendorPayments.completed.usd)} paid to vendors
        </span>
      </div>

      <Card
        title="Payments"
        action={
          <div className={styles.filters}>
            <FilterTabs<KindFilter>
              label="Kind"
              value={kind}
              onChange={setKind}
              options={[
                { value: 'all', label: 'All' },
                { value: 'collection', label: 'Collections' },
                { value: 'vendor-payment', label: 'Vendor payments' },
              ]}
            />
            <FilterTabs<StateFilter>
              label="State"
              value={state}
              onChange={setState}
              options={[
                { value: 'all', label: 'Any state' },
                ...STATES.map((s) => ({
                  value: s,
                  label: (
                    <>
                      {STATE_LABEL[s]}
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
          <div className={styles.table} role="table" aria-label="Payments">
            <div className={styles.head} role="row">
              <span role="columnheader">Payment</span>
              <span role="columnheader">State</span>
              <span role="columnheader">Proposed</span>
              <span role="columnheader">Actual</span>
              <span role="columnheader">Amount</span>
            </div>
            {shown.map((p) => (
              <PaymentRow key={p.id} payment={p} client={client} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Totals({
  kind,
  title,
  subtitle,
  totals,
  doneLabel,
}: {
  kind: PaymentKind;
  title: string;
  subtitle: string;
  totals: PaymentTotals;
  doneLabel: string;
}) {
  const whole = STATES.reduce((n, s) => n + totals[s].usd, 0);
  const Icon = kind === 'collection' ? ArrowDownLeft : ArrowUpRight;
  const order: PaymentState[] = ['completed', 'overdue', 'pending'];
  return (
    <section className={styles.total} data-kind={kind}>
      <header>
        <span className={styles.icon}>
          <Icon size={16} />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <strong className={styles.whole}>{formatUsdCompact(whole)}</strong>
      </header>

      <div className={styles.bar} aria-hidden>
        {order.map(
          (s) =>
            totals[s].usd > 0 && <i key={s} data-state={s} style={{ flexGrow: totals[s].usd }} />,
        )}
      </div>

      <dl className={styles.figures}>
        {order.map((s) => (
          <div key={s} data-state={s} data-any={totals[s].count > 0}>
            <dt>
              <i />
              {s === 'completed' ? doneLabel : STATE_LABEL[s]}
            </dt>
            <dd>{formatUsd(totals[s].usd)}</dd>
            <dd className={styles.sub}>{plural(totals[s].count, 'payment')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function actualText(p: Payment): { text: string; late?: 'overdue' | 'paid-late' } {
  if (p.state === 'overdue')
    return { text: `${plural(p.daysLate, 'day')} overdue`, late: 'overdue' };
  if (!p.actualDate) return { text: '—' };
  const when = formatDate(p.actualDate, true);
  if (p.daysLate > 0) return { text: `${when} · ${p.daysLate}d late`, late: 'paid-late' };
  return { text: when };
}

function PaymentRow({ payment: p, client }: { payment: Payment; client: string }) {
  const actual = actualText(p);
  const Icon = p.kind === 'collection' ? ArrowDownLeft : ArrowUpRight;
  const who = p.kind === 'collection' ? `From ${client}` : `To ${p.vendor?.name ?? p.vendorId}`;
  return (
    <div className={styles.row} role="row" data-state={p.state} data-kind={p.kind}>
      <span className={styles.what} role="cell">
        <span
          className={styles.icon}
          title={p.kind === 'collection' ? 'Client collection' : 'Vendor payment'}
        >
          <Icon size={14} />
        </span>
        <span className={styles.titles}>
          <strong>{p.title}</strong>
          <span>
            <span className={styles.id}>{p.id}</span> · {who}
            {p.stage && ` · ${STAGE_LABEL[p.stage]}`}
            {p.orderId && ` · ${p.orderId}`}
          </span>
          {p.notes && (
            <span className={styles.notes} title={p.notes}>
              {p.notes}
            </span>
          )}
        </span>
      </span>
      <span role="cell">
        <span className={styles.state} data-state={p.state}>
          {STATE_LABEL[p.state]}
        </span>
      </span>
      <span className={styles.date} role="cell" data-label="Proposed">
        {formatDate(p.proposedDate, true)}
      </span>
      <span
        className={styles.date}
        role="cell"
        data-label={p.actualDate ? 'Paid' : undefined}
        data-late={actual.late}
        data-empty={p.state === 'pending'}
      >
        {actual.text}
      </span>
      <span className={styles.amount} role="cell">
        {p.kind === 'collection' ? '+' : '−'}
        {formatUsd(p.amountUsd)}
      </span>
    </div>
  );
}
