import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

describe('Arena PostgreSQL transactions and RLS', () => {
  it('isolates accounts and progress, hides keys, and settles a two-player race once', async () => {
    const db = new PGlite();
    const a = '00000000-0000-0000-0000-000000000001',
      b = '00000000-0000-0000-0000-000000000002',
      c = '00000000-0000-0000-0000-000000000003';
    try {
      await db.exec(
        `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`,
      );
      for (const path of ['0001_foundation.sql', '0002_accounts_progress.sql', '0003_arena.sql']) {
        const sql = readFileSync(new URL('../migrations/' + path, import.meta.url), 'utf8').replace(
          'alter publication supabase_realtime add table public.multiplayer_matches;',
          '-- Realtime publication is a hosted Supabase integration, not simulated here.',
        );
        await db.exec(sql);
      }
      for (const file of readdirSync(new URL('../supabase/migrations/', import.meta.url))
        .filter((f) => f.endsWith('.sql'))
        .sort())
        await db.exec(
          readFileSync(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'),
        );
      for (const [id, username] of [
        [a, 'alice'],
        [b, 'brian'],
        [c, 'carol'],
      ])
        await db.query('insert into auth.users values($1,$2)', [
          id,
          JSON.stringify({ username, display_name: username }),
        ]);
      async function asUser(id: string) {
        await db.exec('reset role');
        await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
        await db.exec('set role authenticated');
      }
      async function scalar(sql: string, args: unknown[] = []) {
        const { rows } = await db.query<Record<string, unknown>>(sql, args);
        return Object.values(rows[0])[0];
      }
      await asUser(a);
      const emptyCatalogue = await db.query<{ verified_count: number }>(
        'select * from public.arena_catalogue()',
      );
      expect(emptyCatalogue.rows).toHaveLength(6);
      expect(emptyCatalogue.rows.every((r) => r.verified_count === 0)).toBe(true);
      expect(await scalar('select count(*) from public.profiles')).toBe(1);
      expect(await scalar('select public.save_user_progress(0,\'{"version":1}\')')).toBe(1);
      await asUser(b);
      expect(await scalar('select count(*) from public.user_progress')).toBe(0);
      await expect(db.query('select * from private.arena_bank')).rejects.toThrow();
      await asUser(a);
      await expect(db.query("select public.save_user_progress(99,'{}')")).rejects.toThrow();
      await expect(db.query("select public.arena_lobby('create')")).rejects.toThrow(/10 verified/);
      await db.exec('reset role');
      for (let i = 0; i < 10; i++)
        await db.query(
          "insert into private.arena_bank(exam,difficulty,content,correct_index,solution,verified) values('TMUA','Intermediate',$1,0,'Test-only solution',true)",
          [
            JSON.stringify({
              text: `Local fixture ${i}`,
              topic: 'Algebra',
              options: ['0', '1', '2', '3', '4'],
            }),
          ],
        );
      await asUser(a);
      expect(
        await scalar(
          "select verified_count from public.arena_catalogue() where exam='TMUA' and difficulty='Intermediate'",
        ),
      ).toBe(10);
      const mid = (await scalar(
        "select public.arena_lobby('create','TMUA','Intermediate',true)",
      )) as string;
      const code = await scalar('select room_code from public.multiplayer_matches where id=$1', [
        mid,
      ]);
      expect(await scalar('select public.arena_question($1)', [mid])).toBeNull();
      await asUser(c);
      expect(await scalar('select count(*) from public.multiplayer_matches')).toBe(0);
      await expect(db.query("select public.arena_play($1,'ready')", [mid])).rejects.toThrow();
      await asUser(b);
      expect(
        await scalar("select public.arena_lobby('join','TMUA','Intermediate',false,$1)", [code]),
      ).toBe(mid);
      await db.query("select public.arena_play($1,'ready')", [mid]);
      await asUser(a);
      await db.query("select public.arena_play($1,'ready')", [mid]);
      expect(await scalar('select status from public.multiplayer_matches where id=$1', [mid])).toBe(
        'countdown',
      );
      await expect(db.query("select public.arena_play($1,'answer',0,0)", [mid])).rejects.toThrow();
      await db.exec('reset role');
      await db.query(
        "update public.multiplayer_matches set starts_at=now()-interval '5 seconds', deadline=now()+interval '5 minutes' where id=$1",
        [mid],
      );
      await asUser(a);
      const qa = await scalar('select public.arena_question($1)', [mid]);
      await asUser(b);
      const qb = await scalar('select public.arena_question($1)', [mid]);
      expect(qa).toEqual(qb);
      expect(JSON.stringify(qa)).not.toContain('correct');
      for (const uid of [a, b])
        for (let i = 0; i < 10; i++) {
          await asUser(uid);
          await db.query("select public.arena_play($1,'answer',$2,$3)", [
            mid,
            i,
            uid === b && i === 9 ? 1 : 0,
          ]);
          if (i === 0) {
            const pointsBefore = await scalar(
              'select scores from public.multiplayer_matches where id=$1',
              [mid],
            );
            await db.query("select public.arena_play($1,'answer',0,0)", [mid]);
            expect(
              await scalar('select scores from public.multiplayer_matches where id=$1', [mid]),
            ).toEqual(pointsBefore);
            expect(
              await scalar(
                'select (positions->>$1)::integer from public.multiplayer_matches where id=$2',
                [uid, mid],
              ),
            ).toBe(1);
          }
          await db.exec('reset role');
          await db.query(
            "update private.arena_answers set received_at=now()-interval '2 seconds' where match_id=$1",
            [mid],
          );
        }
      await asUser(a);
      expect(await scalar('select winner from public.multiplayer_matches where id=$1', [mid])).toBe(
        a,
      );
      expect(await scalar('select wins from public.player_ratings where user_id=$1', [a])).toBe(1);
      expect(await scalar('select rating from public.player_ratings where user_id=$1', [a])).toBe(
        1012,
      );
      expect(
        await scalar('select correct_counts from public.multiplayer_matches where id=$1', [mid]),
      ).toEqual({ [a]: 10, [b]: 9 });
      await asUser(b);
      expect(await scalar('select rating from public.player_ratings where user_id=$1', [b])).toBe(
        988,
      );
      await asUser(a);
      const settledScores = (await scalar(
        'select scores from public.multiplayer_matches where id=$1',
        [mid],
      )) as Record<string, number>;
      expect(settledScores[a]).toBeGreaterThanOrEqual(1000);
      expect(settledScores[a]).toBeLessThanOrEqual(1050);
      expect(settledScores[b]).toBeGreaterThanOrEqual(900);
      expect(settledScores[b]).toBeLessThanOrEqual(945);
      await db.query("select public.arena_play($1,'heartbeat')", [mid]);
      expect(await scalar('select wins from public.player_ratings where user_id=$1', [a])).toBe(1);
      expect(await scalar('select rating from public.player_ratings where user_id=$1', [a])).toBe(
        1012,
      );
      await expect(
        db.query('update public.player_ratings set rating=9999 where user_id=$1', [a]),
      ).rejects.toThrow();
      await expect(
        db.query('select questions from public.multiplayer_matches where id=$1', [mid]),
      ).rejects.toThrow();
      await asUser(a);
      expect(await scalar("select public.arena_lobby('queue')")).toBeNull();
      await asUser(b);
      const queued = (await scalar("select public.arena_lobby('queue')")) as string;
      expect(queued).not.toBe(mid);
      await db.query("select public.arena_play($1,'ready')", [queued]);
      await asUser(a);
      await db.query("select public.arena_play($1,'ready')", [queued]);
      await db.exec('reset role');
      await db.query(
        "update public.multiplayer_matches set starts_at=now()-interval '10 seconds',heartbeats=jsonb_build_object($1::text,now(),$2::text,now()-interval '100 seconds') where id=$3",
        [a, b, queued],
      );
      await asUser(a);
      await db.query("select public.arena_play($1,'heartbeat')", [queued]);
      expect(
        await scalar('select winner from public.multiplayer_matches where id=$1', [queued]),
      ).toBe(a);
      expect(
        await scalar('select result_reason from public.multiplayer_matches where id=$1', [queued]),
      ).toBe('Forfeit');
    } finally {
      await db.close();
    }
  }, 30000);
});
