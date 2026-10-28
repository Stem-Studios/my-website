'use client';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Focus,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
  ChartNoAxesCombined,
  CalendarDays,
} from 'lucide-react';
import { Brand } from '@/components/shell';
import { Badge } from '@/components/shared';
import { useDemo } from '@/components/provider';
export function Landing({ features = false }: { features?: boolean }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" aria-label="Stem Studios home">
          <Brand />
        </Link>
        <nav>
          <Link href="/features">The platform</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/dashboard">
            Open workspace
            <ArrowUpRight size={14} />
          </Link>
        </nav>
        <Link className="button button-outline" href="/login">
          Your workspace
          <ArrowRight size={15} />
        </Link>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-kicker">
            <span />
            YOUR AMBITION. MEET YOUR MOMENTUM. <ChevronRight size={12} />
          </div>
          <h1>
            {features ? (
              'Built around how you grow.'
            ) : (
              <>
                Study. Level up.
                <br />
                Go <span>further.</span>
              </>
            )}
          </h1>
          <p>
            Big ambitions start with small daily wins.
            <br />
            Your TMUA & ESAT workspace for practice, progress and your next rank.
          </p>
          <div className="landing-actions">
            <Link href="/onboarding" className="button button-light">
              Start your study journey
              <ArrowRight size={17} />
            </Link>
            <Link href="/dashboard" className="button button-ghost">
              Open your workspace
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="landing-proof">
            <span>
              <Check size={13} />
              Your own account
            </span>
            <span>
              <Check size={13} />
              No API keys
            </span>
            <span>
              <Check size={13} />
              Your pace, your progress
            </span>
          </div>
          <div className="landing-orbit" aria-hidden="true">
            <div />
            <div />
            <div />
            <span>✦</span>
          </div>
        </section>
        <section className="landing-preview">
          <div className="preview-browser">
            <div>
              <span />
              <span />
              <span />
            </div>
            <span>YOUR POTENTIAL, IN PROGRESS</span>
            <span>
              <span className="status-dot" />
              Stem Studios workspace
            </span>
          </div>
          <div className="landing-dashboard-mini">
            <div className="mini-nav">
              <Brand />
              <div>
                <Focus size={17} />
                Overview
              </div>
              <div>
                <BookOpen size={17} />
                Practice
              </div>
              <div>
                <CalendarDays size={17} />
                Study plan
              </div>
              <div>
                <ChartNoAxesCombined size={17} />
                Analytics
              </div>
            </div>
            <div className="mini-content">
              <span className="eyebrow">A LITTLE PROGRESS, EVERY DAY</span>
              <h2>Make room for extraordinary.</h2>
              <div className="mini-focus">
                <div>
                  <Badge>YOUR NEXT BEST STEP</Badge>
                  <h3>
                    A little focus.
                    <br />A lot of possibility.
                  </h3>
                  <Link href="/practice">
                    Start a focused session
                    <ArrowRight size={15} />
                  </Link>
                </div>
                <div className="mini-core">
                  <Focus size={56} strokeWidth={1} />
                </div>
              </div>
              <div className="mini-stats">
                {[
                  ['248', 'Questions answered'],
                  ['78%', 'Practice accuracy'],
                  ['7 days', 'Study streak'],
                ].map(([v, l]) => (
                  <div key={l}>
                    <strong>{v}</strong>
                    <span>{l}</span>
                    <small>Sample data</small>
                  </div>
                ))}
              </div>
            </div>
            <aside>
              <span className="eyebrow">THE BIGGER PICTURE</span>
              <Target size={37} />
              <h3>
                Your ambition,
                <br />
                with a direction.
              </h3>
              <p>Find a rhythm that works for you.</p>
              <div className="mini-bars">
                {[75, 60, 89, 48].map((v, i) => (
                  <div key={i}>
                    <span style={{ width: `${v}%` }} />
                  </div>
                ))}
              </div>
              <Link href="/dashboard">
                Step inside
                <ArrowUpRight size={15} />
              </Link>
            </aside>
          </div>
        </section>
        <section className="landing-features">
          <div>
            <span className="eyebrow">THOUGHTFUL TOOLS. MEANINGFUL PROGRESS.</span>
            <h2>
              A workspace for the way
              <br />
              you want to grow.
            </h2>
          </div>
          <div className="landing-feature-grid">
            {[
              {
                icon: Focus,
                title: 'Practice with intention.',
                text: 'Original questions, progressive hints and clear worked solutions. Build understanding one question at a time.',
              },
              {
                icon: CalendarDays,
                title: 'Find your own rhythm.',
                text: 'An editable revision plan built around your availability, goals and demonstrated performance.',
              },
              {
                icon: TrendingUp,
                title: 'Earn your next level.',
                text: 'Collect XP from new question attempts, unlock study ranks and celebrate real progress. Explore a clearly labelled sample league.',
              },
            ].map((f) => (
              <article key={f.title}>
                <f.icon size={25} />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-cta">
          <Sparkles size={27} />
          <h2>The next step is yours.</h2>
          <p>Start where you are. Build towards what’s possible.</p>
          <Link className="button button-light" href="/dashboard">
            Open your workspace
            <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>A clearer path to your potential.</p>
        <span>Original content · Local demo foundation</span>
      </footer>
    </div>
  );
}
export function DemoLogin({ signup = false }: { signup?: boolean }) {
  const { state } = useDemo();
  return (
    <div className="auth-page">
      <Link href="/" aria-label="Stem Studios home">
        <Brand />
      </Link>
      <section className="panel auth-panel">
        <div className="setup-icon">
          <GraduationCap size={28} />
        </div>
        <Badge tone="muted">LOCAL DEMO</Badge>
        <h1>{signup ? 'Your next chapter starts here.' : 'Welcome back to possibility.'}</h1>
        <p>
          Explore your revision workspace without a password, account or API key. Your progress is
          saved on this device.
        </p>
        <Link href={signup ? '/onboarding' : '/dashboard'} className="button button-primary">
          {signup ? 'Create my local profile' : `Continue as ${state.profile.name}`}
          <ArrowRight size={17} />
        </Link>
        <Link href={signup ? '/login' : '/signup'} className="subtle-link">
          {signup
            ? 'Already exploring? Open your workspace.'
            : 'New here? Personalise your starting point.'}
        </Link>
        <div className="auth-note">
          Real authentication is an extension point. No credentials are collected in this demo.
        </div>
      </section>
    </div>
  );
}
