import type { UseQueryResult } from '@tanstack/react-query';
import { ChevronDown, Package } from 'lucide-react';
import type { Order, OrderStatus } from '../../api/types.ts';
import { Card } from '../../components/Page/Page.tsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/States/States.tsx';
import {
  daysUntil,
  formatDate,
  formatNumber,
  formatUsd,
  formatUsdCompact,
  STAGE_LABEL,
  titleCase,
} from '../../lib/format.ts';
import styles from './ProjectOrders.module.scss';

const STEPS: OrderStatus[] = ['created', 'sent', 'confirmed', 'fulfilled'];
const isClosed = (o: Order) => o.status === 'fulfilled' || o.status === 'cancelled';

/** Overdue first, then by needed-by date (no date last). */
const byUrgency = (a: Order, b: Order) =>
  Number(b.overdue) - Number(a.overdue) ||
  (a.neededBy ?? '9999').localeCompare(b.neededBy ?? '9999');
const byLatest = (a: Order, b: Order) => b.updatedAt.localeCompare(a.updatedAt);

export function ProjectOrders({ orders }: { orders: UseQueryResult<Order[]> }) {
  if (orders.isError)
    return <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />;
  if (!orders.data)
    return (
      <div className={styles.wrap}>
        <Skeleton height={56} />
        <Skeleton height={320} />
      </div>
    );

  const all = orders.data;
  if (all.length === 0)
    return (
      <EmptyState icon={<Package size={20} />} title="No orders yet">
        Nothing has been ordered for this project.
      </EmptyState>
    );

  const open = all.filter((o) => !isClosed(o)).sort(byUrgency);
  const closed = all.filter(isClosed).sort(byLatest);
  const sum = (list: Order[]) => list.reduce((n, o) => n + o.totalUsd, 0);
  const ordered = sum(all.filter((o) => o.status !== 'cancelled'));
  const overdue = open.filter((o) => o.overdue).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <span>
          <strong>{all.length}</strong> order{all.length === 1 ? '' : 's'}
        </span>
        <span>
          <strong>{formatUsdCompact(ordered)}</strong> ordered
        </span>
        <span>
          <strong>{formatUsdCompact(sum(open))}</strong> still open
        </span>
        {overdue > 0 && (
          <span className={styles.overdueCount}>
            <strong>{overdue}</strong> overdue
          </span>
        )}
      </div>

      {open.length > 0 && (
        <Card title={`Open orders (${open.length})`}>
          <OrderList orders={open} />
        </Card>
      )}
      {closed.length > 0 && (
        <Card title={`Fulfilled & cancelled (${closed.length})`}>
          <OrderList orders={closed} />
        </Card>
      )}
    </div>
  );
}

function OrderList({ orders }: { orders: Order[] }) {
  return (
    <ul className={styles.list}>
      {orders.map((o) => (
        <li key={o.id}>
          <OrderRow order={o} />
        </li>
      ))}
    </ul>
  );
}

function dueText(o: Order): { text: string; late: boolean } {
  const last = o.history[o.history.length - 1];
  if (isClosed(o) && last) return { text: `Closed ${formatDate(last.at)}`, late: false };
  if (!o.neededBy) return { text: 'No date needed', late: false };
  const days = daysUntil(o.neededBy);
  if (o.overdue) return { text: `${-days} day${days === -1 ? '' : 's'} overdue`, late: true };
  return { text: `Needed ${formatDate(o.neededBy)}`, late: false };
}

function OrderRow({ order: o }: { order: Order }) {
  const due = dueText(o);
  return (
    <details className={styles.order} data-status={o.status} data-overdue={o.overdue}>
      <summary className={styles.row}>
        <span className={styles.id}>{o.id}</span>
        <span className={styles.titles}>
          <strong>{o.title}</strong>
          <span>
            {o.vendor?.name ?? o.vendorId}
            {o.stage && ` · ${STAGE_LABEL[o.stage]}`}
          </span>
        </span>
        <span className={styles.status} data-status={o.status}>
          {titleCase(o.status)}
        </span>
        <span className={styles.due} data-late={due.late}>
          {due.text}
        </span>
        <span className={styles.total}>{formatUsd(o.totalUsd)}</span>
        <ChevronDown size={16} className={styles.chevron} aria-hidden />
      </summary>

      <div className={styles.body}>
        <StatusTrack order={o} />

        <table className={styles.items}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.description}>
                <td>{i.description}</td>
                <td>
                  {formatNumber(i.quantity)} {i.unit}
                </td>
                <td>{formatUsd(i.unitPriceUsd)}</td>
                <td>{formatUsd(i.quantity * i.unitPriceUsd)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total</td>
              <td>{formatUsd(o.totalUsd)}</td>
            </tr>
          </tfoot>
        </table>

        {o.notes && <p className={styles.notes}>{o.notes}</p>}
      </div>
    </details>
  );
}

/** The four steps with the date each was reached; a cancelled order ends where it stopped. */
function StatusTrack({ order: o }: { order: Order }) {
  const reached = new Map(o.history.map((h) => [h.status, h.at]));
  const cancelledAt = reached.get('cancelled');
  const steps = cancelledAt
    ? [...STEPS.filter((s) => reached.has(s)), 'cancelled' as const]
    : STEPS;
  const current = steps.indexOf(o.status);

  return (
    <ol className={styles.track} aria-label="Order status">
      {steps.map((s, i) => {
        const at = reached.get(s);
        return (
          <li
            key={s}
            data-state={i < current ? 'done' : i === current ? 'current' : 'todo'}
            data-status={s}
          >
            <i />
            <strong>{titleCase(s)}</strong>
            <span>{at ? formatDate(at, true) : i > current ? '—' : 'Skipped'}</span>
          </li>
        );
      })}
    </ol>
  );
}
