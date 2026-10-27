'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Flame, Medal, Trophy, Zap, Check, BookOpen } from 'lucide-react';
import { useDemo } from './provider';
import { Meter } from './shared';
import { progression, ranks } from '@/domain/progression';
import { revisionStreak } from '@/domain/learning';

export function RankBadge({ rank, small = false }: { rank: string; small?: boolean }) {
  return (
    <span
      className={`rank-emblem rank-${rank.toLowerCase()} ${small ? 'small' : ''}`}
      aria-label={`${rank} rank`}
    >
      <Medal size={small ? 20 : 42} strokeWidth={1.7} />
    </span>
  );
}

export function RankCard() {
  const { state } = useDemo();
  const p = progression(state.attempts);
  return (
    <section className="panel rank-card">
      <div className="gamification-label">
        <Medal size={16} /> YOUR STUDY RANK <span>Local</span>
      </div>
      <RankBadge rank={p.rank.name} />
      <h2>{p.rank.name} scholar</h2>
      <p>Every question is a step up.</p>
      <div className="xp-total">
        <strong>{p.xp.toLocaleString()}</strong>
        <span>total XP</span>
      </div>
      <div className="xp-label">
        <span>{p.rank.name}</span>
        <strong>{p.next?.name ?? 'Top rank'}</strong>
      </div>
      <Meter value={p.percent} />
      <p className="next-rank">
        {p.next ? `${p.next.xp - p.xp} XP to your next rank` : 'You’ve reached the top study rank.'}
      </p>
      <Link href="/ranked" className="text-link">
        Explore the rank trail <ArrowRight size={14} />
      </Link>
    </section>
  );
}

export function MobileRankSummary() {
  const { state } = useDemo();
  const p = progression(state.attempts);
  return (
    <Link href="/ranked" className="mobile-rank-summary">
      <RankBadge rank={p.rank.name} small />
      <div>
        <strong>
          {p.rank.name} scholar <span>{p.xp} XP</span>
        </strong>
        <Meter value={p.percent} />
        <small>
          {p.next ? `${p.next.xp - p.xp} XP to ${p.next.name}` : 'Top study rank reached'}
        </small>
      </div>
      <ArrowRight size={16} />
    </Link>
  );
}

export function DailyGoals() {
  const { state } = useDemo();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const p = progression(state.attempts, now);
  const streak = revisionStreak(state.attempts, now);
  return (
    <section className="panel goals-card">
      <div className="goals-heading">
        <h2>Your daily quests</h2>
        <span>
          <Flame size={17} /> {streak} day streak
        </span>
      </div>
      {[
        { icon: BookOpen, title: 'Answer 5 questions', value: p.dailyAnswers, goal: 5, unit: '' },
        { icon: Zap, title: 'Collect 60 XP', value: p.dailyXP, goal: 60, unit: ' XP' },
      ].map((g) => (
        <div className="quest" key={g.title}>
          <g.icon size={20} />
          <div>
            <div>
              <strong>{g.title}</strong>
              <span>
                {Math.min(g.value, g.goal)}/{g.goal}
                {g.unit}
              </span>
            </div>
            <Meter value={Math.min(100, (g.value / g.goal) * 100)} />
          </div>
          {g.value >= g.goal && <Check size={18} className="positive" />}
        </div>
      ))}
      <p>New day, fresh momentum. Goals reset at local midnight.</p>
    </section>
  );
}

const sampleStudents = [
  { name: 'Sophie L.', xp: 1840, rank: 'Platinum', initials: 'SL' },
  { name: 'James K.', xp: 1620, rank: 'Platinum', initials: 'JK' },
  { name: 'Amara O.', xp: 1280, rank: 'Gold', initials: 'AO' },
  { name: 'Leo M.', xp: 950, rank: 'Gold', initials: 'LM' },
  { name: 'Isabel R.', xp: 740, rank: 'Gold', initials: 'IR' },
];
export function Leaderboard({ compact = false }: { compact?: boolean }) {
  const { state } = useDemo();
  const p = progression(state.attempts);
  const entries = [
    ...sampleStudents,
    {
      name: `${state.profile.name} (you)`,
      xp: p.xp,
      rank: p.rank.name,
      initials: state.profile.name.slice(0, 2).toUpperCase(),
      you: true,
    },
  ].sort((a, b) => b.xp - a.xp);
  return (
    <section className={`panel league-card ${compact ? 'compact-league' : ''}`}>
      <div className="league-heading">
        <div>
          <span className="eyebrow">A LITTLE FRIENDLY AMBITION</span>
          <h2>
            <Trophy size={20} /> The study league
          </h2>
        </div>
        <span className="badge badge-muted">Sample league</span>
      </div>
      {!compact && (
        <div className="podium">
          {[1, 0, 2].map((i) => (
            <div className={`podium-place place-${i + 1}`} key={i}>
              <span className="podium-medal">
                <Trophy size={i === 0 ? 28 : 22} />
              </span>
              <span className="league-avatar">{entries[i].initials}</span>
              <strong>{entries[i].name}</strong>
              <span>{entries[i].xp} XP</span>
              <div>0{i + 1}</div>
            </div>
          ))}
        </div>
      )}
      <div className="league-rows">
        {(compact ? entries.filter((e, i) => i < 3 || 'you' in e) : entries).map((e) => (
          <div className={`league-row ${'you' in e ? 'is-you' : ''}`} key={e.name}>
            <strong className="league-position">{entries.indexOf(e) + 1}</strong>
            <span className="league-avatar">{e.initials}</span>
            <div>
              <strong>{e.name}</strong>
              <span>{e.rank} scholar</span>
            </div>
            {!compact && <RankBadge rank={e.rank} small />}
            <strong>
              {e.xp.toLocaleString()} <small>XP</small>
            </strong>
          </div>
        ))}
      </div>
      <p className="league-note">
        Illustrative students. Your XP is real local activity; this position is only within this
        sample, not a live global ranking.
      </p>
      {compact && (
        <Link href="/leaderboard" className="text-link">
          See the full league <ArrowRight size={14} />
        </Link>
      )}
    </section>
  );
}

