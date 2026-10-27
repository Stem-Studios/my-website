import { z } from 'zod';
import { profileSchema, type DemoState } from '@/domain/types';
import { initialState } from '@/data/demo';
export const STORAGE_KEY = 'axiom-demo-v1';
const persistedSchema = z.object({
  version: z.literal(1),
  profile: profileSchema,
  onboarded: z.boolean(),
  attempts: z.array(
    z.object({
      id: z.string(),
      sessionId: z.string(),
      questionId: z.string(),
      selected: z.number().int(),
      correct: z.boolean(),
      seconds: z.number().nonnegative(),
      date: z.string(),
    }),
  ),
  bookmarks: z.array(z.string()),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      topic: z.string(),
      minutes: z.number().nonnegative(),
      date: z.string(),
      done: z.boolean(),
      kind: z.enum(['Practice', 'Review', 'Checkpoint']),
    }),
  ),
  session: z
    .object({
      id: z.string(),
      questionIds: z.array(z.string()),
      index: z.number().int().nonnegative(),
      answers: z.record(z.string(), z.number().int()),
      startedAt: z.number(),
      questionStartedAt: z.number(),
      finished: z.boolean(),
      mode: z.enum(['practice', 'mock']),
      deadline: z.number().optional(),
    })
    .nullable(),
  reports: z.array(z.string()),
  resources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      topic: z.string(),
      type: z.string(),
      url: z.string().optional(),
    }),
  ),
  timer: z.boolean(),
});
export function loadDemo(raw: string | null): DemoState {
  if (!raw) return initialState();
  try {
    return persistedSchema.parse(JSON.parse(raw));
  } catch {
    return initialState();
  }
}
