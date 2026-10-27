'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CircleCheck,
  Clock3,
  Flag,
  Focus,
  Lightbulb,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useDemo } from '@/components/provider';
import { Badge, Empty, MathText, Meter, PageHeading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { questions } from '@/data/questions';
import { demoExamFormat } from '@/data/exam-config';
import { adaptiveQuestions, remainingSeconds, score, validateAnswer } from '@/domain/learning';
import type { Attempt, Question } from '@/domain/types';
import { demoTutor } from '@/services/tutor';
export function useStartSession() {
  const { setState } = useDemo();
  const router = useRouter();
  return (bank: Question[], mock = false) => {
    const now = Date.now();
    setState((s) => ({
      ...s,
      session: {
        id: crypto.randomUUID(),
        questionIds: bank.map((q) => q.id),
        index: 0,
        answers: {},
        startedAt: now,
        questionStartedAt: now,
        finished: false,
        mode: mock ? 'mock' : 'practice',
        ...(mock ? { deadline: now + demoExamFormat.durationSeconds * 1000 } : {}),
      },
    }));
    router.push(mock ? '/mock-exams/demo' : '/practice/demo');
  };
}
export function PracticeSetup({ mock = false }: { mock?: boolean }) {
  const { state } = useDemo();
  const start = useStartSession();
  const [topic, setTopic] = useState('All topics');
  const [difficulty, setDifficulty] = useState('Adaptive');
  const [count, setCount] = useState(5);
  const eligible = questions.filter(
    (q) =>
      q.exam === state.profile.exam &&
      (state.profile.exam === 'TMUA' || state.profile.modules.includes(q.module)),
  );
  const topics = [...new Set(eligible.map((q) => q.topic))];
  const filtered = eligible.filter(
    (q) =>
      (topic === 'All topics' || q.topic === topic) &&
      (difficulty === 'Adaptive' || q.difficulty === difficulty),
  );
  const selected = adaptiveQuestions(
    filtered,
    state.attempts,
    mock ? demoExamFormat.questionCount : count,
  );
  return (
    <>
      <PageHeading
        eyebrow={mock ? 'A CALMER EXAM DAY STARTS HERE' : 'PURPOSEFUL PRACTICE'}
        title={mock ? 'Get comfortable with the clock.' : 'One question closer.'}
        description={
          mock
            ? 'A focused rehearsal to practise pacing and build exam confidence.'
            : 'Build understanding, find your rhythm, and make your next step count.'
        }
      />
      <div className="practice-setup-grid">
        <section className="panel setup-panel">
          <div className="setup-icon">{mock ? <Clock3 size={26} /> : <Focus size={26} />}</div>
          <h2>{mock ? 'Short timed rehearsal' : 'Create your focused session'}</h2>
          <p>
            {mock
              ? 'A demo format with original questions. This is not an official exam simulation.'
              : 'Your practice. Your pace. Choose a focus or let the demo adapt to your recent answers.'}
          </p>
          <div className="form-grid">
            <label>
              Exam
              <input value={state.profile.exam} readOnly />
            </label>
            <label>
              Question count
              <select
                disabled={mock}
                value={mock ? 5 : count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[3, 5, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} questions
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!mock && (
            <>
              <label>
                Topic
                <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option>All topics</option>
                  {topics.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Difficulty
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  {['Adaptive', 'Foundation', 'Intermediate', 'Challenge'].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <div className="session-summary">
            <span>
              <BookOpenIcon />
              {selected.length} original questions
            </span>
            <span>
              <Clock3 size={15} />
              {mock
                ? '10 minutes'
                : `~${Math.ceil(selected.reduce((n, q) => n + q.seconds, 0) / 60)} minutes`}
            </span>
            <span>
              <ShieldCheck size={15} />
              {mock ? 'Hints disabled' : 'Worked solutions'}
            </span>
          </div>
          <Button disabled={!selected.length} onClick={() => start(selected, mock)}>
            <Play size={16} />
            {mock ? 'Begin timed rehearsal' : 'Start practice'}
            <ArrowRight size={16} />
          </Button>
          {selected.length < count && !mock && (
            <p className="field-note">
              This filter has {selected.length} demo questions. Your session will include all of
              them.
            </p>
          )}
          {state.session && !state.session.finished && (
            <Link
              href={state.session.mode === 'mock' ? '/mock-exams/demo' : '/practice/demo'}
              className="resume-link"
            >
              Resume your active {state.session.mode === 'mock' ? 'rehearsal' : 'practice'} session
              <ArrowRight size={15} />
            </Link>
          )}
        </section>
        <aside>
          <div className="panel practice-aside">
            <Badge>THE STEM STUDIOS APPROACH</Badge>
            <h2>
              Understanding over
              <br />
              just getting it right.
            </h2>
            {[
              {
                icon: Target,
                title: 'Focus on what matters',
                text: 'Adaptive ordering prioritises unseen questions and adjusts difficulty after recent answers.',
              },
              {
                icon: Lightbulb,
                title: 'Find your own way there',
                text: 'Three progressive hints help you think through a question before seeing a solution.',
              },
              {
                icon: CircleCheck,
                title: 'Learn from every attempt',
                text: 'Your answers inform topic estimates and your next study plan.',
              },
            ].map((x) => (
              <div className="approach-row" key={x.title}>
                <x.icon size={19} />
                <div>
                  <h3>{x.title}</h3>
                  <p>{x.text}</p>
                </div>
              </div>
            ))}
            <p className="field-note">
              Demo scoring happens on this device. No official scaled scores or secure competitive
              rankings are generated.
            </p>
          </div>
          <div className="quote-panel">
            <span>“</span>
            <p>It’s not that I’m so smart, it’s just that I stay with problems longer.</p>
            <small>A little persistence goes a long way.</small>
          </div>
        </aside>
      </div>
    </>
  );
}
function BookOpenIcon() {
  return <span className="small-math-icon">ƒ</span>;
}
export function ActivePractice() {
  const { state, setState, ready } = useDemo();
  const router = useRouter();
  const session = state.session;
  const [now, setNow] = useState(() => Date.now());
  const [finishPrompt, setFinishPrompt] = useState(false);
  const finish = useCallback(() => {
    setState((s) => {
      const current = s.session;
      if (!current || current.finished) return s;
      const attempts: Attempt[] =
        current.mode === 'mock'
          ? current.questionIds.flatMap((id) => {
              const q = questions.find((q) => q.id === id);
              if (!q) return [];
              const selected = current.answers[id] ?? -1;
              return [
                {
                  id: crypto.randomUUID(),
                  sessionId: current.id,
                  questionId: id,
                  selected,
                  correct: selected >= 0 && validateAnswer(q, selected),
                  seconds: Math.round(
                    (Date.now() - current.startedAt) / 1000 / current.questionIds.length,
                  ),
                  date: new Date().toISOString(),
                },
              ];
            })
          : [];
      return {
        ...s,
        session: { ...current, finished: true },
        attempts: [...s.attempts, ...attempts],
      };
    });
    router.push('/results/demo');
  }, [setState, router]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (
      ready &&
      session?.mode === 'mock' &&
      !session.finished &&
      session.deadline &&
      remainingSeconds(session.deadline, now) === 0
    )
      finish();
  }, [now, session, ready, finish]);
  if (!ready) return <div className="empty-state">Restoring your session…</div>;
  if (!session)
    return (
      <Empty
        title="Your next session is waiting."
        description="Choose a focus and start a new practice session."
        href="/practice"
      />
    );
  if (session.finished)
    return (
      <Empty
        title="This session is complete."
        description="Review your results or start a fresh session."
        href="/results/demo"
        label="See results"
      />
    );
  const q = questions.find((q) => q.id === session.questionIds[session.index]);
  if (!q)
    return (
      <Empty
        title="Question unavailable"
        description="Start a new session to refresh your demo question set."
        href="/practice"
      />
    );
  const seconds =
    session.mode === 'mock' && session.deadline
      ? remainingSeconds(session.deadline, now)
      : Math.max(0, Math.floor((now - session.startedAt) / 1000));
  const go = (index: number) =>
    setState((s) => ({
      ...s,
      session: s.session ? { ...s.session, index, questionStartedAt: Date.now() } : null,
    }));
  return (
    <>
      <div className="session-top">
        <Link className="text-link" href="/practice">
          <ArrowLeft size={16} />
          Back to practice
        </Link>
        <Badge tone="muted">
          {session.mode === 'mock' ? 'Timed rehearsal · demo format' : 'Focused practice'}
        </Badge>
      </div>
      <div className="session-header">
        <div>
          <div className="eyebrow">
            {state.profile.exam} · {q.module}
          </div>
          <h1>A moment to think.</h1>
        </div>
        {(state.timer || session.mode === 'mock') && (
          <div
            className={`session-timer ${session.mode === 'mock' && seconds < 60 ? 'danger' : ''}`}
          >
            <Clock3 size={17} />
            {Math.floor(seconds / 60)
              .toString()
              .padStart(2, '0')}
            :{(seconds % 60).toString().padStart(2, '0')}
            <span>{session.mode === 'mock' ? 'remaining' : 'elapsed'}</span>
          </div>
        )}
      </div>
      <Meter value={((session.index + 1) / session.questionIds.length) * 100} />
      <div className="session-layout">
        <QuestionCard
          key={q.id}
          question={q}
          onNext={() =>
            session.index === session.questionIds.length - 1 ? finish() : go(session.index + 1)
          }
          onFinish={() => setFinishPrompt(true)}
        />
        <aside className="panel session-nav">
          <h3>Your session</h3>
          <p>{session.questionIds.length} questions · one step at a time</p>
          <div className="question-numbers">
            {session.questionIds.map((id, i) => (
              <button
                key={id}
                className={`${i === session.index ? 'current' : ''} ${session.answers[id] !== undefined ? 'answered' : ''}`}
                aria-label={`Go to question ${i + 1}`}
                onClick={() => go(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="nav-key">
            <span />
            Answered <span />
            Current
          </div>
          <Button variant="outline" onClick={() => setFinishPrompt(true)}>
            Finish session
            <ArrowRight size={15} />
          </Button>
          <p className="field-note">
            {session.mode === 'mock'
              ? 'Unanswered questions receive no marks. Your session submits automatically when the timer ends.'
              : 'Your answers are saved automatically on this device.'}
          </p>
        </aside>
      </div>
      {finishPrompt && (
        <div className="modal-overlay">
          <section role="dialog" aria-modal="true" aria-label="Finish session" className="modal">
            <h2>Ready to reflect?</h2>
            <p>
              You’ve answered {Object.keys(session.answers).length} of {session.questionIds.length}{' '}
              questions.{' '}
              {session.mode === 'mock'
                ? 'Unanswered questions receive no marks.'
                : 'Your submitted answers will be included in your results.'}
            </p>
            <div className="form-actions">
              <Button variant="outline" onClick={() => setFinishPrompt(false)}>
                Keep going
              </Button>
              <Button onClick={finish}>Finish & see results</Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
function QuestionCard({
  question: q,
  onNext,
  onFinish,
}: {
  question: Question;
  onNext: () => void;
  onFinish: () => void;
}) {
  const { state, setState, notify } = useDemo();
  const session = state.session!;
  const [choice, setChoice] = useState<number | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [report, setReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const saved = session.answers[q.id];
  const isMock = session.mode === 'mock';
  const submitted = !isMock && saved !== undefined;
  const selected = isMock ? saved : submitted ? saved : choice;
  const bookmarked = state.bookmarks.includes(q.id);
  const answer = (i: number) => {
    if (isMock)
      setState((s) => ({
        ...s,
        session: s.session ? { ...s.session, answers: { ...s.session.answers, [q.id]: i } } : null,
      }));
    else setChoice(i);
  };
  const submit = () => {
    if (choice === null || submitted) return;
    const correct = validateAnswer(q, choice);
    const attempt: Attempt = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      questionId: q.id,
      selected: choice,
      correct,
      seconds: Math.max(0, Math.round((Date.now() - session.questionStartedAt) / 1000)),
      date: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      attempts: [...s.attempts, attempt],
      session: s.session
        ? { ...s.session, answers: { ...s.session.answers, [q.id]: choice } }
        : null,
    }));
  };
  return (
    <section className="panel question-card">
      <div className="question-meta">
        <span>
          QUESTION {session.index + 1} <span>/ {session.questionIds.length}</span>
        </span>
        <div>
          <Badge tone={q.difficulty === 'Challenge' ? 'amber' : 'purple'}>{q.difficulty}</Badge>
          <button
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
            className={`icon-button ${bookmarked ? 'bookmarked' : ''}`}
            onClick={() =>
              setState((s) => ({
                ...s,
                bookmarks: bookmarked
                  ? s.bookmarks.filter((id) => id !== q.id)
                  : [...s.bookmarks, q.id],
              }))
            }
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <div className="question-topic">
        {q.topic} <span> / </span>
        {q.subtopic}
      </div>
      <h2 className="question-text">{q.text}</h2>
      {q.math && <MathText value={q.math} />}
      <div className="answer-options">
        {q.options.map((option, i) => (
          <button
            key={i}
            disabled={submitted}
            onClick={() => answer(i)}
            className={`answer-option ${selected === i ? 'selected' : ''} ${submitted && i === q.correct ? 'correct' : ''} ${submitted && selected === i && i !== q.correct ? 'incorrect' : ''}`}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            <strong>{option}</strong>
            {submitted && i === q.correct ? (
              <Check size={18} />
            ) : selected === i ? (
              <span className="selection-dot" />
            ) : null}
          </button>
        ))}
      </div>
      {submitted && (
        <div
          className={`solution-box ${saved === q.correct ? 'solution-correct' : 'solution-incorrect'}`}
          role="status"
        >
          <h3>
            {saved === q.correct ? <CircleCheck size={19} /> : <Lightbulb size={19} />}{' '}
            {saved === q.correct
              ? 'That’s right. Nicely reasoned.'
              : 'An opportunity to understand.'}
          </h3>
          <p>{q.solution}</p>
          <div className="solution-meta">
            {q.topic} · {q.source} · Version {q.version}
          </div>
        </div>
      )}
      {!isMock &&
        hints.map((hint, i) => (
          <div className="hint-box" key={i}>
            <Lightbulb size={17} />
            <div>
              <strong>Hint {i + 1} · scripted demo</strong>
              <p>{hint}</p>
            </div>
          </div>
        ))}
      <div className="question-actions">
        <div>
          {!isMock && !submitted && (
            <Button
              variant="ghost"
              disabled={hints.length === 3}
              onClick={async () => {
                const hint = await demoTutor.explain(q, hints.length);
                setHints((h) => [...h, hint]);
              }}
            >
              <Sparkles size={15} />
              {hints.length === 3 ? 'All hints shown' : 'Give me a hint'}
            </Button>
          )}
          <button className="report-button" onClick={() => setReport(true)}>
            <Flag size={13} />
            Report
          </button>
        </div>
        {isMock ? (
          <Button onClick={session.index === session.questionIds.length - 1 ? onFinish : onNext}>
            {session.index === session.questionIds.length - 1
              ? 'Finish rehearsal'
              : 'Next question'}
            <ArrowRight size={16} />
          </Button>
        ) : submitted ? (
          <Button onClick={onNext}>
            {session.index === session.questionIds.length - 1 ? 'See my results' : 'Next question'}
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button disabled={choice === null} onClick={submit}>
            Check answer
            <ArrowRight size={16} />
          </Button>
        )}
      </div>
      {report && (
        <div className="modal-overlay">
          <section role="dialog" aria-modal="true" aria-label="Report question" className="modal">
            <h2>Help make this better.</h2>
            <p>
              Reports are saved locally for future review tooling. Nothing is sent to a remote team.
            </p>
            <label>
              What should we review?
              <textarea
                autoFocus
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Describe an issue with the question or solution..."
              />
            </label>
            <div className="form-actions">
              <Button variant="ghost" onClick={() => setReport(false)}>
                Cancel
              </Button>
              <Button
                disabled={!reportText.trim()}
                onClick={() => {
                  setState((s) => ({ ...s, reports: [...s.reports, `${q.id}: ${reportText}`] }));
                  setReport(false);
                  notify('Report saved on this device.');
                }}
              >
                Save report
              </Button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
export function Results() {
  const { state } = useDemo();
  const session = state.session;
  const attempts = state.attempts.filter((a) => a.sessionId === session?.id);
  const result = score(attempts);
  if (!session?.finished)
    return (
      <Empty
        title="Your results start with practice."
        description="Complete a session to see your answers and the ideas behind them."
        href="/practice"
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="PROGRESS WORTH REFLECTING ON"
        title="Every attempt teaches you something."
        description="Take the insight. Keep the momentum."
        action={
          <Link className="button button-primary" href="/practice">
            Practice again
            <ArrowRight size={16} />
          </Link>
        }
      />
      <div className="results-summary">
        <section className="panel result-main">
          <CircleCheck size={30} />
          <strong>
            {result.correct}
            <span> / {result.total}</span>
          </strong>
          <h2>Raw marks earned</h2>
          <p>
            {session.mode === 'mock' ? 'Timed demo rehearsal' : 'Focused practice'} · No official
            scaled score
          </p>
        </section>
        <section className="panel result-metric">
          <Target size={22} />
          <strong>{result.accuracy}%</strong>
          <span>Accuracy</span>
        </section>
        <section className="panel result-metric">
          <Clock3 size={22} />
          <strong>
            {attempts.length
              ? Math.round(attempts.reduce((s, a) => s + a.seconds, 0) / attempts.length)
              : 0}
            s
          </strong>
          <span>Average time per question</span>
        </section>
      </div>
      <section className="panel review-panel">
        <h2>The thinking behind your answers</h2>
        {attempts.length ? (
          attempts.map((a, i) => {
            const q = questions.find((q) => q.id === a.questionId)!;
            return (
              <details key={a.id}>
                <summary>
                  <span className={a.correct ? 'positive' : 'warm'}>
                    {a.correct ? <Check size={18} /> : <X size={18} />}
                  </span>
                  <div>
                    <strong>
                      {i + 1}. {q.topic}
                    </strong>
                    <p>{q.text}</p>
                  </div>
                  <Badge tone={a.correct ? 'green' : 'amber'}>
                    {a.correct ? 'Correct' : a.selected === -1 ? 'Unanswered' : 'Review'}
                  </Badge>
                </summary>
                <div className="review-detail">
                  <p>Your answer: {a.selected === -1 ? 'Not answered' : q.options[a.selected]}</p>
                  <p>
                    Correct answer: <strong>{q.options[q.correct]}</strong>
                  </p>
                  <p>{q.solution}</p>
                </div>
              </details>
            );
          })
        ) : (
          <p>No answers were submitted. Start another session when you’re ready.</p>
        )}
      </section>
      <div className="info-box">
        <Sparkles size={18} />
        <div>
          Your answers now contribute to topic estimates.{' '}
          <Link href="/study-plan">Regenerate your future plan</Link> to prioritise what needs more
          attention.
        </div>
      </div>
    </>
  );
}