export function RankTrail() {
  const { state } = useDemo();
  const p = progression(state.attempts);
  const unique = new Set(state.attempts.filter((a) => a.selected >= 0).map((a) => a.questionId))
    .size;
  return (
    <section className="panel rank-trail">
      <h2>Your next chapter, earned.</h2>
      <p>
        Study ranks celebrate effort. They are separate from exam scores and competitive skill
        ratings.
      </p>
      <div className="rank-stops">
        {ranks.map((r) => (
          <div key={r.name} className={p.xp >= r.xp ? 'unlocked' : ''}>
            <RankBadge rank={r.name} small />
            <strong>{r.name}</strong>
            <span>{r.xp.toLocaleString()} XP</span>
            {p.rank.name === r.name && <span className="badge">You are here</span>}
          </div>
        ))}
      </div>
      <div className="milestones">
        {[
          { title: 'First step', target: 1 },
          { title: 'Finding your rhythm', target: 5 },
          { title: 'Double digits', target: 10 },
        ].map((m) => (
          <div key={m.title} className={unique >= m.target ? 'earned' : ''}>
            <Check size={16} />
            <div>
              <strong>{m.title}</strong>
              <span>
                {unique >= m.target ? 'Unlocked' : `${unique}/${m.target} unique questions`}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="xp-rules">
        <Zap size={22} />
        <p>
          <strong>Make every question count.</strong> Earn 10 XP for your first attempt at each
          question, plus 20 XP when you first get it right. Repeating a correct question adds no XP.
          Unanswered questions earn none. Progress is saved on this device.
        </p>
      </div>
      <Link href="/practice" className="button button-primary">
        Start study session <ArrowRight size={16} />
      </Link>
    </section>
  );
}

export function RecentActivity() {
  const { state } = useDemo();
  const p = progression(state.attempts);
  const recent = [...p.ledger]
    .filter((a) => a.selected >= 0)
    .reverse()
    .slice(0, 3);
  return (
    <section className="panel activity-card">
      <h2>Small wins, adding up.</h2>
      <p>Your recent study activity</p>
      {recent.length ? (
        recent.map((a) => (
          <div className="activity-row" key={a.id}>
            <Check size={17} />
            <div>
              <strong>{a.correct ? 'Question solved' : 'Practice completed'}</strong>
              <span>
                {new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                · {a.correct ? 'Nicely reasoned.' : 'Keep building understanding.'}
              </span>
            </div>
            <strong>+{a.xp} XP</strong>
          </div>
        ))
      ) : (
        <div className="activity-empty">
          Your first win is waiting. Complete a question to start your XP trail.
        </div>
      )}
    </section>
  );
}

export function SessionReward({ sessionId }: { sessionId: string }) {
  const { state } = useDemo();
  const p = progression(state.attempts);
  const gained = p.ledger.filter((a) => a.sessionId === sessionId).reduce((n, a) => n + a.xp, 0);
  const rankedUp = p.rank.xp > 0 && p.xp - gained < p.rank.xp;
  return (
    <section className="session-reward" role="status">
      <span className="reward-spark">
        <Zap size={30} />
      </span>
      <div>
        <span className="eyebrow">
          {rankedUp ? `RANK UP · ${p.rank.name.toUpperCase()} UNLOCKED` : 'SESSION COMPLETE'}
        </span>
        <h2>+{gained} XP earned</h2>
        <p>
          {gained
            ? 'A little effort. A step closer to your next rank.'
            : 'Practice builds understanding. Previously earned question XP is kept.'}
        </p>
      </div>
      <div className="reward-rank">
        <RankBadge rank={p.rank.name} small />
        <strong>
          {p.rank.name} · {p.xp} XP
        </strong>
        <Meter value={p.percent} />
      </div>
    </section>
  );
}
