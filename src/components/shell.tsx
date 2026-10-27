'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Library,
  Sparkles,
  Swords,
  Trophy,
  Settings,
  ChevronDown,
  Search,
  ArrowUpRight,
  X,
  Menu,
  Command,
  GraduationCap,
  CircleHelp,
  Check,
} from 'lucide-react';
import { useDemo } from './provider';
import { questions } from '@/data/questions';
const learning = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/practice', label: 'Practice', icon: BookOpen },
  { href: '/study-plan', label: 'Study plan', icon: CalendarDays },
  { href: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { href: '/mock-exams', label: 'Mock exams', icon: GraduationCap },
];
const explore = [
  { href: '/question-bank', label: 'Question bank', icon: Library },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/ai-tutor', label: 'AI tutor', icon: Sparkles },
  { href: '/ranked', label: 'Ranked', icon: Swords },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-icon" aria-hidden="true">
        S
      </span>
      <span className="brand-name">Stem Studios</span>
    </span>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, setState, notify } = useDemo();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [examMenu, setExamMenu] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearch((v) => !v);
      }
      if (e.key === 'Escape') {
        setSearch(false);
        setMobile(false);
        setHelp(false);
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);
  const current =
    [...learning, ...explore].find((n) => pathname.startsWith(n.href))?.label ?? 'Workspace';
  return (
    <div className="app-shell">
      <button
        className={`mobile-scrim ${mobile ? 'visible' : ''}`}
        aria-label="Close navigation"
        onClick={() => setMobile(false)}
      />
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <Link href="/" className="brand-link" aria-label="Stem Studios home">
          <Brand />
        </Link>
        <div className="workspace-switch">
          <span className="workspace-symbol">
            <GraduationCap size={19} />
          </span>
          <div>
            Personal workspace<small>Admissions, reimagined.</small>
          </div>
          <ChevronDown size={13} />
        </div>
        <div className="nav-group-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {learning.map((n) => (
            <Link
              onClick={() => setMobile(false)}
              key={n.href}
              href={n.href}
              className={`nav-item ${pathname.startsWith(n.href) ? 'active' : ''}`}
            >
              <n.icon size={18} />
              {n.label}
              {n.href === '/study-plan' && (
                <span className="nav-count">
                  {state.tasks.filter((t) => !t.done).slice(0, 4).length}
                </span>
              )}
            </Link>
          ))}
          <div className="nav-group-label explore-label">EXPLORE</div>
          {explore.map((n) => (
            <Link
              onClick={() => setMobile(false)}
              key={n.href}
              href={n.href}
              className={`nav-item ${pathname.startsWith(n.href) ? 'active' : ''}`}
            >
              <n.icon size={18} />
              {n.label}
              {n.href === '/ai-tutor' && <span className="tiny-tag">DEMO</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="journey-card">
            <span className="journey-star">
              <Sparkles size={17} />
            </span>
            <h3>Built for your next step.</h3>
            <p>A little progress, every day.</p>
            <Link href="/onboarding">
              Personalise your journey
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <Link href="/settings" className="nav-item">
            <Settings size={17} />
            Settings
          </Link>
          <Link href="/profile" className="profile-link">
            <span className="avatar">{state.profile.name.slice(0, 1)}</span>
            <span>
              {state.profile.name}
              <small>Local demo account</small>
            </span>
            <ChevronDown size={14} />
          </Link>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{current}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              aria-label="Search workspace"
              onClick={() => setSearch(true)}
            >
              <Search size={15} />
              <span>Quick search...</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="topbar-divider" />
            <div className="exam-picker">
              <button
                className="exam-button"
                aria-expanded={examMenu}
                onClick={() => setExamMenu(!examMenu)}
              >
                <span className="status-dot" />
                {state.profile.exam}
                <ChevronDown size={13} />
              </button>
              {examMenu && (
                <div className="dropdown">
                  {(['TMUA', 'ESAT'] as const).map((exam) => (
                    <button
                      key={exam}
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          profile: {
                            ...s.profile,
                            exam,
                            modules:
                              exam === 'TMUA'
                                ? ['Mathematics']
                                : ['Mathematics 1', 'Physics', 'Mathematics 2'],
                          },
                        }));
                        setExamMenu(false);
                        notify(`${exam} workspace selected. Update your study plan in onboarding.`);
                      }}
                    >
                      {exam}
                      {state.profile.exam === exam && <Check size={15} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="icon-button help-button"
              aria-label="About demo mode"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={18} />
            </button>
          </div>
        </header>
        <main className="page-content">
          {children}
          <footer className="workspace-footer">
            <span>
              <span className="status-dot" />
              All progress starts with a single question.
            </span>
            <span>
              Demo workspace <span>·</span> Saved on this device
            </span>
          </footer>
        </main>
      </div>
      {search && (
        <div className="modal-overlay" onMouseDown={() => setSearch(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Quick search"
            className="search-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="search-input-wrap">
              <Search size={19} />
              <input
                autoFocus
                placeholder="Search pages, questions, topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="icon-button"
                aria-label="Close search"
                onClick={() => setSearch(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="search-results">
              {[...learning, ...explore]
                .filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
                .map((n) => (
                  <Link key={n.href} href={n.href} onClick={() => setSearch(false)}>
                    <n.icon size={18} />
                    {n.label}
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
              {query &&
                questions
                  .filter((q) => `${q.topic} ${q.text}`.toLowerCase().includes(query.toLowerCase()))
                  .slice(0, 4)
                  .map((q) => (
                    <Link href="/question-bank" key={q.id} onClick={() => setSearch(false)}>
                      <Search size={17} />
                      {q.topic} · {q.id}
                      <ArrowUpRight size={15} />
                    </Link>
                  ))}
            </div>
            <div className="search-footer">
              <Command size={12} /> Quick navigation <span>ESC to close</span>
            </div>
          </section>
        </div>
      )}
      {help && (
        <div className="modal-overlay" onMouseDown={() => setHelp(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="About this demo"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Close"
              onClick={() => setHelp(false)}
            >
              <X size={18} />
            </button>
            <Sparkles size={28} />
            <h2>Your local workspace</h2>
            <p>
              Practice, onboarding, bookmarks and study plans work without an account or API key.
              Progress is stored in this browser. Dashboard sample statistics are labelled
              separately from your own attempts.
            </p>
            <p>
              AI tutor responses are scripted examples. Ranked competition and official exam
              calibration are future integrations.
            </p>
            <Link
              className="button button-primary"
              href="/onboarding"
              onClick={() => setHelp(false)}
            >
              Set up my profile
              <ArrowUpRight size={16} />
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
