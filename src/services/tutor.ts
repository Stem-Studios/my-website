import type { Question } from '@/domain/types';
export interface TutorProvider {
  explain(question: Question, level: number): Promise<string>;
}
// Intentionally deterministic. Replace this adapter with a server API, never a browser API key.
export const demoTutor: TutorProvider = {
  async explain(question, level) {
    return question.hints[Math.min(2, Math.max(0, level))];
  },
};
