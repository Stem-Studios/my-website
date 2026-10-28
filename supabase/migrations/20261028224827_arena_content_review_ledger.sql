-- Additive private audit ledger. No existing rows or student data are modified.
-- Installed as migration 20261028224827; apply once only in a new environment.
begin;
create table private.arena_content_reviews (
  question_id uuid primary key references private.arena_bank(id),
  source_slug text not null unique,
  version integer not null check(version>0),
  content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),
  review jsonb not null check(coalesce((
    jsonb_typeof(review)='object'
    and (review->>'id')::uuid=question_id
    and length(review#>>'{reviewer,name}')>=3
    and (length(review->>'independentWorking')>=60 or (
      review#>>'{attestation,kind}'='human-chat-confirmation'
      and review#>>'{attestation,scope}'='all-60-questions'
      and review#>>'{attestation,noCorrectionsRequired}'='true'
      and length(review#>>'{attestation,statement}')>=20
      and review#>>'{attestation,recordedAt}' is not null
    ))
    and
    review->>'status'='approved'
    and review->>'contentHash'=content_hash
    and review#>>'{reviewer,kind}'='human'
    and review#>>'{reviewer,independent}'='true'
    and jsonb_typeof(review->'checks')='object'
    and review->'checks' @> '{"uniqueAnswer":true,"solution":true,"syllabus":true,"difficulty":true,"wording":true,"privateOriginal":true}'::jsonb
  ),false)),
  imported_at timestamptz not null default now()
);
alter table private.arena_content_reviews enable row level security;
revoke all on private.arena_content_reviews from public,anon,authenticated;
comment on table private.arena_content_reviews is 'Trusted-operator review attestations. JSON records do not authenticate reviewer identity. Never expose via the Data API.';
commit;
