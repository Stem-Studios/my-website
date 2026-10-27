// Future PostgreSQL adapter. The demo does not connect to a database.
// Keep protected solutions separate from the public question catalogue.
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const users = pgTable('app_users', {
  id: uuid().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const profiles = pgTable('profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  exam: text().notNull(),
  modules: jsonb().notNull(),
  targetScore: integer('target_score').notNull(),
  examDate: text('exam_date').notNull(),
  weeklyHours: integer('weekly_hours').notNull(),
  assessment: jsonb().notNull(),
});
export const topics = pgTable(
  'syllabus_topics',
  {
    id: text().primaryKey(),
    exam: text().notNull(),
    module: text().notNull(),
    name: text().notNull(),
  },
  (t) => [index('topics_exam_idx').on(t.exam, t.module)],
);
export const examConfigurations = pgTable(
  'exam_configurations',
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    version: integer().notNull(),
    definition: jsonb().notNull(),
    official: boolean().default(false).notNull(),
    sourceUrl: text('source_url'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('exam_version_idx').on(t.name, t.version)],
);
export const questionCatalogue = pgTable(
  'questions',
  {
    id: text().primaryKey(),
    topicId: text('topic_id').references(() => topics.id),
    exam: text().notNull(),
    module: text().notNull(),
    difficulty: text().notNull(),
    content: jsonb().notNull(),
    provenance: text().notNull(),
    verified: boolean().default(false).notNull(),
    version: integer().default(1).notNull(),
  },
  (t) => [index('question_filter_idx').on(t.exam, t.module, t.difficulty)],
);
export const questionOptions = pgTable(
  'question_options',
  {
    id: uuid().defaultRandom().primaryKey(),
    questionId: text('question_id')
      .notNull()
      .references(() => questionCatalogue.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
    content: text().notNull(),
  },
  (t) => [uniqueIndex('question_option_idx').on(t.questionId, t.position)],
);
export const questionSolutions = pgTable('question_solutions', {
  questionId: text('question_id')
    .primaryKey()
    .references(() => questionCatalogue.id, { onDelete: 'cascade' }),
  correctIndex: integer('correct_index').notNull(),
  solution: text().notNull(),
  hints: jsonb().notNull(),
});
export const sessions = pgTable(
  'practice_sessions',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mode: text().notNull(),
    state: jsonb().notNull(),
    deadline: timestamp({ withTimezone: true }),
    finished: boolean().default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('session_owner_idx').on(t.userId, t.createdAt)],
);
export const attempts = pgTable(
  'question_attempts',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => questionCatalogue.id),
    selected: integer().notNull(),
    correct: boolean().notNull(),
    seconds: integer().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('attempt_owner_topic_idx').on(t.userId, t.questionId),
    uniqueIndex('single_session_answer_idx').on(t.sessionId, t.questionId),
    check('nonnegative_seconds', sql`${t.seconds} >= 0`),
  ],
);
export const plans = pgTable('study_plans', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  configuration: jsonb().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const tasks = pgTable(
  'study_tasks',
  {
    id: uuid().defaultRandom().primaryKey(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    topic: text().notNull(),
    minutes: integer().notNull(),
    date: text().notNull(),
    done: boolean().default(false).notNull(),
  },
  (t) => [index('tasks_owner_date_idx').on(t.userId, t.date)],
);
export const topicMastery = pgTable(
  'topic_mastery',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topicId: text('topic_id')
      .notNull()
      .references(() => topics.id),
    evidence: jsonb().notNull(),
  },
  (t) => [uniqueIndex('mastery_owner_topic_idx').on(t.userId, t.topicId)],
);
export const resources = pgTable('resources', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  description: text().notNull(),
  exam: text(),
  topic: text(),
  type: text().notNull(),
  url: text(),
  attribution: text().notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
});
