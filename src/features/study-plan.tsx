'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';
import { useDemo } from '@/components/provider';
import { Badge, Meter, PageHeading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { generatePlan } from '@/domain/learning';
import { questions } from '@/data/questions';
export function StudyPlan() {
  const { state, setState, notify } = useDemo();
  const [week, setWeek] = useState(0);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const dates = state.tasks
    .map((t) => t.date)
    .filter(Boolean)
    .sort();
  const anchor = [...dates, new Date().toLocaleDateString('en-CA')].sort()[0];
  const start = new Date(`${anchor}T12:00:00`);
  const firstDay = new Date(start);
  start.setDate(start.getDate() + week * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const tasks = state.tasks
    .filter((t) => new Date(`${t.date}T12:00:00`) >= start && new Date(`${t.date}T12:00:00`) < end)
    .sort((a, b) => a.date.localeCompare(b.date));
  const done = state.tasks.filter((t) => t.done).length;
  const lastDay = new Date(`${dates.at(-1) ?? dates[0]}T12:00:00`);
  const weeks = Math.max(1, Math.floor((lastDay.getTime() - firstDay.getTime()) / 604800000) + 1);
  const hours = state.tasks.reduce((s, t) => s + t.minutes, 0) / 60;
  function regenerate() {
    try {
      const fresh = generatePlan(state.profile, questions, state.attempts);
      const completed = state.tasks.filter((t) => t.done);
      const completedKeys = new Set(completed.map((t) => `${t.date}:${t.title}`));
      setState((s) => ({
        ...s,
        tasks: [
          ...completed,
          ...fresh
            .filter((t) => !completedKeys.has(`${t.date}:${t.title}`))
            .map((t) => ({ ...t, id: `${Date.now()}-${t.id}` })),
        ].sort((a, b) => a.date.localeCompare(b.date)),
      }));
      notify('Future sessions refreshed using your latest practice.');
      setConfirm(false);
      setWeek(0);
    } catch (e) {
      setError((e as Error).message);
      setConfirm(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="A DIRECTION, NOT A DEADLINE"
        title="Make progress part of your week."
        description="A thoughtful plan, built around your time and where you are today."
        action={
          <Button variant="outline" onClick={() => setConfirm(true)}>
            <RefreshCw size={15} />
            Refresh future plan
          </Button>
        }
      />
      <div className="plan-overview panel">
        <div className="plan-overview-title">
          <div className="setup-icon">
            <CalendarDays size={23} />
          </div>
          <div>
            <h2>Your {state.profile.exam} programme</h2>
            <p>
              Rules-based · {state.profile.weeklyHours} hours per week ·{' '}
              <Link href="/onboarding">Adjust your goals</Link>
            </p>
          </div>
        </div>
        <div>
          <strong>
            {hours.toFixed(0)}
            <span>h</span>
          </strong>
          <small>planned study</small>
        </div>
        <div>
          <strong>
            {done}
            <span>/{state.tasks.length}</span>
          </strong>
          <small>sessions complete</small>
        </div>
        <div className="plan-progress">
          <span>{Math.round((done / state.tasks.length) * 100) || 0}% of the journey</span>
          <Meter value={(done / state.tasks.length) * 100 || 0} />
        </div>
      </div>
      <div className="week-toolbar">
        <div>
          <Badge>WEEK {week + 1}</Badge>
          <h2>
            {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} –{' '}
            {new Date(end.getTime() - 86400000).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
            })}
          </h2>
        </div>
        <div>
          <Button
            size="sm"
            variant="outline"
            disabled={!week}
            aria-label="Previous week"
            onClick={() => setWeek((w) => w - 1)}
          >
            <ChevronLeft size={17} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={week >= weeks - 1}
            aria-label="Next week"
            onClick={() => setWeek((w) => w + 1)}
          >
            <ChevronRight size={17} />
          </Button>
        </div>
      </div>
      <div className="plan-layout">
        <section className="plan-task-list">
          {tasks.length ? (
            tasks.map((t) => (
              <article key={t.id} className={`panel plan-task ${t.done ? 'completed' : ''}`}>
                <div className="plan-day">
                  <strong>
                    {new Date(`${t.date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit' })}
                  </strong>
                  <span>
                    {new Date(`${t.date}T12:00:00`).toLocaleDateString('en-GB', {
                      weekday: 'short',
                    })}
                  </span>
                </div>
                <div className="plan-task-body">
                  <div>
                    <Badge
                      tone={
                        t.kind === 'Review' ? 'amber' : t.kind === 'Checkpoint' ? 'green' : 'purple'
                      }
                    >
                      {t.kind}
                    </Badge>
                    <span>
                      <Clock3 size={12} />
                      {t.minutes} min
                    </span>
                  </div>
                  <h3>{t.title}</h3>
                  <p>
                    {t.topic} ·{' '}
                    {t.kind === 'Review'
                      ? 'Revisit mistakes and explain each step in your own words.'
                      : t.kind === 'Checkpoint'
                        ? 'Check what is sticking, and what needs another look.'
                        : 'Slow down, reason carefully, and make the method your own.'}
                  </p>
                  {editing === t.id ? (
                    <form
                      className="inline-date"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const date = String(new FormData(e.currentTarget).get('date'));
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
                        setState((s) => ({
                          ...s,
                          tasks: s.tasks.map((x) => (x.id === t.id ? { ...x, date } : x)),
                        }));
                        setEditing(null);
                        notify('Session date saved.');
                      }}
                    >
                      <span>Move session</span>
                      <input
                        aria-label={`New date for ${t.title}`}
                        type="date"
                        name="date"
                        required
                        defaultValue={t.date}
                      />
                      <Button size="sm" variant="outline" type="submit">
                        Done
                      </Button>
                    </form>
                  ) : (
                    <button className="subtle-link" onClick={() => setEditing(t.id)}>
                      Reschedule session
                    </button>
                  )}
                </div>
                <button
                  className={`complete-button ${t.done ? 'checked' : ''}`}
                  aria-label={`${t.done ? 'Reopen' : 'Complete'} ${t.title}`}
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      tasks: s.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                    }));
                    notify(
                      t.done ? 'Session reopened.' : 'Another meaningful step. Session completed.',
                    );
                  }}
                >
                  <Check size={18} />
                </button>
              </article>
            ))
          ) : (
            <div className="panel empty-state">
              <CalendarDays size={26} />
              <h3>A little breathing room.</h3>
              <p>
                No sessions scheduled in this week. Move a session here or explore your resources.
              </p>
              <Link href="/resources">
                Explore resources
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
        <aside>
          <div className="panel weekly-objective">
            <Target size={25} />
            <h2>A little intention goes a long way.</h2>
            <p>
              This week, work through {tasks.length} focused sessions. Accuracy and understanding
              matter more than speed.
            </p>
            <div>
              <span>Scheduled focus time</span>
              <strong>{(tasks.reduce((n, t) => n + t.minutes, 0) / 60).toFixed(1)} hours</strong>
            </div>
            <div>
              <span>Priority topics</span>
              <strong>
                {[...new Set(tasks.map((t) => t.topic))].slice(0, 2).join(', ') || 'Your choice'}
              </strong>
            </div>
            <Link href="/practice" className="button button-primary">
              Start practicing
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="plan-note">
            <Sparkles size={19} />
            <p>
              Your plan prioritises demonstrated weaknesses when you refresh it. Small samples
              remain uncertain. A target score is never guaranteed.
            </p>
          </div>
        </aside>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error} <Link href="/onboarding">Update your exam date</Link>
        </p>
      )}
      {confirm && (
        <div className="modal-overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Refresh study plan"
          >
            <h2>Find your next best steps.</h2>
            <p>
              Refresh upcoming sessions using your latest answers and weekly availability. Completed
              sessions stay in your plan. Custom dates for unfinished sessions will be replaced.
            </p>
            <div className="form-actions">
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Keep my plan
              </Button>
              <Button onClick={regenerate}>Refresh plan</Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
