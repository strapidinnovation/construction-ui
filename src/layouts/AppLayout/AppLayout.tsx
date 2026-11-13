import { FolderKanban, LayoutDashboard, MessageSquare } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { useHealth } from '../../api/queries.ts';
import { RuhMark } from '../../components/RuhMark/RuhMark.tsx';
import { cx } from '../../lib/cx.ts';
import styles from './AppLayout.module.scss';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: false },
  { to: '/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/chat', label: 'Chat', icon: MessageSquare, end: false },
];

export default function AppLayout() {
  const health = useHealth();
  const online = health.isSuccess && health.data.ok;

  return (
    <div className={styles.shell}>
      <aside className={styles.rail}>
        <NavLink to="/" end className={styles.brand} aria-label="Ruh home" title="Home">
          <RuhMark size={40} />
          <span>RUH</span>
        </NavLink>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cx(styles.link, isActive && styles.active)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div
            className={cx(styles.health, online ? styles.online : styles.offline)}
            title={online ? 'Agent API is online' : 'Agent API is unreachable'}
          >
            <span className={styles.pulse} />
            <span>{health.isPending ? '…' : online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
