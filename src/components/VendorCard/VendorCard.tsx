import {
  BadgeCheck,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react';
import type { Vendor } from '../../api/types.ts';
import {
  daysUntil,
  formatDate,
  initials,
  STAGE_LABEL,
  VENDOR_TYPE_LABEL,
} from '../../lib/format.ts';
import styles from './VendorCard.module.scss';

const EXPIRY_WARNING_DAYS = 60;

type Insurance = { text: string; tone: 'ok' | 'soon' | 'expired' | 'none' };

function insurance(expires: string | null): Insurance {
  if (!expires) return { text: 'No insurance on file', tone: 'none' };
  const days = daysUntil(expires);
  if (days < 0) return { text: `Insurance expired ${formatDate(expires, true)}`, tone: 'expired' };
  if (days <= EXPIRY_WARNING_DAYS)
    return { text: `Insurance expires in ${days} day${days === 1 ? '' : 's'}`, tone: 'soon' };
  return { text: `Insured until ${formatDate(expires, true)}`, tone: 'ok' };
}

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const { contact } = vendor;
  const cover = insurance(vendor.insuranceExpires);
  const InsuranceIcon = cover.tone === 'ok' ? ShieldCheck : ShieldAlert;

  return (
    <article className={styles.card} data-status={vendor.status}>
      <header className={styles.top}>
        <span className={styles.avatar} aria-hidden>
          {initials(vendor.name)}
        </span>
        <div className={styles.titles}>
          <h3 title={vendor.name}>{vendor.name}</h3>
          <span className={styles.trade}>{vendor.trade}</span>
        </div>
        <div className={styles.badges}>
          <span className={styles.type} data-type={vendor.type}>
            {VENDOR_TYPE_LABEL[vendor.type]}
          </span>
          {vendor.status === 'inactive' && <span className={styles.inactive}>Inactive</span>}
        </div>
      </header>

      <div className={styles.summary}>
        {vendor.rating !== null && <Rating value={vendor.rating} />}
        {vendor.serviceArea && (
          <span className={styles.area}>
            <MapPin size={13} /> {vendor.serviceArea}
          </span>
        )}
      </div>

      <ul className={styles.stages} aria-label="Stages they work on">
        {vendor.stages.map((s) => (
          <li key={s}>{STAGE_LABEL[s]}</li>
        ))}
      </ul>

      {(contact.name || contact.phone || contact.email) && (
        <ul className={styles.contact}>
          {contact.name && (
            <li>
              <User size={14} /> {contact.name}
            </li>
          )}
          {contact.phone && (
            <li>
              <Phone size={14} />
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}>{contact.phone}</a>
            </li>
          )}
          {contact.email && (
            <li>
              <Mail size={14} />
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          )}
        </ul>
      )}

      {vendor.notes && <p className={styles.notes}>{vendor.notes}</p>}

      <footer className={styles.footer}>
        <span className={styles.insurance} data-tone={cover.tone}>
          <InsuranceIcon size={14} /> {cover.text}
        </span>
        {vendor.licenseNumber && (
          <span className={styles.license} title="License number">
            <BadgeCheck size={14} /> {vendor.licenseNumber}
          </span>
        )}
      </footer>
    </article>
  );
}

function Rating({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className={styles.rating} aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} data-filled={n <= filled} aria-hidden />
      ))}
      <span>{value.toFixed(1)}</span>
    </span>
  );
}
