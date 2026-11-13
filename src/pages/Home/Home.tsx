import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  CalendarRange,
  ClipboardCheck,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  MapPin,
  MessageSquare,
  MessageSquareText,
  PencilRuler,
  Sofa,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router';
import { useStartChat } from '../../api/useStartChat.ts';
import { ButtonLink } from '../../components/Button/Button.tsx';
import { PageContainer } from '../../components/Page/Page.tsx';
import { RuhMark } from '../../components/RuhMark/RuhMark.tsx';
import styles from './Home.module.scss';

type Feature = { icon: LucideIcon; title: string; text: string; time: string };

const FEATURES: Feature[] = [
  {
    icon: MapPin,
    title: 'Land search',
    text: 'For-sale land in any city and budget, with a one-click design on each lot.',
    time: '~10 s',
  },
  {
    icon: PencilRuler,
    title: 'House design',
    text: 'Reads the lot’s zoning, decides how many homes fit, and draws the site and floor plans.',
    time: '~5 min',
  },
  {
    icon: Calculator,
    title: 'Cost estimate',
    text: 'Materials and labor trade by trade, with a contingency and a detailed PDF.',
    time: '~10 min',
  },
  {
    icon: CalendarRange,
    title: 'Construction timeline',
    text: 'Every task with dates, the critical path, inspections and milestones as a Gantt chart.',
    time: '~3 min',
  },
  {
    icon: ClipboardCheck,
    title: 'Feasibility report',
    text: 'Flood, soil and utility checks, nearby sales and rents, and a go / no-go verdict.',
    time: '~20 s',
  },
  {
    icon: Sofa,
    title: '3D interior',
    text: 'A furnished 3D top view of every floor, styled for the house and its price.',
    time: '~3 min',
  },
  {
    icon: FolderKanban,
    title: 'Project tracking',
    text: 'Status, stage and progress of every build, and what’s causing each delay.',
    time: 'Live',
  },
  {
    icon: Sparkles,
    title: 'Goals',
    text: 'Give it an outcome, not a task. It chains the steps itself and recommends a next move.',
    time: 'Multi-step',
  },
];

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Ask in plain English',
    text: 'A question (“which projects are delayed?”) or a goal (“find the best lot under 250k to build and sell”).',
  },
  {
    icon: ListChecks,
    title: 'It plans, you approve',
    text: 'The agent picks the steps and shows a live checklist. Slow work like designs and estimates only starts after you click Go.',
  },
  {
    icon: FileText,
    title: 'Get the results',
    text: 'A clear answer in the chat, with plans, estimates, schedules and reports attached as PDFs.',
  },
];

const EXAMPLES = [
  'Which projects are delayed, and why?',
  'Find land around 300k in Austin, TX',
  'Compare the plans for Brass Buttons and Corral Lane',
  'Find land under 300k in Austin with no flood or soil problems',
  'Which delayed projects have open permit issues, and what’s the next step on each?',
];

const AREAS = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    text: 'Portfolio health, projects that need attention and upcoming inspections.',
  },
  {
    to: '/projects',
    icon: FolderKanban,
    title: 'Projects',
    text: 'Every build with its schedule, budget, issues, team and site log.',
  },
  {
    to: '/chat',
    icon: MessageSquare,
    title: 'Chat',
    text: 'Talk to the agent, approve its plans and download what it produces.',
  },
];

export default function Home() {
  const { start, isPending, error } = useStartChat();

  return (
    <PageContainer>
      <section className={styles.hero}>
        <RuhMark size={56} />
        <div className={styles.eyebrow}>Ruh · Construction Agent</div>
        <h1>
          From a plot of land to a finished build, <span>with one agent.</span>
        </h1>
        <p>
          An AI assistant for builders and developers. It finds land, designs houses that fit local
          zoning, estimates costs, plans the schedule, checks whether a build is worth it, and keeps
          an eye on the projects you already have underway.
        </p>
        <div className={styles.cta}>
          <ButtonLink to="/chat" variant="primary">
            <MessageSquare size={16} /> Ask the agent
          </ButtonLink>
          <ButtonLink to="/dashboard">
            <LayoutDashboard size={16} /> Open dashboard
          </ButtonLink>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading eyebrow="Capabilities" title="What it can do" />
        <div className={styles.features}>
          {FEATURES.map(({ icon: Icon, title, text, time }) => (
            <article key={title} className={styles.feature}>
              <div className={styles.featureTop}>
                <span className={styles.icon}>
                  <Icon size={18} />
                </span>
                <span className={styles.time}>{time}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading eyebrow="Workflow" title="How it works" />
        <ol className={styles.steps}>
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className={styles.step}>
              <span className={styles.stepNumber}>{String(i + 1).padStart(2, '0')}</span>
              <Icon size={20} className={styles.stepIcon} />
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <SectionHeading eyebrow="Try it" title="Start with a question" />
        <div className={styles.examples}>
          {EXAMPLES.map((text) => (
            <button
              key={text}
              type="button"
              className={styles.example}
              onClick={() => start(text)}
              disabled={isPending}
            >
              {text}
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
        {error && <p className={styles.error}>Couldn’t start a chat: {error.message}</p>}
      </section>

      <section className={styles.section}>
        <SectionHeading eyebrow="Explore" title="Inside this app" />
        <div className={styles.areas}>
          {AREAS.map(({ to, icon: Icon, title, text }) => (
            <Link key={to} to={to} className={styles.area}>
              <span className={styles.icon}>
                <Icon size={18} />
              </span>
              <div>
                <h3>
                  {title} <ArrowUpRight size={15} />
                </h3>
                <p>{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <p className={styles.note}>
        Results are planning-level concepts produced with an AI model and public data. They are not
        construction drawings, bids, appraisals or legal advice.
      </p>
    </PageContainer>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className={styles.sectionHeading}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h2>{title}</h2>
    </header>
  );
}
