'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, GraduationCap, Sparkles } from 'lucide-react';
import { useDemo } from '@/components/provider';
import { PageHeading, Badge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { profileSchema, type Profile } from '@/domain/types';
import { generatePlan } from '@/domain/learning';
import { questions } from '@/data/questions';
export function Onboarding() {
  const { state, setState, notify } = useDemo();
  const [form, setForm] = useState<Profile>(state.profile);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const finish = () => {
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    try {
      const tasks = generatePlan(result.data, questions, state.attempts);
      setState((s) => ({ ...s, profile: result.data, onboarded: true, tasks }));
      notify('Your personalised study plan is ready.');
      router.push('/study-plan');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title="Your ambition. Your starting point."
        description="A few details help us build a plan around your life."
      />
      <div className="onboarding-layout">
        <aside className="onboarding-steps">
          {['Your exam', 'Your goals', 'Your rhythm'].map((s, i) => (
            <div key={s} className={step === i ? 'current' : step > i ? 'done' : ''}>
              <span>{step > i ? <Check size={15} /> : i + 1}</span>
              <div>
                <strong>{s}</strong>
                <p>
                  {
                    ['Choose your path', 'Tell us where you’re headed', 'Find a sustainable pace'][
                      i
                    ]
                  }
                </p>
              </div>
            </div>
          ))}
          <div className="onboarding-note">
            <Sparkles size={20} />
            <p>
              No two journeys are the same. Your plan is editable, and your progress will help guide
              your next steps.
            </p>
            <Badge tone="muted">Stored on this device</Badge>
          </div>
        </aside>
        <section className="panel onboarding-form">
          <div className="eyebrow">STEP 0{step + 1} / 03</div>
          <h2>
            {
              [
                'Let’s find your focus.',
                'Give your ambition a direction.',
                'Make progress fit your life.',
              ][step]
            }
          </h2>
          {step === 0 && (
            <>
              <label>
                Your first name
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  maxLength={60}
                />
              </label>
              <label>Which exam are you preparing for?</label>
              <div className="exam-cards">
                {(['TMUA', 'ESAT'] as const).map((exam) => (
                  <button
                    key={exam}
                    className={form.exam === exam ? 'selected' : ''}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        exam,
                        modules:
                          exam === 'TMUA'
                            ? ['Mathematics']
                            : ['Mathematics 1', 'Mathematics 2', 'Physics'],
                      }))
                    }
                  >
                    <GraduationCap size={24} />
                    <strong>{exam}</strong>
                    <span>
                      {exam === 'TMUA' ? 'Mathematics & reasoning' : 'Mathematics & sciences'}
                    </span>
                    {form.exam === exam && <Check size={17} />}
                  </button>
                ))}
              </div>
              {form.exam === 'ESAT' && (
                <>
                  <label>Choose your modules</label>
                  <div className="module-options">
                    {['Mathematics 1', 'Mathematics 2', 'Physics', 'Chemistry', 'Biology'].map(
                      (m) => (
                        <label key={m}>
                          <input
                            type="checkbox"
                            checked={form.modules.includes(m)}
                            onChange={() =>
                              update(
                                'modules',
                                form.modules.includes(m)
                                  ? form.modules.filter((x) => x !== m)
                                  : [...form.modules, m],
                              )
                            }
                          />
                          {m}
                        </label>
                      ),
                    )}
                  </div>
                </>
              )}
            </>
          )}
          {step === 1 && (
            <>
              <div className="form-grid">
                <label>
                  Current practice score
                  <select
                    value={form.currentScore ?? ''}
                    onChange={(e) =>
                      update('currentScore', e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">I don’t know yet</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>
                        {n.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Target score
                  <select
                    value={form.targetScore}
                    onChange={(e) => update('targetScore', Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>
                        {n.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="field-note">
                Self-reported scores are context, not verified measurements. A target is a
                direction, never a guaranteed result.
              </p>
              {form.currentScore === null && (
                <div className="info-box">
                  <Sparkles size={17} />
                  <span>Start with a short practice diagnostic to find your focus areas.</span>
                </div>
              )}
              <label>
                When is your exam?
                <input
                  type="date"
                  min={new Date().toLocaleDateString('en-CA')}
                  value={form.examDate}
                  onChange={(e) => update('examDate', e.target.value)}
                />
              </label>
              <p className="field-note">
                Enter your booked date or an estimated date. This demo does not supply official exam
                dates.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <label>
                Weekly study time <strong>{form.weeklyHours} hours</strong>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={form.weeklyHours}
                  onChange={(e) => update('weeklyHours', Number(e.target.value))}
                />
              </label>
              <div className="range-labels">
                <span>1 hour</span>
                <span>24 hours</span>
              </div>
              <label>
                How confident are you feeling?
                <select
                  value={form.confidence}
                  onChange={(e) => update('confidence', e.target.value as Profile['confidence'])}
                >
                  {['Starting out', 'Building confidence', 'Exam ready'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <div className="topic-confidence">
                <h3>How do the individual topics feel?</h3>
                <p className="field-note">
                  Optional self-reflection, separate from measured mastery.
                </p>
                {[
                  ...new Set(
                    questions
                      .filter(
                        (q) =>
                          q.exam === form.exam &&
                          (form.exam === 'TMUA' || form.modules.includes(q.module)),
                      )
                      .map((q) => q.topic),
                  ),
                ].map((topic) => (
                  <label key={topic}>
                    {topic}
                    <select
                      value={form.topicConfidence[topic] ?? 'Medium'}
                      onChange={(e) =>
                        update('topicConfidence', {
                          ...form.topicConfidence,
                          [topic]: e.target.value as 'Low' | 'Medium' | 'High',
                        })
                      }
                    >
                      {['Low', 'Medium', 'High'].map((level) => (
                        <option key={level}>{level}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <label>
                Tell us a little about your preparation
                <textarea
                  value={form.experience}
                  maxLength={400}
                  onChange={(e) => update('experience', e.target.value)}
                  placeholder="Resources you’ve used, topics you find tricky..."
                />
              </label>
              <div className="info-box">
                <Sparkles size={17} />
                <span>
                  Your initial plan uses a rules-based engine. Completing practice helps prioritise
                  topics with lower demonstrated accuracy.
                </span>
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => {
                setError('');
                setStep(step - 1);
              }}
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <Button
              onClick={() => {
                setError('');
                if (step === 0 && (!form.name.trim() || !form.modules.length)) {
                  setError('Add your name and at least one module.');
                  return;
                }
                if (
                  step === 1 &&
                  (!form.examDate || new Date(`${form.examDate}T23:59:59`) < new Date())
                ) {
                  setError('Choose a future exam date.');
                  return;
                }
                if (step < 2) setStep(step + 1);
                else finish();
              }}
            >
              {step === 2 ? 'Build my study plan' : 'Continue'}
              <ArrowRight size={16} />
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
