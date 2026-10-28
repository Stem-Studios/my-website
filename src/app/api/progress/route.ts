import { createClient } from '@/utils/supabase/server';
import { persistedSchema } from '@/services/storage';
import { initialState } from '@/data/demo';
import { z } from 'zod';
import { profileSchema } from '@/domain/types';
import { generatePlan } from '@/domain/learning';
import { questions } from '@/data/questions';

const headers = { 'Cache-Control': 'private, no-store' };
export async function GET() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401, headers });
  const { data, error } = await client
    .from('user_progress')
    .select('state,revision')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error)
    return Response.json(
      { error: 'Cloud progress unavailable. Check database setup.' },
      { status: 503, headers },
    );
  const state = initialState();
  const profile = await client
    .from('profiles')
    .select('name,exam,modules,target_score,weekly_hours,exam_date,assessment')
    .eq('user_id', user.id)
    .single();
  if (profile.error)
    return Response.json(
      { error: 'Your account profile could not be loaded.' },
      { status: 503, headers },
    );
  state.profile = {
    ...state.profile,
    name: profile.data.name,
    exam: profile.data.exam,
    modules: profile.data.modules,
    targetScore: profile.data.assessment?.targetScore ?? profile.data.target_score,
    currentScore: profile.data.assessment?.currentScore ?? null,
    weeklyHours: profile.data.weekly_hours,
    examDate: profile.data.exam_date,
  };
  const validatedProfile = profileSchema.safeParse(state.profile);
  if (!validatedProfile.success)
    return Response.json(
      { error: 'Your account preferences need recovery. No data has been changed.' },
      { status: 409, headers },
    );
  state.profile = validatedProfile.data;
  state.tasks = generatePlan(state.profile, questions);
  if (data && !persistedSchema.safeParse(data.state).success)
    return Response.json(
      { error: 'Saved progress needs recovery. No data has been reset.' },
      { status: 409, headers },
    );
  return Response.json(
    { state: data?.state ?? state, revision: data?.revision ?? 0, userId: user.id },
    { headers },
  );
}
export async function PUT(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'Invalid origin' }, { status: 403, headers });
  if (Number(request.headers.get('content-length') ?? 0) > 2_000_000)
    return Response.json({ error: 'Workspace too large' }, { status: 413, headers });
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401, headers });
  let body;
  try {
    const text = await request.text();
    if (text.length > 2_000_000) throw Error();
    body = z
      .object({
        userId: z.string().uuid(),
        state: persistedSchema,
        revision: z.number().int().nonnegative(),
      })
      .parse(JSON.parse(text));
  } catch {
    return Response.json({ error: 'Invalid workspace' }, { status: 400, headers });
  }
  if (body.userId !== user.id)
    return Response.json(
      { error: 'Account changed. Reload before continuing.' },
      { status: 409, headers },
    );
  const { data, error } = await client.rpc('save_user_progress', {
    expected_revision: body.revision,
    new_state: body.state,
  });
  if (error)
    return Response.json(
      { error: 'Save conflict or database unavailable. Export your changes before reloading.' },
      { status: 409, headers },
    );
  return Response.json({ revision: data }, { headers });
}
