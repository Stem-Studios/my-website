'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { initialState } from '@/data/demo';
import type { DemoState } from '@/domain/types';
import { loadDemo, STORAGE_KEY } from '@/services/storage';
import { Check, X } from 'lucide-react';
const Context = createContext<{
  state: DemoState;
  setState: Dispatch<SetStateAction<DemoState>>;
  notify: (text: string) => void;
  ready: boolean;
} | null>(null);
function readBrowserState() {
  try {
    return loadDemo(localStorage.getItem(STORAGE_KEY));
  } catch {
    return initialState();
  }
}
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => {
    // Browser storage is loaded after hydration so exported pages stay deterministic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readBrowserState());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* The session remains usable when storage is full. */
      }
    }
  }, [state, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <Context.Provider value={{ state, setState, notify: setToast, ready }}>
      {children}
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
