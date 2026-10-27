'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Send, Sparkles, User, Lightbulb } from 'lucide-react';
import { Badge, PageHeading } from '@/components/shared';
import { Button } from '@/components/ui/button';
const responses: Record<string, string> = {
  quadratic:
    'Start with the relationship between a quadratic and its roots. For x² − 6x + 7 = 0, the roots add to 6 and multiply to 7. How could you use (α + β)² to find α² + β²? Try expanding the square first.',
  proof:
    'Think of an implication as “if P, then Q”. Its contrapositive is “if not Q, then not P”. These say the same thing from different directions. A converse reverses the implication without negating it, and needs its own proof.',
  calculus:
    'A stationary point has zero gradient. Differentiate the function, set the derivative equal to zero, and solve. Then check any conditions in the question, such as x being positive.',
  plan: 'Choose one topic that feels uncertain. Spend one session on a few questions, then a second session reviewing the first step of each mistake. Your study plan can spread this practice across the week.',
};
export function Tutor() {
  const [messages, setMessages] = useState<{ role: 'user' | 'tutor'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const send = (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    const reply =
      lower.includes('quadrat') || lower.includes('algebra')
        ? responses.quadratic
        : lower.includes('proof') || lower.includes('logic')
          ? responses.proof
          : lower.includes('calculus') || lower.includes('different')
            ? responses.calculus
            : lower.includes('plan')
              ? responses.plan
              : 'This is a scripted preview, so I can’t reason about arbitrary questions yet. Try the quadratic, logic, calculus or study-plan examples below. In practice, each question has three authored hints and a worked solution.';
    setMessages((m) => [...m, { role: 'user', text }, { role: 'tutor', text: reply }]);
    setInput('');
  };
  return (
    <>
      <PageHeading
        eyebrow="A FRESH WAY TO THINK"
        title="A little guidance. Your own understanding."
        description="Explore how a future study companion could help you work through a concept."
        action={<Badge tone="amber">Scripted demo · no live AI</Badge>}
      />
      <div className="tutor-layout">
        <section className="panel tutor-chat">
          <div className="chat-top">
            <span className="tutor-callout-icon">
              <Sparkles size={19} />
            </span>
            <div>
              <h3>Axiom study companion</h3>
              <p>Example conversations · authored responses</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
              Clear
            </Button>
          </div>
          <div className="chat-messages" aria-live="polite">
            {!messages.length ? (
              <div className="chat-welcome">
                <div className="tutor-orb">
                  <Sparkles size={32} />
                </div>
                <h2>Let’s find the next step.</h2>
                <p>
                  Sometimes a different perspective makes all the difference.
                  <br />
                  Choose an example to explore this preview.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div className={`chat-message ${m.role}`} key={i}>
                  <span>{m.role === 'tutor' ? <Sparkles size={16} /> : <User size={16} />}</span>
                  <div>
                    <small>{m.role === 'tutor' ? 'Study companion · scripted' : 'You'}</small>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="suggested-prompts">
            {[
              'Help me with quadratics',
              'Explain contrapositive proof',
              'Find a stationary point',
              'Help me plan my study',
            ].map((p) => (
              <button key={p} onClick={() => send(p)}>
                {p}
                <ArrowRight size={12} />
              </button>
            ))}
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              aria-label="Message study companion"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Try a demo question..."
            />
            <Button aria-label="Send message" size="sm" type="submit" disabled={!input.trim()}>
              <Send size={17} />
            </Button>
          </form>
          <p className="chat-disclaimer">
            No model is connected. Responses are local examples, not AI-generated guidance.
          </p>
        </section>
        <aside className="panel tutor-principles">
          <Lightbulb size={25} />
          <h2>Keep the thinking yours.</h2>
          <p>Good guidance starts with a nudge, then builds towards a deeper explanation.</p>
          {['A conceptual nudge', 'A more specific direction', 'A detailed explanation'].map(
            (s, i) => (
              <div key={s}>
                <span>0{i + 1}</span>
                <strong>{s}</strong>
              </div>
            ),
          )}
          <Link href="/practice" className="button button-outline">
            Try progressive hints
            <ArrowRight size={15} />
          </Link>
        </aside>
      </div>
    </>
  );
}
