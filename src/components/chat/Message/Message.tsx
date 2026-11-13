import {
  Ban,
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardList,
  Download,
  FileText,
  LoaderCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { apiUrl } from '../../../api/client.ts';
import type {
  ChatAction,
  ChatFile,
  ChatMessage,
  MissionState,
  MissionStep,
  MissionView,
} from '../../../api/types.ts';
import { cx } from '../../../lib/cx.ts';
import { formatTime } from '../../../lib/format.ts';
import { Markdown } from '../../Markdown/Markdown.tsx';
import { RuhMark } from '../../RuhMark/RuhMark.tsx';
import { Spinner } from '../../States/States.tsx';
import styles from './Message.module.scss';

export type ActionHandler = (action: ChatAction) => void;
type ActionRef = Pick<ChatAction, 'actionId' | 'value'>;

type Props = {
  message: ChatMessage;
  onAction: ActionHandler;
  runningAction?: ActionRef;
};

export function Message({ message, onAction, runningAction }: Props) {
  if (message.role === 'user')
    return (
      <div className={cx(styles.row, styles.user)} data-pending={message.id.startsWith('pending-')}>
        <div className={styles.bubble}>{message.text}</div>
        <time className={styles.time}>{formatTime(message.createdAt)}</time>
      </div>
    );

  return (
    <div className={cx(styles.row, styles.agent)}>
      <span className={styles.avatar} aria-hidden>
        <RuhMark size={22} />
      </span>
      <div className={styles.body}>
        {message.kind === 'status' ? (
          <StatusCard message={message} />
        ) : (
          message.text && <Markdown>{message.text}</Markdown>
        )}
        {message.kind === 'files' && message.files && <Files files={message.files} />}
        {message.actions && message.actions.length > 0 && (
          <Actions actions={message.actions} onAction={onAction} running={runningAction} />
        )}
        <time className={styles.time}>{formatTime(message.updatedAt)}</time>
      </div>
    </div>
  );
}

export function Thinking() {
  return (
    <div className={cx(styles.row, styles.agent)}>
      <span className={styles.avatar} aria-hidden>
        <RuhMark size={22} />
      </span>
      <div className={styles.thinking} aria-label="The agent is thinking">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

const MISSION_STATE: Record<MissionState, { label: string; icon: ReactNode }> = {
  running: { label: 'Working on it', icon: <Spinner size={15} /> },
  'waiting-approval': { label: 'Waiting for your go-ahead', icon: <ClipboardList size={15} /> },
  'waiting-answer': { label: 'Needs your answer', icon: <CircleHelp size={15} /> },
  done: { label: 'Done', icon: <CircleCheck size={15} /> },
  failed: { label: 'Failed', icon: <CircleX size={15} /> },
  cancelled: { label: 'Cancelled', icon: <Ban size={15} /> },
};

function StatusCard({ message }: { message: ChatMessage }) {
  const { mission } = message;
  const live = mission
    ? mission.state === 'running'
    : Boolean(message.actions?.some((a) => a.style === 'danger'));
  const state: MissionState = mission?.state ?? (live ? 'running' : 'done');
  const { label, icon } = MISSION_STATE[state];

  return (
    <div className={styles.status} data-state={state}>
      <div className={styles.statusHeader}>
        <span className={styles.statusIcon}>{icon}</span>
        <span className={styles.statusLabel}>{label}</span>
        {mission && <span className={styles.statusGoal}>{mission.goal}</span>}
      </div>
      {!mission && message.text && (
        <div className={styles.statusText}>
          <Markdown>{message.text}</Markdown>
        </div>
      )}
      {mission && <MissionDetails mission={mission} />}
    </div>
  );
}

const STEP_ICON: Record<MissionStep['state'], ReactNode> = {
  running: <LoaderCircle size={14} className={styles.spin} />,
  done: <CircleCheck size={14} />,
  failed: <CircleX size={14} />,
};

function MissionDetails({ mission }: { mission: MissionView }) {
  return (
    <>
      {mission.steps.length > 0 && (
        <ol className={styles.steps}>
          {mission.steps.map((step, i) => (
            <li key={i} data-state={step.state}>
              {STEP_ICON[step.state]}
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      )}
      {mission.pendingPlan && (
        <div className={styles.plan}>
          {Object.entries(mission.pendingPlan.counts).map(([job, count]) => (
            <span key={job} className={styles.planChip}>
              {count} × {job}
            </span>
          ))}
          <span className={styles.planTime}>about {mission.pendingPlan.minutes} min</span>
        </div>
      )}
      {mission.pendingQuestion && (
        <p className={styles.question}>{mission.pendingQuestion.question}</p>
      )}
    </>
  );
}

function Actions({
  actions,
  onAction,
  running,
}: {
  actions: ChatAction[];
  onAction: ActionHandler;
  running?: ActionRef;
}) {
  return (
    <div className={styles.actions}>
      {actions.map((a) => {
        const isRunning = running?.actionId === a.actionId && running.value === a.value;
        return (
          <button
            key={`${a.actionId}:${a.value}`}
            type="button"
            className={cx(styles.action, a.style && styles[a.style])}
            onClick={() => onAction(a)}
            disabled={Boolean(running)}
          >
            {isRunning && <Spinner size={13} />}
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

function Files({ files }: { files: ChatFile[] }) {
  return (
    <div className={styles.files}>
      {files.map((f) => {
        const href = f.url ? apiUrl(f.url) : undefined;
        if (href && isImage(f.name))
          return (
            <a key={f.name} href={href} target="_blank" rel="noreferrer" className={styles.image}>
              <img src={href} alt={f.title} loading="lazy" />
              <span>{f.title}</span>
            </a>
          );
        return (
          <a
            key={f.name}
            href={href}
            target="_blank"
            rel="noreferrer"
            className={styles.file}
            aria-disabled={!href}
          >
            <span className={styles.fileIcon}>
              <FileText size={18} />
            </span>
            <span className={styles.fileText}>
              <strong>{f.title}</strong>
              <span>{f.name}</span>
            </span>
            {href && <Download size={16} className={styles.fileDownload} />}
          </a>
        );
      })}
    </div>
  );
}
