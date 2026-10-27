'use client';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock3, Target, TrendingUp } from 'lucide-react';
import { useDemo } from '@/components/provider';
import { questions } from '@/data/questions';
import { mastery, score } from '@/domain/learning';
import { Badge, Meter, PageHeading, PanelHeading } from '@/components/shared';
import { PerformanceChart } from './dashboard';
export function Analytics() {
  const { state } = useDemo();
  const result = score(state.attempts);
  const topics = [
    ...new Set(questions.filter((q) => q.exam === state.profile.exam).map((q) => q.topic)),
  ];
  const stats = [
    { icon: BookOpen, label: 'Questions answered', value: result.total },
    { icon: Target, label: 'Practice accuracy', value: result.total ? `${result.accuracy}%` : '—' },
    {
      icon: Clock3,
      label: 'Average answer time',
      value: result.total
        ? `${Math.round(state.attempts.reduce((s, a) => s + a.seconds, 0) / result.total)}s`
        : '—',
    },
    {
      icon: TrendingUp,
      label: 'Plan completed',
      value: `${Math.round((state.tasks.filter((t) => t.done).length / state.tasks.length) * 100) || 0}%`,
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="KNOW WHERE YOU STAND"
        title="Turn effort into insight."
        description="A clearer view of what’s growing, and where to focus next."
        action={
          <Link href="/practice" className="button button-outline">
            Build more evidence
            <ArrowRight size={15} />
          </Link>
        }
      />
      <div className="analytics-stats">
        {stats.map((s) => (
          <div className="panel" key={s.label}>
            <s.icon size={19} />
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="analytics-layout">
        <PerformanceChart />
        <section className="panel analytics-note">
          <Target size={28} />
          <h2>
            Mastery is a pattern,
            <br />
            built over time.
          </h2>
          <p>
            Your own topic estimates use a conservative prior. With fewer than five answers, there
            is not enough evidence for a confident judgement.
          </p>
          <Badge tone="muted">Based on your local attempts</Badge>
        </section>
      </div>
      <section className="panel topic-table">
        <PanelHeading
          title="Your topic map"
          subtitle="Your answers, with uncertainty kept in view"
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Current estimate</th>
                <th>Evidence</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => {
                const m = mastery(topic, state.attempts, questions);
                return (
                  <tr key={topic}>
                    <td>{topic}</td>
                    <td>
                      <div className="table-meter">
                        <Meter value={m.count ? m.percent : 0} />
                        <span>{m.count ? `${m.percent}%` : '—'}</span>
                      </div>
                    </td>
                    <td>{m.count} answers</td>
                    <td>
                      <Badge tone={m.count < 5 ? 'muted' : 'purple'}>{m.confidence}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="field-note">
        The trend chart is illustrative demo history. The metrics and topic table above reflect only
        answers you have submitted on this device.
      </p>
    </>
  );
}
