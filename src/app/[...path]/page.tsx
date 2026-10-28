import { WorkspacePage } from '@/components/workspace-page';
const paths = [
  'features',
  'resources',
  'login',
  'signup',
  'reset-password',
  'update-password',
  'dashboard',
  'onboarding',
  'practice',
  'practice/demo',
  'ranked',
  'arena',
  'leaderboard',
  'mock-exams',
  'mock-exams/demo',
  'results/demo',
  'study-plan',
  'analytics',
  'ai-tutor',
  'question-bank',
  'profile',
  'settings',
];
export function generateStaticParams() {
  return paths.map((path) => ({ path: path.split('/') }));
}
export const dynamicParams = false;
export default async function Page({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return <WorkspacePage path={path.join('/')} />;
}
