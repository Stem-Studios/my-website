'use client';
import { useState } from 'react';
import { ArrowUpRight, Bookmark, Check, Search, SlidersHorizontal } from 'lucide-react';
import { questions } from '@/data/questions';
import { useDemo } from '@/components/provider';
import { Badge, Empty, PageHeading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { useStartSession } from './practice';
export function QuestionBank() {
  const { state, setState } = useDemo();
  const start = useStartSession();
  const [query, setQuery] = useState('');
  const [exam, setExam] = useState(state.profile.exam as string);
  const [topic, setTopic] = useState('All topics');
  const [module, setModule] = useState('All modules');
  const [difficulty, setDifficulty] = useState('All levels');
  const [status, setStatus] = useState('All questions');
  const topics = [
    ...new Set(
      questions.filter((q) => exam === 'All exams' || q.exam === exam).map((q) => q.topic),
    ),
  ];
  const filtered = questions.filter((q) => {
    const attempts = state.attempts.filter((a) => a.questionId === q.id);
    return (
      (exam === 'All exams' || q.exam === exam) &&
      (module === 'All modules' || q.module === module) &&
      (topic === 'All topics' || q.topic === topic) &&
      (difficulty === 'All levels' || q.difficulty === difficulty) &&
      `${q.topic} ${q.module} ${q.text}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === 'All questions' ||
        (status === 'Bookmarked' && state.bookmarks.includes(q.id)) ||
        (status === 'Unanswered' && !attempts.length) ||
        (status === 'Needs review' && attempts.some((a) => !a.correct)) ||
        (status === 'Verified' && q.verified))
    );
  });
  return (
    <>
      <PageHeading
        eyebrow="CURIOSITY, MEET POSSIBILITY"
        title="Find your next good question."
        description="A small, carefully authored collection. Every question is a chance to understand more."
        action={<Badge tone="muted">{questions.length} original demo questions</Badge>}
      />
      <div className="bank-toolbar">
        <div className="input-with-icon">
          <Search size={17} />
          <input
            aria-label="Search questions"
            placeholder="Search questions, topics, modules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by exam"
          value={exam}
          onChange={(e) => {
            setExam(e.target.value);
            setTopic('All topics');
            setModule('All modules');
          }}
        >
          {['All exams', 'TMUA', 'ESAT'].map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <select
          aria-label="Filter by module"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        >
          <option>All modules</option>
          {[
            ...new Set(
              questions.filter((q) => exam === 'All exams' || q.exam === exam).map((q) => q.module),
            ),
          ].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          aria-label="Filter by topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option>All topics</option>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          aria-label="Filter by difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {['All levels', 'Foundation', 'Intermediate', 'Challenge'].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="filter-tabs">
        {['All questions', 'Unanswered', 'Needs review', 'Bookmarked', 'Verified'].map((s) => (
          <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>
            {s}
          </button>
        ))}
        <span>{filtered.length} questions</span>
      </div>
      <div className="question-bank-grid">
        {filtered.map((q) => (
          <article className="panel bank-question" key={q.id}>
            <div className="bank-question-top">
              <span>
                {q.exam} · {q.module}
              </span>
              <button
                className={`icon-button ${state.bookmarks.includes(q.id) ? 'bookmarked' : ''}`}
                aria-label={`Bookmark ${q.id}`}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    bookmarks: s.bookmarks.includes(q.id)
                      ? s.bookmarks.filter((id) => id !== q.id)
                      : [...s.bookmarks, q.id],
                  }))
                }
              >
                <Bookmark
                  size={17}
                  fill={state.bookmarks.includes(q.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>
            <div className="question-topic">
              {q.topic} <span>/</span> {q.subtopic}
            </div>
            <h3>{q.text}</h3>
            <div className="bank-question-bottom">
              <Badge tone={q.difficulty === 'Challenge' ? 'amber' : 'purple'}>{q.difficulty}</Badge>
              <span>
                <Check size={12} />
                Original · reviewed
              </span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Practice ${q.id}`}
                onClick={() => start([q])}
              >
                <ArrowUpRight size={18} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <Empty
          title="A fresh perspective might help."
          description="Try another topic, clear your search, or change the filters."
        />
      )}
      <div className="content-note">
        <SlidersHorizontal size={16} />
        <p>
          Every question in this collection is original and includes reviewed answers, progressive
          hints and a worked solution.
        </p>
      </div>
    </>
  );
}
