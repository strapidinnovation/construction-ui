// Mirrors the responses of construction-agent/src/web (projects.ts, conversations.ts).

export type ProjectStatus = 'on-track' | 'at-risk' | 'delayed' | 'on-hold' | 'completed';

export const PROJECT_FILTERS = ['all', 'behind', 'delayed', 'attention', 'on-hold'] as const;
export type ProjectFilter = (typeof PROJECT_FILTERS)[number];

export type StageStatus = 'done' | 'in-progress' | 'not-started';

export type Inspection = {
  name: string;
  date: string;
  result: 'passed' | 'failed' | 'scheduled';
  notes?: string;
};

export type CurrentStage = {
  stage: string;
  label: string;
  percent: number;
  plannedEnd: string;
  forecastEnd: string | null;
};

export type ProjectSummary = {
  id: string;
  name: string;
  client: string;
  address: string;
  status: ProjectStatus;
  statusLabel: string;
  daysLate: number;
  percentComplete: number;
  currentStages: CurrentStage[];
  doneStages: number;
  totalStages: number;
  openIssueCount: number;
  nextInspection: Inspection | null;
  onHold: { since: string; reason: string } | null;
  dates: {
    start: string;
    plannedFinish: string;
    forecastFinish: string;
    actualFinish?: string | null;
  };
  budget: { contractUsd: number; spentUsd: number; approvedChangeOrdersUsd: number };
};

export type Stage = {
  stage: string;
  label: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  forecastEnd?: string | null;
  status: StageStatus;
  percent: number;
};

export type Issue = {
  id: string;
  title: string;
  category: string;
  status: 'open' | 'resolved';
  raisedOn: string;
  resolvedOn?: string | null;
  expectedResolution?: string | null;
  impactDays: number;
  stage: string;
  owner: string;
  description: string;
  nextStep?: string | null;
};

export type ProjectUpdate = { date: string; author: string; note: string };

export type ProjectDetail = ProjectSummary & {
  aliases: string[];
  site: { address: string; zoning: string; lotSqft: number };
  scope: { homes: number; description: string; heatedSqft: number };
  team: { builder: string; projectManager: string; superintendent: string };
  currentStageLateDays: number;
  stages: Stage[];
  delayCauses: Issue[];
  openIssues: Issue[];
  issues: Issue[];
  inspections: Inspection[];
  updates: ProjectUpdate[];
};

export type ProjectCounts = {
  total: number;
  ongoing: number;
  byStatus: Record<ProjectStatus, number>;
  openIssues: number;
  contractUsd: number;
  spentUsd: number;
};

export type ChatAction = {
  label: string;
  actionId: string;
  value: string;
  style?: 'primary' | 'danger';
};

export type ChatFile = { title: string; name: string; url: string | null };

export type MissionState =
  'running' | 'waiting-approval' | 'waiting-answer' | 'done' | 'failed' | 'cancelled';

export type MissionStep = { text: string; state: 'running' | 'done' | 'failed' };

export type MissionView = {
  id: string;
  goal: string;
  state: MissionState;
  steps: MissionStep[];
  pendingPlan?: { counts: Record<string, number>; minutes: number };
  pendingQuestion?: { question: string; options: string[] };
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'agent';
  kind: 'text' | 'status' | 'files';
  text: string;
  actions?: ChatAction[];
  files?: ChatFile[];
  mission?: MissionView;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type ConversationListItem = {
  id: string;
  title: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  busy: boolean;
};
