import type { UseQueryResult } from '@tanstack/react-query';
import { ExternalLink, FileText, MessageSquare } from 'lucide-react';
import { apiUrl } from '../../api/client.ts';
import type { DocumentFolder, DocumentKind, ProjectDocument } from '../../api/types.ts';
import { PdfThumbnail } from '../../components/PdfThumbnail/PdfThumbnail.tsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/States/States.tsx';
import { CHANGE_ORDER_STATUS_LABEL, formatDate, formatTime } from '../../lib/format.ts';
import styles from './ProjectDocuments.module.scss';

const KIND_LABEL: Record<DocumentKind, string> = {
  plan: 'Plan',
  estimate: 'Estimate',
  timeline: 'Timeline',
  feasibility: 'Feasibility',
  interior: 'Interior',
  'change-order': 'Change order',
  other: 'Document',
};

const fileSize = (bytes: number) =>
  bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;

type Group = { key: string; folder: DocumentFolder | null; title: string; docs: ProjectDocument[] };

/** "2026-11-11_10-34-33_8435-corral-ln-…" -> "Nov 11, 2026, 10:34 AM" */
const folderDate = (name: string) => {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})/);
  if (!m) return name;
  const at = `${m[1]}T${m[2]}:${m[3]}:00`;
  return `${formatDate(at, true)}, ${formatTime(at)}`;
};

/** Design folders newest first, then change order PDFs, then anything posted in a chat. */
function groupDocuments(docs: ProjectDocument[]): Group[] {
  const groups = new Map<string, Group>();
  for (const d of docs) {
    const key = d.folder?.name ?? (d.kind === 'change-order' ? '~change-orders' : '~other');
    let group = groups.get(key);
    if (!group) {
      const title = d.folder
        ? d.folder.revision
          ? `Revision ${d.folder.revision.number}: ${d.folder.revision.title}`
          : `Design · ${folderDate(d.folder.name)}`
        : d.kind === 'change-order'
          ? 'Change orders'
          : 'Other documents';
      group = { key, folder: d.folder, title, docs: [] };
      groups.set(key, group);
    }
    group.docs.push(d);
  }
  return [...groups.values()].sort((a, b) => {
    const rank = (g: Group) => (g.folder ? 0 : g.key === '~change-orders' ? 1 : 2);
    return rank(a) - rank(b) || b.key.localeCompare(a.key);
  });
}

export function ProjectDocuments({
  documents,
  address,
}: {
  documents: UseQueryResult<ProjectDocument[]>;
  address: string;
}) {
  if (documents.isError)
    return <ErrorState error={documents.error} onRetry={() => void documents.refetch()} />;
  if (!documents.data)
    return (
      <div className={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={330} />
        ))}
      </div>
    );

  const docs = documents.data;
  if (docs.length === 0)
    return (
      <EmptyState icon={<FileText size={20} />} title="No documents yet">
        Plans, estimates, timelines and reports the agent makes for {address}, or posts in this
        project's chats, show up here.
      </EmptyState>
    );

  const groups = groupDocuments(docs);
  return (
    <>
      <p className={styles.count}>
        {docs.length} PDF{docs.length === 1 ? '' : 's'}
        {groups.length > 1 && ` in ${groups.length} groups`} · click one to open it
      </p>
      <div className={styles.groups}>
        {groups.map((g) => (
          <section key={g.key} className={styles.group}>
            <GroupHeading group={g} />
            <ul className={styles.grid}>
              {g.docs.map((d) => (
                <li key={d.path}>
                  <DocumentCard doc={d} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function GroupHeading({ group: { folder, title, docs } }: { group: Group }) {
  const revision = folder?.revision;
  return (
    <header className={styles.groupHead}>
      <h3>{title}</h3>
      {folder?.current && <span className={styles.current}>Current</span>}
      {revision && (
        <span className={styles.revision} data-status={revision.status}>
          {revision.changeOrderId ? `${revision.changeOrderId} · ` : ''}
          {revision.status === 'proposed'
            ? 'Not saved yet'
            : CHANGE_ORDER_STATUS_LABEL[revision.status]}
        </span>
      )}
      {revision && <span className={styles.groupMeta}>{folderDate(folder.name)}</span>}
      <span className={styles.groupMeta}>
        {docs.length} PDF{docs.length === 1 ? '' : 's'}
      </span>
    </header>
  );
}

function DocumentCard({ doc: d }: { doc: ProjectDocument }) {
  return (
    <a
      className={styles.card}
      href={apiUrl(d.url)}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open ${d.title}`}
    >
      <PdfThumbnail url={apiUrl(d.url)} className={styles.preview} />
      <div className={styles.info}>
        <div className={styles.titleRow}>
          <h3>{d.title}</h3>
          <ExternalLink size={14} className={styles.open} aria-hidden />
        </div>
        <div className={styles.meta}>
          <span className={styles.kind} data-kind={d.kind}>
            {KIND_LABEL[d.kind]}
          </span>
          <span>
            {formatDate(d.createdAt, true)}, {formatTime(d.createdAt)}
          </span>
          <span>{fileSize(d.sizeBytes)}</span>
        </div>
        {d.sources.includes('chat') && (
          <span className={styles.fromChat}>
            <MessageSquare size={12} /> Posted in this project's chat
          </span>
        )}
      </div>
    </a>
  );
}
