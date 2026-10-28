'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MathText, Meter, PageHeading } from '@/components/shared';
import { Trophy, Swords, Check, Volume2, VolumeX } from 'lucide-react';
import { keepLatestMatch } from '@/domain/arena-state';
type RaceQuestion = { text: string; math?: string; topic: string; options: string[] };
type Match = {
  id: string;
  room_code: string | null;
  player_one: string;
  player_two: string | null;
  names: Record<string, string>;
  status: string;
  ready: string[];
  question_count: number;
  scores: Record<string, number>;
  correct_counts: Record<string, number>;
  positions: Record<string, number>;
  heartbeats: Record<string, string>;
  starts_at: string | null;
  deadline: string | null;
  winner: string | null;
  result_reason: string | null;
  ranked: boolean;
};
export function Arena() {
  const client = useMemo(() => createClient(), []);
  const [user, setUser] = useState('');
  const [match, setMatch] = useState<Match | null>(null);
  const [exam, setExam] = useState('TMUA');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [ranked, setRanked] = useState(false);
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchStarted, setSearchStarted] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [offset, setOffset] = useState(0);
  const [sound, setSound] = useState(false);
  const [history, setHistory] = useState<Match[]>([]);
  const [feedback, setFeedback] = useState('');
  const [catalogue, setCatalogue] = useState<
    {
      exam: string;
      difficulty: string;
      verified_count: number;
      required_count: number;
      race_seconds: number;
    }[]
  >([]);
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<{
    matchId: string;
    index: number;
    question: RaceQuestion | null;
  } | null>(null);
  async function load() {
    const {
      data: { user: student },
    } = await client.auth.getUser();
    if (!student) return;
    setUser(student.id);
    const { data, error } = await client
      .from('multiplayer_matches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      setError(
        'Arena is unavailable. The accounts/Arena migrations and server-only question pool must be configured.',
      );
      return;
    }
    const rows = (data ?? []) as Match[];
    setHistory(rows.filter((m) => m.status === 'finished'));
    const active = rows.find((m) => !['finished', 'cancelled'].includes(m.status));
    if (active) setMatch(active);
  }
  useEffect(() => {
    // load updates state after authentication/database I/O, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    void client.rpc('arena_catalogue').then(({ data, error }) => {
      setCatalogueLoaded(true);
      if (error) {
        setError('Arena availability could not be checked. Please retry later.');
        return;
      }
      setCatalogue(data ?? []);
    });
    const start = Date.now();
    void client.rpc('arena_clock').then(({ data }) => {
      if (data) setOffset(new Date(data).getTime() - (start + Date.now()) / 2);
    });
  }, [client]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 250);
    return () => clearInterval(t);
  }, [offset]);
  async function lobby(action: string) {
    setBusy(true);
    setError('');
    try {
      const { data, error } = await client.rpc('arena_lobby', {
        action,
        exam_choice: exam,
        difficulty_choice: difficulty,
        ranked_choice: ranked,
        code,
      });
      if (error) throw error;
      if (data) {
        const result = await client.from('multiplayer_matches').select('*').eq('id', data).single();
        if (result.error) throw result.error;
        setMatch((previous) => keepLatestMatch(previous, result.data));
        setSearching(false);
      } else if (action === 'queue') {
        setSearching(true);
        if (!searching) setSearchStarted(Date.now());
      } else setSearching(false);
    } catch (e) {
      setSearching(false);
      setError(
        e instanceof Error
          ? e.message
          : ((e as { message?: string }).message ?? 'Arena request failed.'),
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!searching) return;
    const timer = setInterval(() => {
      if (Date.now() - searchStarted > 120000) {
        void lobby('cancel');
        setError('Search timed out. Try again when another student is online.');
      } else void lobby('queue');
    }, 4000);
    return () => clearInterval(timer);
  }, [searching, searchStarted, exam, difficulty, ranked]); // eslint-disable-line react-hooks/exhaustive-deps
  async function play(action: string, index?: number, choice?: number) {
    if (!match) return false;
    const { error } = await client.rpc('arena_play', {
      mid: match.id,
      action,
      question_index: index ?? null,
      choice: choice ?? null,
    });
    if (error) {
      setError(error.message);
      return false;
    }
    const result = await client.from('multiplayer_matches').select('*').eq('id', match.id).single();
    if (result.error) {
      setError(
        'The server received the request, but the latest match state could not be loaded. Reconnecting…',
      );
      return false;
    }
    if (result.data) setMatch((previous) => keepLatestMatch(previous, result.data));
    return true;
  }
  useEffect(() => {
    if (!match?.id || ['finished', 'cancelled'].includes(match.status)) return;
    const channel = client
      .channel(`match:${match.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_matches',
          filter: `id=eq.${match.id}`,
        },
        (event) => setMatch((previous) => keepLatestMatch(previous, event.new as Match)),
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR')
          setError('Realtime disconnected. Reconnecting with periodic server updates…');
      });
    const timer = setInterval(() => void play('heartbeat'), 5000);
    // The state update follows the server RPC and subsequent database read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void play('heartbeat');
    return () => {
      clearInterval(timer);
      void client.removeChannel(channel);
    };
  }, [match?.id, match?.status === 'finished', match?.status === 'cancelled']); // eslint-disable-line react-hooks/exhaustive-deps
  async function submit(index: number, choice: number) {
    if (busy) return;
    setBusy(true);
    try {
      const accepted = await play('answer', index, choice);
      if (!accepted) return;
      setFeedback('Answer recorded by the server.');
      if (sound) {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.connect(gain);
        gain.connect(context.destination);
        gain.gain.value = 0.035;
        oscillator.frequency.value = 540;
        oscillator.start();
        oscillator.stop(context.currentTime + 0.08);
        oscillator.onended = () => void context.close();
      }
    } catch {
      setError('An optional sound could not play. Your submitted answer remains saved.');
    } finally {
      setBusy(false);
    }
  }
  const opponent = match ? (match.player_one === user ? match.player_two : match.player_one) : null;
  const index = match?.positions[user] ?? 0;
  const matchId = match?.id;
  const countdown = match?.starts_at
    ? Math.ceil((new Date(match.starts_at).getTime() - now) / 1000)
    : 0;
  const seconds = match?.deadline
    ? Math.max(0, Math.ceil((new Date(match.deadline).getTime() - now) / 1000))
    : 0;
  const questionActive = Boolean(
    matchId && countdown <= 0 && match && ['countdown', 'playing'].includes(match.status),
  );
  const q =
    questionActive && currentQuestion?.matchId === matchId && currentQuestion?.index === index
      ? currentQuestion.question
      : null;
  useEffect(() => {
    if (!matchId || !questionActive) return;
    let active = true;
    async function question() {
      const { data, error } = await client.rpc('arena_question', { mid: matchId });
      if (active && error) setError('Your current question could not be loaded. Reconnecting…');
      if (active && !error && data) setCurrentQuestion({ ...data, matchId: matchId! });
    }
    void question();
    const timer = setInterval(() => void question(), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [client, matchId, index, questionActive]);
  const availableMode = catalogue.find((m) => m.exam === exam && m.difficulty === difficulty);
  const modeReady = Boolean(
    availableMode && availableMode.verified_count >= availableMode.required_count,
  );
  return (
    <>
      <PageHeading
        eyebrow="TWO MINDS. ONE CHALLENGE."
        title="Arena"
        description="Real students. Shared questions. Every answer checked by the server."
        action={
          <button
            className="button button-outline"
            aria-label={sound ? 'Mute sounds' : 'Enable sounds'}
            onClick={() => setSound(!sound)}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        }
      />
      {error && (
        <div className="info-box" role="alert">
          {error}
        </div>
      )}
      {!match || match.status === 'cancelled' ? (
        <>
          <div className="arena-lobby-grid">
            <section className="panel setup-panel">
              <Swords size={30} />
              <h2>Find your next challenge</h2>
              <label>
                Exam
                <select value={exam} onChange={(e) => setExam(e.target.value)} disabled={searching}>
                  <option>TMUA</option>
                  <option>ESAT</option>
                </select>
              </label>
              <label>
                Difficulty
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={searching}
                >
                  <option>Foundation</option>
                  <option>Intermediate</option>
                  <option>Challenge</option>
                </select>
              </label>
              <label className="arena-check">
                <input
                  type="checkbox"
                  checked={ranked}
                  onChange={(e) => setRanked(e.target.checked)}
                  disabled={searching}
                />
                Ranked · Elo starts at 1000
              </label>
              <p>
                {availableMode?.required_count ?? 10} questions ·{' '}
                {availableMode ? Math.round(availableMode.race_seconds / 60) : 5} minutes ·
                90-second reconnect grace
              </p>
              {!modeReady && (
                <p role="status">
                  {catalogueLoaded
                    ? 'This mode is not ready: it needs enough independently verified, server-only questions.'
                    : 'Checking question availability…'}
                </p>
              )}
              {searching ? (
                <div role="status" className="arena-search">
                  <span />
                  Looking for another student…
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => void lobby('cancel')}
                  >
                    Cancel search
                  </button>
                </div>
              ) : (
                <button
                  className="button button-primary"
                  disabled={busy || !modeReady}
                  onClick={() => void lobby('queue')}
                >
                  Quick match
                </button>
              )}
            </section>
            <section className="panel setup-panel">
              <h2>Meet a friend</h2>
              <p>
                Create a room using your selected exam and difficulty, or enter your friend’s code.
              </p>
              <button
                className="button button-primary"
                disabled={busy || searching || !modeReady}
                onClick={() => void lobby('create')}
              >
                Create private room
              </button>
              <label>
                Room code
                <input
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="8-character code"
                />
              </label>
              <button
                className="button button-outline"
                disabled={busy || searching || code.length !== 8}
                onClick={() => void lobby('join')}
              >
                Join room
              </button>
            </section>
          </div>
          <section className="panel arena-history">
            <h2>Your match history</h2>
            {history.length ? (
              history.map((m) => (
                <div key={m.id}>
                  <span>
                    {m.winner === user ? 'Victory' : m.winner ? 'Defeat' : 'Draw'} ·{' '}
                    {m.ranked ? 'Ranked' : 'Unranked'}
                  </span>
                  <strong>{m.scores[user] ?? 0} points</strong>
                  <button className="text-link" onClick={() => setMatch(m)}>
                    View result
                  </button>
                </div>
              ))
            ) : (
              <p>No completed matches yet. Your first challenge is waiting.</p>
            )}
          </section>
        </>
      ) : (
        <section className="panel arena-match">
          <div className="arena-versus">
            {[user, opponent].map((id, i) => (
              <div key={i}>
                <span className="avatar">
                  {id ? (match.names[id] ?? 'S').slice(0, 2).toUpperCase() : '?'}
                </span>
                <h2>{id ? (match.names[id] ?? 'Student') : 'Waiting for a friend'}</h2>
                <strong>{id ? (match.scores[id] ?? 0) : 0} points</strong>
                <Meter value={id ? ((match.positions[id] ?? 0) / match.question_count) * 100 : 0} />
                <small>
                  {id ? (match.positions[id] ?? 0) : 0}/{match.question_count} answered{' '}
                  {id && match.ready.includes(id) && match.status === 'lobby' ? '· Ready' : ''}
                </small>
              </div>
            ))}
            <span>VS</span>
          </div>
          {match.status === 'finished' ? (
            <div className="arena-result">
              <Trophy size={44} />
              <h2>
                {match.winner === user
                  ? 'Victory. Well reasoned.'
                  : match.winner
                    ? 'A challenge to learn from.'
                    : 'A well-matched draw.'}
              </h2>
              <p>{match.result_reason}</p>
              <p>
                {match.correct_counts[user] ?? 0} correct · {match.scores[user] ?? 0} points
              </p>
              <button
                className="button button-primary"
                onClick={() => {
                  setMatch(null);
                  void load();
                }}
              >
                Return to Arena / new match
              </button>
              <p>For a rematch, create a new private room and share its code.</p>
            </div>
          ) : match.status === 'lobby' ? (
            <div className="arena-ready">
              <p>Room code</p>
              <strong>{match.room_code ?? 'Quick match'}</strong>
              <p>
                {opponent
                  ? 'Both players are here. Ready when you are.'
                  : 'Share this code with a friend on another account.'}
              </p>
              <button
                className="button button-primary"
                disabled={busy || match.ready.includes(user)}
                onClick={() => void play('ready')}
              >
                {match.ready.includes(user) ? (
                  <>
                    <Check size={16} />
                    Ready
                  </>
                ) : (
                  'Ready up'
                )}
              </button>
            </div>
          ) : countdown > 0 ? (
            <div className="arena-countdown" role="status">
              <strong>{countdown}</strong>
              <p>Get ready. Same questions. Same start.</p>
            </div>
          ) : (
            <div className="arena-race">
              <div className="arena-race-heading">
                <span>{seconds}s remaining</span>
                <strong>
                  Question {Math.min(index + 1, match.question_count)} / {match.question_count}
                </strong>
              </div>
              {q && seconds > 0 ? (
                <>
                  <span className="eyebrow">{q.topic}</span>
                  <h2>{q.text}</h2>
                  {q.math && <MathText value={q.math} />}
                  <div className="answer-options">
                    {q.options.map((option, i) => (
                      <button
                        key={i}
                        className="answer-option"
                        disabled={busy}
                        onClick={() => void submit(index, i)}
                      >
                        <span>{String.fromCharCode(65 + i)}</span>
                        <strong>{option}</strong>
                      </button>
                    ))}
                  </div>
                  <p role="status">{feedback}</p>
                </>
              ) : (
                <p role="status">
                  {seconds
                    ? index >= match.question_count
                      ? 'Your race is complete. Waiting for your opponent…'
                      : 'Loading your next question from the server…'
                    : 'Time is up. Waiting for the server result…'}
                </p>
              )}
            </div>
          )}
          {!['finished', 'cancelled'].includes(match.status) && (
            <button
              className="button button-ghost"
              onClick={() => {
                if (confirm('Leave this match? An active race will be forfeited.'))
                  void play('leave');
              }}
            >
              Leave / forfeit
            </button>
          )}
        </section>
      )}
    </>
  );
}

export function LiveLeaderboard({ compact = false }: { compact?: boolean }) {
  const client = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<
    { username: string; rating: number; wins: number; losses: number; draws: number }[]
  >([]);
  const [status, setStatus] = useState('Loading rankings…');
  useEffect(() => {
    void client.rpc('arena_leaderboard').then(({ data, error }) => {
      if (error) {
        setStatus('Rankings unavailable. Apply the Arena migration to enable this feature.');
        return;
      }
      setRows(data ?? []);
      setStatus('No completed matches yet. Be the first to compete.');
    });
  }, [client]);
  return (
    <>
      {!compact && (
        <PageHeading
          eyebrow="EARNED, NOT INVENTED"
          title="The Arena leaderboard"
          description="Real players and completed matches. No sample opponents."
        />
      )}
      <section className="panel league-card">
        {compact && <h2>Arena rankings</h2>}
        {rows.length ? (
          rows.map((r, i) => (
            <div className="league-row" key={r.username}>
              <strong>{i + 1}</strong>
              <div>
                <strong>{r.username}</strong>
                <span>
                  {r.wins} wins · {r.losses} losses · {r.draws} draws
                </span>
              </div>
              <strong>{r.rating} Elo</strong>
            </div>
          ))
        ) : (
          <p role="status">{status}</p>
        )}
      </section>
    </>
  );
}
