import type { DemoState, Profile } from '@/domain/types';
import { generatePlan } from '@/domain/learning';
import { questions } from './questions';
export function defaultProfile(): Profile {
  const date = new Date();
  date.setDate(date.getDate() + 84);
  return {
    name: 'Alex',
    exam: 'TMUA',
    modules: ['Mathematics'],
    currentScore: null,
    targetScore: 7,
    examDate: date.toLocaleDateString('en-CA'),
    weeklyHours: 8,
    confidence: 'Building confidence',
    topicConfidence: {},
    experience: 'Some independent practice',
  };
}
export function initialState(): DemoState {
  const profile = defaultProfile();
  return {
    version: 1,
    profile,
    onboarded: false,
    attempts: [],
    bookmarks: [],
    tasks: generatePlan(profile, questions),
    session: null,
    reports: [],
    resources: [],
    timer: true,
  };
}
export const sampleTrend = [
  { week: 'Week 1', accuracy: 42 },
  { week: 'Week 2', accuracy: 48 },
  { week: 'Week 3', accuracy: 45 },
  { week: 'Week 4', accuracy: 59 },
  { week: 'Week 5', accuracy: 56 },
  { week: 'Week 6', accuracy: 68 },
  { week: 'Week 7', accuracy: 65 },
  { week: 'Week 8', accuracy: 78 },
];
export const sampleTopics = [
  { topic: 'Algebra', percent: 82, color: '#a78bfa' },
  { topic: 'Calculus', percent: 74, color: '#7787eb' },
  { topic: 'Sequences', percent: 63, color: '#5b8def' },
  { topic: 'Logic & proof', percent: 46, color: '#d6ad77' },
];
