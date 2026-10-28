'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { initialState } from '@/data/demo';
import type { DemoState } from '@/domain/types';
import { persistedSchema } from '@/services/storage';
import { Check, X } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
const Context = createContext<{
  state: DemoState;
  setState: Dispatch<SetStateAction<DemoState>>;
  notify: (text: string) => void;
  ready: boolean;
} | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const [syncError, setSyncError] = useState('');
  const [saving, setSaving] = useState(false);
  const current = useRef(state);
  useEffect(() => {
    current.current = state;
  }, [state]);
  useEffect(() => {
    let stopped = false,
      revision = 0,
      userId = '',
      saved = '',
      inFlight = false,
      blocked = false;
    async function load() {
      try {
        const response = await fetch('/api/progress/', { cache: 'no-store' });
        if (response.status === 401) {
          const publicPage =
            window.location.pathname === '/' ||
            /^\/(features|login|signup|reset-password|auth)(\/|$)/.test(window.location.pathname);
          if (!publicPage && !stopped) {
            window.location.replace('/login/');
            return;
          }
          if (!stopped) setReady(true);
          return;
        }
        if (!response.ok)
          throw Error('Cloud progress unavailable. Ask the owner to apply the accounts migration.');
        const data = await response.json();
        const loaded = persistedSchema.parse(data.state);
        if (stopped) return;
        revision = data.revision;
        userId = data.userId;
        saved = JSON.stringify(loaded);
        current.current = loaded;
        setState(loaded);
        setReady(true);
      } catch (error) {
        if (!stopped)
          setSyncError(error instanceof Error ? error.message : 'Unable to load cloud progress.');
      }
    }
    void load();
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event, session) => {
      if (stopped || !userId) return;
      if (event === 'SIGNED_OUT' || (session && session.user.id !== userId)) {
        blocked = true;
        userId = '';
        current.current = initialState();
        setState(current.current);
        setReady(false);
        window.location.replace('/login/');
      }
    });
    const timer = setInterval(async () => {
      if (stopped || !userId || inFlight || blocked) return;
      const snapshot = JSON.stringify(current.current);
      if (snapshot === saved) return;
      inFlight = true;
      setSaving(true);
      try {
        const response = await fetch('/api/progress/', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, revision, state: JSON.parse(snapshot) }),
        });
        if (!response.ok) {
          blocked = true;
          throw Error(
            'Cloud save stopped. Another device may have changed this workspace. Export your current progress in Settings before reloading.',
          );
        }
        const data = await response.json();
        revision = data.revision;
        saved = snapshot;
        if (!stopped) setSyncError('');
      } catch (error) {
        if (!stopped)
          setSyncError(
            error instanceof Error
              ? error.message
              : 'Save failed. Keep this page open and export your progress.',
          );
      } finally {
        inFlight = false;
        if (!stopped) setSaving(false);
      }
    }, 1000);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (userId && (inFlight || JSON.stringify(current.current) !== saved)) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      stopped = true;
      clearInterval(timer);
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <Context.Provider value={{ state, setState, notify: setToast, ready }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      {saving && (
        <div className="cloud-status" role="status">
          Saving to your account…
        </div>
      )}
      {syncError && (
        <div className="cloud-error" role="alert">
          {syncError} <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}
      {toast && (
        <div role="status" className="toast">
          <Check size={17} />
          {toast}
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>
            <X size={14} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useDemo() {
  const context = useContext(Context);
  if (!context) throw new Error('DemoProvider missing');
  return context;
}
