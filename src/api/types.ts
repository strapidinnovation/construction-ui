// Mirrors the responses of construction-agent/src/web (projects.ts, conversations.ts) and src/vendors.ts.

/** 'planning': no construction stage has started yet (e.g. a project made from a design). */
export type ProjectStatus =
  'planning' | 'on-track' | 'at-risk' | 'delayed' | 'on-hold' | 'completed';

export const PROJECT_FILTERS = [
  'all',
  'behind',
  'delayed',
  'attention',
  'on-hold',
  'planning',
] as const;
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
  vendorCount: number;
  nextInspection: Inspection | null;
  onHold: { since: string; reason: string } | null;
  dates: {
    start: string;
    plannedFinish: string;
    forecastFinish: string;
    actualFinish?: string | null;
  };
  budget: { contractUsd: number; spentUsd: number; approvedChangeOrdersUsd: number };
  /** Change orders waiting for the client. */
  pendingChangeOrders: number;
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
  vendors: { id: string; name: string }[];
};

/**
 * - done:     every stage they work on is done
 * - working:  one of their stages is in progress
 * - on-hold:  one of their stages is in progress, but the project is paused
 * - upcoming: their next stage hasn't started (they may have finished earlier ones)
 */
export type AssignmentStatus = 'done' | 'working' | 'on-hold' | 'upcoming';

/** A vendor working on a project. */
export type ProjectVendor = {
  vendorId: string;
  /** Null if the vendor has been removed from the vendor list. */
  vendor: Pick<
    Vendor,
    'id' | 'name' | 'type' | 'trade' | 'contact' | 'rating' | 'status' | 'insuranceExpires'
  > | null;
  scope: string;
  contractUsd: number | null;
  status: AssignmentStatus;
  start: string;
  end: string;
  stages: { stage: StageId; label: string; status: StageStatus | null }[];
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
  vendors: ProjectVendor[];
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

export const STAGES = [
  'pre-construction',
  'permitting',
  'site-prep',
  'foundation',
  'framing',
  'dry-in',
  'rough-ins',
  'insulation-drywall',
  'exterior',
  'interior-finishes',
  'final-installs',
  'closeout',
] as const;
export type StageId = (typeof STAGES)[number];

export const ORDER_STATUSES = ['created', 'sent', 'confirmed', 'fulfilled', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  description: string;
  quantity: number;
  /** e.g. "ea", "cu yd", "sq ft", "lot". */
  unit: string;
  unitPriceUsd: number;
};

/** What a project ordered from a vendor (construction-agent/src/orders.ts). */
export type Order = {
  /** "PO-1012" */
  id: string;
  projectId: string;
  vendorId: string;
  title: string;
  stage: StageId | null;
  items: OrderItem[];
  /** YYYY-MM-DD */
  neededBy: string | null;
  notes: string;
  status: OrderStatus;
  /** Every status it has had, oldest first; the last is the current one. */
  history: { status: OrderStatus; at: string }[];
  createdAt: string;
  updatedAt: string;
  totalUsd: number;
  /** Past its needed-by date and not fulfilled or cancelled. */
  overdue: boolean;
  project: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
};

export type PaymentKind = 'collection' | 'vendor-payment';
/** A pending payment past its proposed date is overdue. */
export type PaymentState = 'pending' | 'overdue' | 'completed';

/** Money in from the client or out to a vendor (construction-agent/src/payments.ts). */
export type Payment = {
  /** "PMT-1012" */
  id: string;
  kind: PaymentKind;
  projectId: string;
  /** Null for a collection. */
  vendorId: string | null;
  orderId: string | null;
  title: string;
  stage: StageId | null;
  amountUsd: number;
  /** YYYY-MM-DD: when it is due. */
  proposedDate: string;
  /** YYYY-MM-DD: when it was paid; null while pending. */
  actualDate: string | null;
  status: 'pending' | 'completed';
  notes: string;
  createdAt: string;
  updatedAt: string;
  state: PaymentState;
  /** Days overdue, or (completed) days paid after the proposed date; negative means early. */
  daysLate: number;
  project: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
};

type PaymentTotal = { usd: number; count: number };
/** The three don't overlap: pending means not due yet. */
export type PaymentTotals = Record<PaymentState, PaymentTotal>;

export type PaymentSummary = {
  collections: PaymentTotals;
  vendorPayments: PaymentTotals;
  /** Collected minus paid out so far. */
  netCashUsd: number;
};

export type DocumentKind =
  'plan' | 'estimate' | 'timeline' | 'feasibility' | 'interior' | 'change-order' | 'other';

/** The design folder a document is in: the original design or a revision made for a change order. */
export type DocumentFolder = {
  name: string;
  /** The design (or approved revision) the project's reports come from now. */
  current: boolean;
  revision: {
    /** 1 for the first revision. */
    number: number;
    title: string;
    changeOrderId: string | null;
    status: 'proposed' | ChangeOrderStatus;
  } | null;
};

/** A PDF the agent made for a project (construction-agent/src/projectDocuments.ts). */
export type ProjectDocument = {
  /** Inside the agent's output folder; unique. */
  path: string;
  title: string;
  kind: DocumentKind;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
  /**
   * "address": made for the project's address; "chat": posted in a chat opened from the project;
   * "change-order": a change order's PDF.
   */
  sources: ('address' | 'chat' | 'change-order')[];
  /** Null for documents that aren't in a design folder. */
  folder: DocumentFolder | null;
  /** Relative to the API (use apiUrl). */
  url: string;
};

export const CHANGE_ORDER_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ChangeOrderStatus = (typeof CHANGE_ORDER_STATUSES)[number];
/** small: priced line by line, the design stays; design: a revised plan and estimate were made. */
export type ChangeOrderKind = 'small' | 'design';

export type ChangeOrderLine = {
  trade: string;
  item: string | null;
  oldUsd: number;
  newUsd: number;
  note: string;
};

/** A change to a project's scope after the contract (construction-agent/src/changeOrders.ts). */
export type ChangeOrder = {
  /** "CO-1003" */
  id: string;
  projectId: string;
  kind: ChangeOrderKind;
  title: string;
  reason: string;
  lines: ChangeOrderLine[];
  /** Negative when work is removed. */
  amountUsd: number;
  daysAdded: number;
  revision: {
    dir: string;
    basedOn: string;
    changes: string[];
    /** Relative to the API (use apiUrl); null if the plan PDF is missing. */
    planUrl: string | null;
    originalPlanUrl: string | null;
  } | null;
  status: ChangeOrderStatus;
  notes: string;
  /** YYYY-MM-DD */
  requestedOn: string;
  decidedOn: string | null;
  /** Relative to the API (use apiUrl). */
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string } | null;
};

export type ChangeOrderSummary = Record<
  ChangeOrderStatus,
  { count: number; usd: number; days: number }
>;

export const VENDOR_TYPES = ['subcontractor', 'supplier', 'consultant'] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];
export type VendorStatus = 'active' | 'inactive';

export type Vendor = {
  id: string;
  name: string;
  type: VendorType;
  /** What they do, e.g. "Concrete & foundations". */
  trade: string;
  stages: StageId[];
  contact: { name: string | null; phone: string | null; email: string | null };
  serviceArea: string | null;
  licenseNumber: string | null;
  /** YYYY-MM-DD */
  insuranceExpires: string | null;
  /** The builder's own rating, 1 to 5. */
  rating: number | null;
  status: VendorStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
