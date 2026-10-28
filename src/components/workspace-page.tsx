'use client';
import { Shell } from './shell';
import { useDemo } from './provider';
import { Dashboard } from '@/features/dashboard';
import { Onboarding } from '@/features/onboarding';
import { PracticeSetup, ActivePractice, Results } from '@/features/practice';
import { StudyPlan } from '@/features/study-plan';
import { QuestionBank } from '@/features/question-bank';
import { Analytics } from '@/features/analytics';
import { Resources } from '@/features/resources';
import { Tutor } from '@/features/tutor';
import { Settings } from '@/features/account';
import { Landing } from '@/features/landing';
import { AuthForm } from '@/features/auth';
import { Arena, LiveLeaderboard } from '@/features/arena';
export function WorkspacePage({ path }: { path: string }) {
  const { ready } = useDemo();
  if (path === 'features') return <Landing features />;
  if (path === 'login' || path === 'signup') return <AuthForm mode={path} />;
  if (path === 'reset-password') return <AuthForm mode="reset" />;
  if (path === 'update-password') return <AuthForm mode="recovery" />;
  const screen = () => {
    switch (path) {
      case 'dashboard':
        return <Dashboard />;
      case 'onboarding':
        return <Onboarding />;
      case 'practice':
        return <PracticeSetup />;
      case 'practice/demo':
      case 'mock-exams/demo':
        return <ActivePractice />;
      case 'mock-exams':
        return <PracticeSetup mock />;
      case 'results/demo':
        return <Results />;
      case 'study-plan':
        return <StudyPlan />;
      case 'question-bank':
        return <QuestionBank />;
      case 'analytics':
        return <Analytics />;
      case 'resources':
        return <Resources />;
      case 'ai-tutor':
        return <Tutor />;
      case 'profile':
        return <Settings profile />;
      case 'settings':
        return <Settings />;
      case 'ranked':
      case 'arena':
        return <Arena />;
      case 'leaderboard':
        return <LiveLeaderboard />;
      default:
        return <Dashboard />;
    }
  };
  return (
    <Shell>
      {ready ? (
        screen()
      ) : (
        <div className="loading-state">
          <span />
          <p>Making room for your next step…</p>
        </div>
      )}
    </Shell>
  );
}
