import { FolderKanban } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useProjects } from '../../api/queries.ts';
import { PROJECT_FILTERS, type ProjectFilter } from '../../api/types.ts';
import {
  FilterBar,
  FilterControls,
  FilterTabs,
  SearchBox,
  Toggle,
} from '../../components/FilterBar/FilterBar.tsx';
import { Page } from '../../components/Page/Page.tsx';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard.tsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/States/States.tsx';
import styles from './Projects.module.scss';

const FILTER_LABEL: Record<ProjectFilter, string> = {
  all: 'All active',
  behind: 'Behind schedule',
  delayed: 'Delayed',
  attention: 'Needs attention',
  'on-hold': 'On hold',
  planning: 'Planning',
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
      <FilterBar>
        <FilterTabs
          label="Filter projects"
          options={PROJECT_FILTERS.map((f) => ({ value: f, label: FILTER_LABEL[f] }))}
          value={filter}
          onChange={(f) => update({ filter: f === 'all' ? null : f })}
        />
        <FilterControls>
          <SearchBox
            placeholder="Search name, client, address"
            value={search}
            onChange={(q) => update({ q: q || null })}
          />
          <Toggle checked={completed} onChange={(on) => update({ completed: on ? 'true' : null })}>
            Show completed
          </Toggle>
        </FilterControls>
      </FilterBar>

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
