'use client';
import { useState } from 'react';
import { BookOpen, Plus, Search, X, ArrowUpRight, FileText, Check } from 'lucide-react';
import { useDemo } from '@/components/provider';
import { Badge, PageHeading } from '@/components/shared';
import { Button } from '@/components/ui/button';
const guides = [
  {
    id: 'guide-algebra',
    title: 'A fresh look at quadratics',
    description: 'Connect roots, coefficients and the shape of a quadratic.',
    topic: 'Algebra',
    type: 'Topic guide',
    body: 'For ax² + bx + c = 0, the sum of the roots is −b/a and their product is c/a. Try expressing α² + β² as (α + β)² − 2αβ. This often avoids solving for the roots individually.',
  },
  {
    id: 'guide-proof',
    title: 'Think clearly. Reason carefully.',
    description: 'A short guide to implications, converses and contrapositives.',
    topic: 'Logic & proof',
    type: 'Revision notes',
    body: 'The converse of P ⇒ Q is Q ⇒ P; it need not be true. The contrapositive is not Q ⇒ not P and is logically equivalent to the original implication. For an integer, “not even” is the same as “odd”. Test a proposed converse with a counterexample.',
  },
  {
    id: 'guide-practice',
    title: 'Make your mistakes useful',
    description: 'Turn an error log into your most useful revision resource.',
    topic: 'Study skills',
    type: 'Topic guide',
    body: 'After a wrong answer, write down the first step you misunderstood. Label it as a concept gap, a calculation error, or a time decision. Reattempt the problem after a gap, then explain the solution without looking. Understanding the method matters more than memorising an answer.',
  },
];
export function Resources() {
  const { state, setState, notify } = useDemo();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All resources');
  const [reading, setReading] = useState<(typeof guides)[number] | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const items = [...guides, ...state.resources];
  const filtered = items.filter(
    (r) =>
      `${r.title} ${r.topic}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === 'All resources' ||
        (filter === 'My resources' && state.resources.some((x) => x.id === r.id)) ||
        r.type === filter),
  );
  return (
    <>
      <PageHeading
        eyebrow="GOOD IDEAS, WITHIN REACH"
        title="Build your understanding."
        description="A considered collection for the concepts you want to make your own."
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} />
            Add a resource
          </Button>
        }
      />
      <div className="bank-toolbar">
        <div className="input-with-icon">
          <Search size={17} />
          <input
            aria-label="Search resources"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a topic, guide or idea..."
          />
        </div>
      </div>
      <div className="filter-tabs">
        {['All resources', 'Topic guide', 'Revision notes', 'My resources'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'active' : ''}>
            {f}
          </button>
        ))}
      </div>
      <div className="resources-grid">
        {filtered.map((r) => (
          <article className="panel resource-card" key={r.id}>
            <div className="resource-icon">
              <FileText size={25} />
            </div>
            <Badge tone="muted">{r.type}</Badge>
            <h2>{r.title}</h2>
            <p>{r.description}</p>
            <span className="resource-topic">{r.topic}</span>
            {'body' in r ? (
              <Button variant="ghost" onClick={() => setReading(r)}>
                Read guide
                <ArrowUpRight size={16} />
              </Button>
            ) : (
              <a className="button button-ghost" href={r.url} target="_blank" rel="noreferrer">
                Open resource
                <ArrowUpRight size={16} />
              </a>
            )}
            <small>
              {'body' in r ? 'Axiom original · demo content' : 'Added by you · unverified'}
            </small>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <BookOpen size={28} />
          <h3>A little room for your own discoveries.</h3>
          <p>Add a personal resource or try another search.</p>
        </div>
      )}
      <div className="panel official-resources">
        <div className="resource-icon">
          <Check size={23} />
        </div>
        <div>
          <h3>Official material deserves a verified source.</h3>
          <p>
            Official specifications, sample papers and dates will be added after source
            verification. This demo does not reproduce official exam material.
          </p>
        </div>
        <Badge tone="muted">Coming later</Badge>
      </div>
      {reading && (
        <div className="modal-overlay" onMouseDown={() => setReading(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={reading.title}
            className="modal reading-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close guide"
              className="icon-button modal-close"
              onClick={() => setReading(null)}
            >
              <X size={18} />
            </button>
            <Badge>{reading.topic}</Badge>
            <h2>{reading.title}</h2>
            <p>{reading.body}</p>
            <small>Axiom original · Educational demo note</small>
          </section>
        </div>
      )}
      {adding && (
        <div className="modal-overlay">
          <form
            className="modal"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const parsed = new URL(url);
                if (!['https:', 'http:'].includes(parsed.protocol))
                  throw new Error('Use an http or https URL.');
                if (!title.trim()) throw new Error('Give your resource a title.');
                setState((s) => ({
                  ...s,
                  resources: [
                    ...s.resources,
                    {
                      id: crypto.randomUUID(),
                      title: title.trim(),
                      url: parsed.href,
                      description: 'A resource from your personal collection.',
                      topic: 'Personal collection',
                      type: 'External resource',
                    },
                  ],
                }));
                setAdding(false);
                setTitle('');
                setUrl('');
                notify('Resource added to your collection.');
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <h2>Keep a good resource close.</h2>
            <label>
              Title
              <input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              Resource URL
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit">Add resource</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
