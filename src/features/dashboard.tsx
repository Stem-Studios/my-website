'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Focus,
  MoreHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  CalendarDays,
  CircleCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useDemo } from '@/components/provider';
import { Badge, Meter, PanelHeading, PageHeading } from '@/components/shared';
import { sampleTopics, sampleTrend } from '@/data/demo';
import { score, revisionStreak } from '@/domain/learning';
import {
  RankCard,
  DailyGoals,
  Leaderboard,
  RecentActivity,
  MobileRankSummary,
} from '@/components/progression';
export function PerformanceChart({ compact = false }: { compact?: boolean }) {
  const { state } = useDemo();
  const [period, setPeriod] = useState('8 weeks');
  const data = period === '4 weeks' ? sampleTrend.slice(-4) : sampleTrend;
  return (
    <section className={`panel performance-panel ${compact ? 'compact' : ''}`}>
      <PanelHeading title="The work is working." subtitle="Your practice accuracy, over time" />
      <div className="chart-controls">
        <div className="chart-legend">
          <span />
          Practice accuracy <Badge tone="muted">Sample data</Badge>
        </div>
        <select
          aria-label="Chart period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option>8 weeks</option>
          <option>4 weeks</option>
        </select>
      </div>
      <div className="performance-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 18, right: 12, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="accuracy-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff7a30" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ff7a30" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eae5de" vertical={false} strokeDasharray="3 5" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#8b7b6e', fontSize: 10 }}
              dy={9}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#8b7b6e', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #eae5de',
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(v) => [`${v}%`, 'Accuracy']}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="#f27a32"
              strokeWidth={2.5}
              fill="url(#accuracy-fill)"
              activeDot={{ r: 5, stroke: '#ffb27c', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-insight">
        <TrendingUp size={15} />
        <span>
          {state.attempts.length
            ? `Your own accuracy is ${score(state.attempts).accuracy}% across ${state.attempts.length} practice and rehearsal questions.`
            : 'Consistency compounds. Keep showing up for your future self.'}
        </span>
      </div>
    </section>
  );
}
export function Dashboard() {
  const [today] = useState(() => Date.now());
  const { state, setState, notify } = useDemo();
  const completed = state.tasks.filter((t) => t.done).length;
  const actual = score(state.attempts);
  const answered = state.attempts.filter((a) => a.selected >= 0).length;
  const streak = revisionStreak(state.attempts, new Date(today));
  const days = Math.max(
    0,
    Math.ceil((new Date(state.profile.examDate).getTime() - today) / 86400000),
  );
  const tasks = state.tasks.slice(0, 3);
  const stats = [
    {
      label: 'Questions answered',
      value: String(answered),
      detail: 'Your practice activity',
      icon: BookOpen,
      spark: [6, 10, 7, 16, 13, 20, 17, 25, 22, 30],
    },
    {
      label: 'Practice accuracy',
      value: state.attempts.length ? `${actual.accuracy}%` : '—',
      detail: state.attempts.length
        ? 'Including unanswered in exams'
        : 'Your next answer starts here',
      icon: Target,
      spark: [7, 6, 12, 10, 17, 15, 20, 18, 24, 29],
    },
    {
      label: 'Revision time',
      value: state.attempts.length
        ? `${Math.round(state.attempts.reduce((a, b) => a + b.seconds, 0) / 60)}m`
        : '0m',
      detail: 'Time spent practicing',
      icon: Clock3,
      spark: [10, 8, 12, 14, 12, 20, 18, 21, 24, 27],
    },
    {
      label: 'Study streak',
      value: `${streak} ${streak === 1 ? 'day' : 'days'}`,
      detail: 'Consecutive practice days',
      icon: Flame,
      spark: [5, 9, 9, 15, 15, 21, 21, 27, 27, 30],
    },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="dashboard-heading">
        <PageHeading
          eyebrow="YOUR NEXT LEVEL STARTS HERE"
          title={`Ready to level up, ${state.profile.name}?`}
          description="Build your knowledge. Earn your progress. Make today count."
        />
        <Link className="button button-outline date-button" href="/onboarding">
          <CalendarDays size={15} />
          <span>{days} days to your exam</span>
          <ChevronRight size={14} />
        </Link>
      </div>
      <MobileRankSummary />
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="focus-banner">
            <div className="focus-banner-content">
              <span className="micro-label">
                <span />
                TODAY’S MAIN QUEST
              </span>
              <h2>
                Big goals.
                <br />
                Small daily wins.
              </h2>
              <p>
                {state.profile.exam === 'TMUA'
                  ? 'Sharpen your algebra and build your momentum.'
                  : 'Build your science and mathematics foundations.'}
                <br />
                Your next breakthrough is one question away.
              </p>
              <Link href="/practice" className="button button-light">
                Start study session
                <ArrowRight size={16} />
              </Link>
              <span className="banner-meta">
                <Clock3 size={12} />
                ~15 minutes<span>·</span>Adapted to you
              </span>
            </div>
            <div className="orbital-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <div className="orbit-core">
                <Zap size={42} strokeWidth={1.7} />
              </div>
              <span className="orbit-dot dot-one" />
              <span className="orbit-dot dot-two" />
              <span className="orbit-star star-one">✦</span>
              <span className="orbit-star star-two">✧</span>
              <div className="orbit-label">
                <Sparkles size={12} />
                Up to 30 XP per question
              </div>
            </div>
          </section>
          <div className="stats-heading">
            <h2>Your momentum</h2>
            <Badge tone="muted">Your activity</Badge>
            <Link href="/analytics">
              Explore analytics
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="stats-grid">
            {stats.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-label">
                  <span>{s.label}</span>
                  <s.icon size={14} />
                </div>
                <div className="stat-value-row">
                  <strong>{s.value}</strong>
                  <svg className="sparkline" viewBox="0 0 56 32" aria-hidden="true">
                    <polyline
                      points={s.spark.map((v, i) => `${i * 6},${34 - v}`).join(' ')}
                      fill="none"
                      stroke={s.icon === Flame ? '#d6ad77' : '#dd762f'}
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <small className={s.icon === Flame ? 'warm' : 'positive'}>
                  {s.icon !== Clock3 && <TrendingUp size={11} />} {s.detail}
                </small>
              </div>
            ))}
          </div>
          <DailyGoals />
          <RecentActivity />
          <PerformanceChart />
          <section className="panel daily-panel">
            <PanelHeading
              title="Make room for progress."
              subtitle="Your next sessions · a plan that moves with you"
              href="/study-plan"
              label="View study plan"
            />
            <div className="daily-tasks">
              {tasks.map((task, i) => (
                <div key={task.id} className={`task-row ${task.done ? 'completed' : ''}`}>
                  <button
                    className="task-check"
                    aria-label={`${task.done ? 'Reopen' : 'Complete'} ${task.title}`}
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        tasks: s.tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
                      }));
                      notify(
                        task.done ? 'Session reopened.' : 'Session complete. One step closer.',
                      );
                    }}
                  >
                    {task.done ? <Check size={14} /> : <span />}
                  </button>
                  <span className={`task-type-icon type-${i}`}>
                    {i === 0 ? (
                      <BookOpen size={17} />
                    ) : i === 1 ? (
                      <Focus size={17} />
                    ) : (
                      <Sparkles size={17} />
                    )}
                  </span>
                  <div className="task-details">
                    <h3>{task.title}</h3>
                    <p>
                      {task.kind} <span>·</span> {task.minutes} min <span>·</span> {task.topic}
                    </p>
                  </div>
                  <Link
                    href="/practice"
                    className="task-start"
                    aria-label={`Practice ${task.topic}`}
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              ))}
            </div>
            <div className="daily-footer">
              <span>
                <CircleCheck size={14} />
                {completed} of {state.tasks.length} sessions completed
              </span>
              <span>You’ve got this.</span>
            </div>
          </section>
        </div>
        <aside className="dashboard-secondary">
          <RankCard />
          <Leaderboard compact />
          <section className="panel journey-panel">
            <PanelHeading title="The bigger picture" />
            <div className="journey-caption">YOUR {state.profile.exam} JOURNEY</div>
            <div className="readiness-ring">
              <svg viewBox="0 0 180 180" aria-hidden="true">
                <circle cx="90" cy="90" r="73" fill="none" stroke="#24232e" strokeWidth="9" />
                <circle
                  cx="90"
                  cy="90"
                  r="73"
                  fill="none"
                  stroke="url(#ring-gradient)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray="326 459"
                  transform="rotate(-90 90 90)"
                />
                <defs>
                  <linearGradient id="ring-gradient">
                    <stop stopColor="#6c61b7" />
                    <stop offset="1" stopColor="#b59af7" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <strong>
                  71<span>%</span>
                </strong>
                <p>Practice readiness</p>
                <span className="positive">
                  <TrendingUp size={12} /> +8% this month
                </span>
              </div>
            </div>
            <p className="readiness-note">Sample indicator · not an exam score</p>
            <div className="journey-target">
              <span>
                <Target size={16} />
                Your target
              </span>
              <strong>
                {state.profile.targetScore.toFixed(1)}
                <small>/ 9.0</small>
              </strong>
            </div>
            <div className="journey-target">
              <span>
                <CalendarDays size={16} />
                Weekly commitment
              </span>
              <strong>
                {state.profile.weeklyHours}
                <small> hours</small>
              </strong>
            </div>
            <Link href="/onboarding" className="subtle-link">
              Make this plan yours
              <ArrowRight size={14} />
            </Link>
          </section>
          <section className="panel mastery-panel">
            <PanelHeading title="Know your strengths" href="/analytics" label="" />
            <p className="panel-description">
              Topic snapshot <span>·</span> Sample data
            </p>
            {sampleTopics.map((t) => (
              <div className="mastery-row" key={t.topic}>
                <div>
                  <span>{t.topic}</span>
                  <strong>{t.percent}%</strong>
                </div>
                <Meter value={t.percent} color={t.color} />
              </div>
            ))}
            <div className="priority-note">
              <Zap size={15} />
              <p>
                A little extra attention to <strong>logic & proof</strong> could go a long way.
              </p>
            </div>
          </section>
          <section className="tutor-callout">
            <div className="tutor-callout-icon">
              <Sparkles size={21} />
            </div>
            <h3>A nudge in the right direction.</h3>
            <p>Stuck on a concept? Find a fresh way to think about it.</p>
            <Link href="/ai-tutor">
              Meet your study companion
              <ArrowRight size={14} />
            </Link>
            <span className="tutor-demo-note">Scripted tutor preview</span>
          </section>
          <div className="weekly-dots">
            <span>This week’s rhythm</span>
            <div>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i}>
                  <span className={i < 4 ? 'day-active' : i === 4 ? 'day-current' : ''}>
                    {i < 4 ? (
                      <Check size={11} />
                    ) : i === 4 ? (
                      <Flame size={11} />
                    ) : (
                      <MoreHorizontal size={11} />
                    )}
                  </span>
                  <small>{d}</small>
                </div>
              ))}
            </div>
            <small>Sample activity · every day is a fresh start.</small>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
