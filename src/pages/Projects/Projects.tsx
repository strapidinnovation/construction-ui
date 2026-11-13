import { FolderKanban, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useProjects } from '../../api/queries.ts';
import { PROJECT_FILTERS, type ProjectFilter } from '../../api/types.ts';
import { Page } from '../../components/Page/Page.tsx';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard.tsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/States/States.tsx';
import { cx } from '../../lib/cx.ts';
import styles from './Projects.module.scss';

const FILTER_LABEL: Record<ProjectFilter, string> = {
  all: 'All active',
  behind: 'Behind schedule',
  delayed: 'Delayed',
  attention: 'Needs attention',
  'on-hold': 'On hold',
};

const isFilter = (v: string | null): v is ProjectFilter =>
  (PROJECT_FILTERS as readonly string[]).includes(v ?? '');

export default function Projects() {
  const [params, setParams] = useSearchParams();
  const rawFilter = params.get('filter');
  const filter: ProjectFilter = isFilter(rawFilter) ? rawFilter : 'all';
  const completed = params.get('completed') === 'true';
  const search = params.get('q') ?? '';

  const projects = useProjects(filter, completed);

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

  const query = search.trim().toLowerCase();
  const visible = projects.data?.filter((p) =>
    [p.name, p.client, p.address].some((field) => field.toLowerCase().includes(query)),
  );

  return (
    <Page
      eyebrow={
        <>
          <FolderKanban size={14} /> Portfolio
        </>
      }
      title="Projects"
      subtitle="Every build, most urgent first."
    >
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Filter projects">
          {PROJECT_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={f === filter}
              className={cx(styles.tab, f === filter && styles.active)}
              onClick={() => update({ filter: f === 'all' ? null : f })}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <label className={styles.search}>
            <Search size={16} />
            <input
              type="search"
              placeholder="Search name, client, address"
              value={search}
              onChange={(e) => update({ q: e.target.value || null })}
            />
            {search && (
              <button type="button" onClick={() => update({ q: null })} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </label>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => update({ completed: e.target.checked ? 'true' : null })}
            />
            <span className={styles.track} aria-hidden />
            Show completed
          </label>
        </div>
      </div>

      {projects.isError ? (
        <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />
      ) : !visible ? (
        <div className={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={330} className={styles.skeleton} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<FolderKanban size={20} />} title="No projects match">
          {query ? `Nothing matches "${search}".` : 'No projects in this view.'}
        </EmptyState>
      ) : (
        <>
          <p className={styles.count}>
            {visible.length} project{visible.length === 1 ? '' : 's'}
          </p>
          <div className={styles.grid}>
            {visible.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
