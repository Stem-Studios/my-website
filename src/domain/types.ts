import { z } from 'zod';
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  exam: z.enum(['TMUA', 'ESAT']),
  modules: z.array(z.string()).min(1),
  currentScore: z.number().min(1).max(9).nullable(),
  targetScore: z.number().min(1).max(9),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weeklyHours: z.number().min(1).max(40),
  confidence: z.enum(['Starting out', 'Building confidence', 'Exam ready']),
  topicConfidence: z.record(z.string(), z.enum(['Low', 'Medium', 'High'])).default({}),
  experience: z.string().max(400),
});
export type Profile = z.infer<typeof profileSchema>;
export type Question = {
  id: string;
  exam: 'TMUA' | 'ESAT';
  module: string;
  topic: string;
  subtopic: string;
  difficulty: 'Foundation' | 'Intermediate' | 'Challenge';
  text: string;
  math?: string;
  options: string[];
  correct: number;
  solution: string;
  hints: string[];
  seconds: number;
  source: string;
  verified: boolean;
  tags: string[];
  version: number;
};
export type Attempt = {
  id: string;
  sessionId: string;
  questionId: string;
  selected: number;
  correct: boolean;
  seconds: number;
  date: string;
};
export type Task = {
  id: string;
  title: string;
  topic: string;
  minutes: number;
  date: string;
  done: boolean;
  kind: 'Practice' | 'Review' | 'Checkpoint';
};
export type PracticeSession = {
  id: string;
  questionIds: string[];
  index: number;
  answers: Record<string, number>;
  startedAt: number;
  questionStartedAt: number;
  finished: boolean;
  mode: 'practice' | 'mock';
  deadline?: number;
};
export type DemoState = {
  version: 1;
  profile: Profile;
  onboarded: boolean;
  attempts: Attempt[];
  bookmarks: string[];
  tasks: Task[];
  session: PracticeSession | null;
  reports: string[];
  resources: {
    id: string;
    title: string;
    description: string;
    topic: string;
    type: string;
    url?: string;
  }[];
  timer: boolean;
};
