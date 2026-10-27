'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, ShieldCheck } from 'lucide-react';
import { useDemo } from '@/components/provider';
import { RankCard, RankTrail, Leaderboard } from '@/components/progression';
import { progression } from '@/domain/progression';
import { initialState } from '@/data/demo';
import { Badge, PageHeading } from '@/components/shared';
import { Button } from '@/components/ui/button';
export function Settings({ profile = false }: { profile?: boolean }) {
  const { state, setState, notify } = useDemo();
  const [confirm, setConfirm] = useState(false);
  const progress = progression(state.attempts);
  function download() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stem-studios-progress.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('Your progress export is ready.');
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title={profile ? 'A journey with your name on it.' : 'A little more your way.'}
        description={
          profile
            ? 'Your goals, your time, your next chapter.'
            : 'Thoughtful defaults. Space to make them your own.'
        }
      />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="profile-banner">
            <span className="avatar large-avatar">{state.profile.name[0]}</span>
            <div>
              <h2>{state.profile.name}</h2>
              <p>Local demo account · {state.profile.exam}</p>
            </div>
            <Badge>
              {progress.rank.name} · {progress.xp} XP
            </Badge>
          </div>
          <div className="setting-row">
            <div>
              <h3>Your goals & availability</h3>
              <p>
                {state.profile.weeklyHours} hours per week · target{' '}
                {state.profile.targetScore.toFixed(1)} · {state.profile.modules.join(', ')}
              </p>
            </div>
            <Link className="button button-outline" href="/onboarding">
              Edit profile
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="setting-row">
            <div>
              <h3>Practice timer</h3>
              <p>Show elapsed time during focused practice.</p>
            </div>
            <button
              role="switch"
              aria-checked={state.timer}
              aria-label="Practice timer"
              className={`toggle ${state.timer ? 'enabled' : ''}`}
              onClick={() => setState((s) => ({ ...s, timer: !s.timer }))}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <h3>Take your progress with you</h3>
              <p>Download a JSON copy of your local workspace.</p>
            </div>
            <Button variant="outline" onClick={download}>
              <Download size={15} />
              Export data
            </Button>
          </div>
          <div className="setting-row">
            <div>
              <h3>Start fresh</h3>
              <p>Reset all attempts, plans and personal resources on this device.</p>
            </div>
            <Button variant="outline" onClick={() => setConfirm(true)}>
              Reset demo
            </Button>
          </div>
        </section>
        <aside className="panel settings-note">
          <ShieldCheck size={27} />
          <h2>Your own space.</h2>
          <p>
            No sign-in or external service is required. Progress stays in this browser’s local
            storage. Clearing browser data removes it.
          </p>
          <p>
            There is no cloud backup, real authentication or secure competitive scoring in this
            demo.
          </p>
        </aside>
      </div>
      {confirm && (
        <div className="modal-overlay">
          <section className="modal" role="dialog" aria-modal="true" aria-label="Reset local demo">
            <h2>A fresh starting point?</h2>
            <p>
              This clears your answers, bookmarks, resources and customised plan from this browser.
              Export first if you’d like to keep a copy.
            </p>
            <div className="form-actions">
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Keep my progress
              </Button>
              <Button
                onClick={() => {
                  setState(initialState());
                  setConfirm(false);
                  notify('Demo reset. A fresh start awaits.');
                }}
              >
                Reset local data
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
export function Competitive({ leaderboard = false }: { leaderboard?: boolean }) {
  return (
    <>
      <PageHeading
        eyebrow="LEARN. GROW. LEVEL UP."
        title={
          leaderboard
            ? 'A little competition. A lot of motivation.'
            : 'Your effort deserves a rank.'
        }
        description={
          leaderboard
            ? 'Find your next milestone in our sample study league.'
            : 'Every question builds knowledge. Every new win moves you forward.'
        }
        action={<Badge>Study progression</Badge>}
      />
      {leaderboard ? (
        <Leaderboard />
      ) : (
        <div className="ranks-layout">
          <RankCard />
          <RankTrail />
        </div>
      )}
      <div className="info-box">
        <ShieldCheck size={19} />
        <p>
          Study XP works locally. Live competitive matches and verified global ratings are not
          enabled.
        </p>
      </div>
    </>
  );
}
