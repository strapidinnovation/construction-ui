import { ChevronDown, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx.ts';
import styles from './FilterBar.module.scss';

/** Tabs on the left, the remaining controls on the right. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function FilterControls({ children }: { children: ReactNode }) {
  return <div className={styles.controls}>{children}</div>;
}

type Option<T extends string> = { value: T; label: ReactNode };

export function FilterTabs<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={cx(styles.tab, o.value === value && styles.active)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className={styles.search}>
      <Search size={16} />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </label>
  );
}

export function FilterSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <label className={cx(styles.select, value !== options[0]?.value && styles.selectActive)}>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden />
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className={styles.switch}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.track} aria-hidden />
      {children}
    </label>
  );
}
