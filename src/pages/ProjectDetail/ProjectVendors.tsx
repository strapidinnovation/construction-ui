import { Circle, CircleCheck, CircleDot, Mail, Phone, Star, User, Users } from 'lucide-react';
import { Link } from 'react-router';
import type { AssignmentStatus, ProjectVendor } from '../../api/types.ts';
import { EmptyState } from '../../components/States/States.tsx';
import {
  formatDate,
  formatUsd,
  formatUsdCompact,
  initials,
  VENDOR_TYPE_LABEL,
} from '../../lib/format.ts';
import styles from './ProjectVendors.module.scss';

const GROUPS: { status: AssignmentStatus; title: string }[] = [
  { status: 'working', title: 'Working now' },
  { status: 'on-hold', title: 'Paused with the project' },
  { status: 'upcoming', title: 'Up next' },
  { status: 'done', title: 'Finished' },
];

const STAGE_ICON = {
  done: <CircleCheck size={13} />,
  'in-progress': <CircleDot size={13} />,
  'not-started': <Circle size={13} />,
};

export function ProjectVendors({ vendors }: { vendors: ProjectVendor[] }) {
  if (vendors.length === 0)
    return (
      <EmptyState icon={<Users size={20} />} title="No vendors assigned">
        Nobody has been assigned to this project yet.
      </EmptyState>
    );

  const contracted = vendors.reduce((sum, v) => sum + (v.contractUsd ?? 0), 0);
  const groups = GROUPS.map((g) => ({
    ...g,
    vendors: vendors
      .filter((v) => v.status === g.status)
      .sort((a, b) => a.start.localeCompare(b.start)),
  })).filter((g) => g.vendors.length > 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <span>
          <strong>{vendors.length}</strong> vendor{vendors.length === 1 ? '' : 's'}
        </span>
        {contracted > 0 && (
          <span>
            <strong>{formatUsdCompact(contracted)}</strong> contracted
          </span>
        )}
        {groups.map((g) => (
          <span key={g.status} className={styles.count} data-status={g.status}>
            <i /> {g.vendors.length} {g.title.toLowerCase()}
          </span>
        ))}
      </div>

      {groups.map((g) => (
        <section key={g.status} className={styles.group}>
          <h2>
            {g.title} <span>{g.vendors.length}</span>
          </h2>
          <ul className={styles.list}>
            {g.vendors.map((v) => (
              <VendorItem key={v.vendorId} item={v} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function VendorItem({ item }: { item: ProjectVendor }) {
  const v = item.vendor;
  const name = v?.name ?? item.vendorId;
  const contact = v?.contact;

  return (
    <li className={styles.item} data-status={item.status}>
      <header className={styles.top}>
        <span className={styles.avatar} aria-hidden>
          {initials(name)}
        </span>
        <div className={styles.titles}>
          <h3 title={name}>
            {v ? <Link to={`/vendors?q=${encodeURIComponent(v.name)}`}>{v.name}</Link> : name}
          </h3>
          <span>{v ? v.trade : 'No longer in the vendor list'}</span>
        </div>
        <div className={styles.badges}>
          {v && (
            <span className={styles.type} data-type={v.type}>
              {VENDOR_TYPE_LABEL[v.type]}
            </span>
          )}
          {v?.status === 'inactive' && <span className={styles.inactive}>Inactive</span>}
        </div>
      </header>

      <p className={styles.scope}>{item.scope}</p>

      <ul className={styles.stages} aria-label="Stages on this project">
        {item.stages.map((s) => (
          <li key={s.stage} data-state={s.status ?? 'not-started'}>
            {STAGE_ICON[s.status ?? 'not-started']} {s.label}
          </li>
        ))}
      </ul>

      <dl className={styles.facts}>
        <div>
          <dt>{item.status === 'done' ? 'Worked' : 'Dates'}</dt>
          <dd>
            {formatDate(item.start)} – {formatDate(item.end, true)}
          </dd>
        </div>
        <div>
          <dt>Contract</dt>
          <dd>{item.contractUsd === null ? '—' : formatUsd(item.contractUsd)}</dd>
        </div>
        {v?.rating != null && (
          <div>
            <dt>Rating</dt>
            <dd className={styles.rating}>
              <Star size={13} aria-hidden /> {v.rating.toFixed(1)}
            </dd>
          </div>
        )}
      </dl>

      {contact && (contact.name || contact.phone || contact.email) && (
        <ul className={styles.contact}>
          {contact.name && (
            <li>
              <User size={13} /> {contact.name}
            </li>
          )}
          {contact.phone && (
            <li>
              <Phone size={13} />
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}>{contact.phone}</a>
            </li>
          )}
          {contact.email && (
            <li>
              <Mail size={13} />
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
