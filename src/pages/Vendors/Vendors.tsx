import { Users } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useVendors } from '../../api/queries.ts';
import { STAGES, VENDOR_TYPES, type StageId, type VendorType } from '../../api/types.ts';
import {
  FilterBar,
  FilterControls,
  FilterSelect,
  FilterTabs,
  SearchBox,
  Toggle,
} from '../../components/FilterBar/FilterBar.tsx';
import { Page } from '../../components/Page/Page.tsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/States/States.tsx';
import { VendorCard } from '../../components/VendorCard/VendorCard.tsx';
import { STAGE_LABEL, VENDOR_TYPE_LABEL } from '../../lib/format.ts';
import styles from './Vendors.module.scss';

type TypeTab = VendorType | 'all';
type StageOption = StageId | 'any';

const isType = (v: string | null): v is VendorType =>
  (VENDOR_TYPES as readonly string[]).includes(v ?? '');
const isStage = (v: string | null): v is StageId => (STAGES as readonly string[]).includes(v ?? '');

const STAGE_OPTIONS: { value: StageOption; label: string }[] = [
  { value: 'any', label: 'Any stage' },
  ...STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] })),
];

export default function Vendors() {
  const [params, setParams] = useSearchParams();
  const rawType = params.get('type');
  const type: TypeTab = isType(rawType) ? rawType : 'all';
  const rawStage = params.get('stage');
  const stage: StageOption = isStage(rawStage) ? rawStage : 'any';
  const activeOnly = params.get('active') === 'true';
  const search = params.get('q') ?? '';

  const vendors = useVendors();

  const update = (changes: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );

  const all = vendors.data;
  const query = search.trim().toLowerCase();
  const visible = all?.filter(
    (v) =>
      (type === 'all' || v.type === type) &&
      (stage === 'any' || v.stages.includes(stage)) &&
      (!activeOnly || v.status === 'active') &&
      [v.name, v.trade, v.contact.name ?? '', v.serviceArea ?? ''].some((field) =>
        field.toLowerCase().includes(query),
      ),
  );

  const countOf = (t: TypeTab) =>
    all ? (t === 'all' ? all.length : all.filter((v) => v.type === t).length) : null;
  const tab = (t: TypeTab, label: string) => {
    const count = countOf(t);
    return {
      value: t,
      label: (
        <>
          {label}
          {count !== null && <span className={styles.tabCount}>{count}</span>}
        </>
      ),
    };
  };

  return (
    <Page
      eyebrow={
        <>
          <Users size={14} /> Network
        </>
      }
      title="Vendors"
      subtitle="The subcontractors, suppliers and consultants you build with."
    >
      <FilterBar>
        <FilterTabs
          label="Filter vendors by type"
          options={[
            tab('all', 'All'),
            ...VENDOR_TYPES.map((t) => tab(t, `${VENDOR_TYPE_LABEL[t]}s`)),
          ]}
          value={type}
          onChange={(t) => update({ type: t === 'all' ? null : t })}
        />
        <FilterControls>
          <FilterSelect
            label="Filter by stage"
            options={STAGE_OPTIONS}
            value={stage}
            onChange={(s) => update({ stage: s === 'any' ? null : s })}
          />
          <SearchBox
            placeholder="Search name, trade, contact"
            value={search}
            onChange={(q) => update({ q: q || null })}
          />
          <Toggle checked={activeOnly} onChange={(on) => update({ active: on ? 'true' : null })}>
            Active only
          </Toggle>
        </FilterControls>
      </FilterBar>

      {vendors.isError ? (
        <ErrorState error={vendors.error} onRetry={() => void vendors.refetch()} />
      ) : !visible ? (
        <div className={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={300} className={styles.skeleton} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<Users size={20} />} title="No vendors match">
          {query ? `Nothing matches "${search}".` : 'No vendors in this view.'}
        </EmptyState>
      ) : (
        <>
          <p className={styles.count}>
            {visible.length} vendor{visible.length === 1 ? '' : 's'}
          </p>
          <div className={styles.grid}>
            {visible.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
