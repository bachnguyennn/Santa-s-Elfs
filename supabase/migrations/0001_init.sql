-- SantaElf initial schema.
-- All application access goes through the server (direct Postgres connection).
-- RLS is enabled on every table with NO policies, so Supabase's public
-- anon/authenticated roles (PostgREST) can read nothing.

-- ---------------------------------------------------------------------------
-- Groups
-- ---------------------------------------------------------------------------
create table groups (
  id                 uuid primary key default gen_random_uuid(),
  invite_code        text not null unique check (invite_code ~ '^[A-Za-z0-9_-]{16,64}$'),
  name               text not null check (char_length(name) between 1 and 80),
  organizer_name     text not null check (char_length(organizer_name) between 1 and 60),
  organizer_email    text not null check (organizer_email = lower(organizer_email) and char_length(organizer_email) <= 254),
  budget_min_cents   integer check (budget_min_cents >= 0),
  budget_max_cents   integer check (budget_max_cents >= 0),
  currency           text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  signup_deadline    timestamptz,
  draw_method        text not null check (draw_method in ('manual', 'scheduled')),
  draw_at            timestamptz,
  exchange_date      date,
  timezone           text not null check (char_length(timezone) between 1 and 64),
  requires_approval  boolean not null default false,
  rules              text check (char_length(rules) <= 2000),
  status             text not null default 'open' check (status in ('open', 'drawn', 'closed')),
  drawn_at           timestamptz,
  draw_error         text,                 -- last scheduled-draw validation failure (code), cleared on settings change
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (budget_min_cents is null or budget_max_cents is null or budget_min_cents <= budget_max_cents),
  check ((draw_method = 'scheduled') = (draw_at is not null)),
  check (signup_deadline is null or draw_at is null or signup_deadline <= draw_at),
  check ((status = 'open') or drawn_at is not null or status = 'closed')
);
create index groups_scheduled_due_idx on groups (draw_at) where status = 'open' and draw_method = 'scheduled';
create index groups_organizer_email_idx on groups (organizer_email);

-- ---------------------------------------------------------------------------
-- Participants (membership + alias)
-- ---------------------------------------------------------------------------
create table participants (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references groups(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 60),
  email         text not null check (email = lower(email) and char_length(email) <= 254),
  status        text not null check (status in ('pending', 'approved', 'rejected', 'removed')),
  is_organizer  boolean not null default false,
  alias         text,                       -- Christmas alias, assigned at draw time
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  unique (group_id, email),
  unique (group_id, alias),
  unique (id, group_id),                    -- target for composite FKs (same-group guarantees)
  check (alias is null or status = 'approved')
);
create index participants_group_status_idx on participants (group_id, status);

-- Capacity, membership locking and status transitions, enforced under concurrency.
-- Locking the parent group row serializes every membership change in a group.
create function participants_guard() returns trigger language plpgsql as $$
declare
  g_status text;
  approved_count integer;
begin
  select status into g_status from groups where id = new.group_id for update;

  if tg_op = 'INSERT' then
    if g_status <> 'open' then
      raise exception 'GROUP_LOCKED' using errcode = 'P0001';
    end if;
    if new.status not in ('pending', 'approved') then
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
    end if;
  else
    if new.group_id <> old.group_id or new.email <> old.email then
      raise exception 'IMMUTABLE_FIELD' using errcode = 'P0001';
    end if;
    if new.status <> old.status then
      if g_status <> 'open' then
        raise exception 'GROUP_LOCKED' using errcode = 'P0001';
      end if;
      if not (
        (old.status = 'pending'  and new.status in ('approved', 'rejected')) or
        (old.status = 'approved' and new.status = 'removed') or
        (old.status = 'rejected' and new.status = 'approved') or
        (old.status = 'removed'  and new.status = 'approved')
      ) then
        raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
      end if;
    end if;
    if new.alias is distinct from old.alias and old.alias is not null then
      raise exception 'ALIAS_IMMUTABLE' using errcode = 'P0001';
    end if;
  end if;

  if new.status = 'approved' and (tg_op = 'INSERT' or old.status <> 'approved') then
    select count(*) into approved_count
      from participants
     where group_id = new.group_id and status = 'approved' and id <> new.id;
    if approved_count >= 20 then
      raise exception 'GROUP_FULL' using errcode = 'P0001';
    end if;
  end if;

  return new;
end $$;

create trigger participants_guard_trg
  before insert or update on participants
  for each row execute function participants_guard();

-- ---------------------------------------------------------------------------
-- Santa profiles & wishlists
-- ---------------------------------------------------------------------------
create table profiles (
  participant_id  uuid primary key references participants(id) on delete cascade,
  about           text check (char_length(about) <= 1000),
  interests       text[] not null default '{}' check (cardinality(interests) <= 20),
  dislikes        text check (char_length(dislikes) <= 1000),
  notes           text check (char_length(notes) <= 1000),
  updated_at      timestamptz not null default now()
);

create table wishlist_items (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references participants(id) on delete cascade,
  position        integer not null check (position between 0 and 24),
  name            text not null check (char_length(name) between 1 and 120),
  description     text check (char_length(description) <= 500),
  url             text check (url ~ '^https?://' and char_length(url) <= 2048),
  unique (participant_id, position)
);

-- ---------------------------------------------------------------------------
-- Exclusions (directional: giver must not be assigned receiver)
-- ---------------------------------------------------------------------------
create table exclusions (
  group_id     uuid not null references groups(id) on delete cascade,
  giver_id     uuid not null,
  receiver_id  uuid not null,
  created_at   timestamptz not null default now(),
  primary key (group_id, giver_id, receiver_id),
  check (giver_id <> receiver_id),
  foreign key (giver_id, group_id) references participants(id, group_id) on delete cascade,
  foreign key (receiver_id, group_id) references participants(id, group_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Assignments (the secret mapping). Never returned wholesale to any client.
-- ---------------------------------------------------------------------------
create table assignments (
  group_id               uuid not null references groups(id) on delete cascade,
  giver_id               uuid not null,
  recipient_id           uuid not null,
  revealed_at            timestamptz,
  recipient_muted_at     timestamptz,   -- recipient paused messages from their Santa
  created_at             timestamptz not null default now(),
  primary key (group_id, giver_id),
  unique (group_id, recipient_id),
  check (giver_id <> recipient_id),
  foreign key (giver_id, group_id) references participants(id, group_id) on delete cascade,
  foreign key (recipient_id, group_id) references participants(id, group_id) on delete cascade
);
create index assignments_recipient_idx on assignments (recipient_id);

-- Assignments are immutable once written (except reveal/mute bookkeeping).
create function assignments_guard() returns trigger language plpgsql as $$
begin
  if new.giver_id <> old.giver_id or new.recipient_id <> old.recipient_id or new.group_id <> old.group_id then
    raise exception 'ASSIGNMENT_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger assignments_guard_trg before update on assignments
  for each row execute function assignments_guard();

-- ---------------------------------------------------------------------------
-- Anonymous messages, scoped to one giver->recipient assignment.
-- sender_role is relative to the pair; real identities are never stored here.
-- ---------------------------------------------------------------------------
create table messages (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null,
  giver_id     uuid not null,
  sender_role  text not null check (sender_role in ('santa', 'recipient')),
  body         text not null check (char_length(body) between 1 and 1000),
  created_at   timestamptz not null default now(),
  reported_at  timestamptz,
  foreign key (group_id, giver_id) references assignments(group_id, giver_id) on delete cascade
);
create index messages_thread_idx on messages (group_id, giver_id, created_at);

-- ---------------------------------------------------------------------------
-- Capability tokens (only SHA-256 hashes are stored)
-- ---------------------------------------------------------------------------
create table access_tokens (
  id              uuid primary key default gen_random_uuid(),
  token_hash      text not null unique,
  kind            text not null check (kind in ('participant', 'organizer')),
  group_id        uuid not null references groups(id) on delete cascade,
  participant_id  uuid references participants(id) on delete cascade,
  expires_at      timestamptz not null,
  revoked_at      timestamptz,
  last_used_at    timestamptz,
  created_at      timestamptz not null default now(),
  check ((kind = 'participant') = (participant_id is not null))
);
create index access_tokens_participant_idx on access_tokens (participant_id);
create index access_tokens_group_idx on access_tokens (group_id);

-- ---------------------------------------------------------------------------
-- Emergency reveal challenges (one-time code sent to organizer email)
-- ---------------------------------------------------------------------------
create table emergency_challenges (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references groups(id) on delete cascade,
  participant_id  uuid not null references participants(id) on delete cascade,
  code_hash       text,                 -- set when the code email is actually sent
  attempts        integer not null default 0,
  expires_at      timestamptz not null,
  consumed_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Email queue. Payloads reference ids, never raw tokens: access links are
-- minted at send time so the queue never holds a usable credential.
-- ---------------------------------------------------------------------------
create table email_jobs (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid references groups(id) on delete cascade,
  participant_id   uuid references participants(id) on delete cascade,
  to_email         text not null,
  template         text not null,
  payload          jsonb not null default '{}'::jsonb,
  dedupe_key       text unique,
  status           text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts         integer not null default 0,
  next_attempt_at  timestamptz not null default now(),
  last_error       text,
  provider_id      text,
  sent_at          timestamptz,
  created_at       timestamptz not null default now()
);
create index email_jobs_due_idx on email_jobs (next_attempt_at) where status in ('pending', 'sending');
create index email_jobs_group_idx on email_jobs (group_id);

-- Local demo mode only: rendered copies of simulated emails.
create table dev_outbox (
  id          uuid primary key default gen_random_uuid(),
  to_email    text not null,
  subject     text not null,
  html        text not null,
  text        text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Privacy-preserving audit log (ids and event types only; never names,
-- emails, tokens, message bodies or assignment targets).
-- ---------------------------------------------------------------------------
create table audit_events (
  id                      uuid primary key default gen_random_uuid(),
  group_id                uuid references groups(id) on delete cascade,
  actor                   text not null check (actor in ('organizer', 'participant', 'system')),
  event_type              text not null,
  subject_participant_id  uuid references participants(id) on delete set null,
  metadata                jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now()
);
create index audit_events_group_idx on audit_events (group_id, created_at);

-- ---------------------------------------------------------------------------
-- Fixed-window rate limits (keys are hashed; no raw IPs/emails stored)
-- ---------------------------------------------------------------------------
create table rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  count         integer not null default 0,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------------------
-- Lock down Supabase's public API roles.
-- ---------------------------------------------------------------------------
alter table groups enable row level security;
alter table participants enable row level security;
alter table profiles enable row level security;
alter table wishlist_items enable row level security;
alter table exclusions enable row level security;
alter table assignments enable row level security;
alter table messages enable row level security;
alter table access_tokens enable row level security;
alter table emergency_challenges enable row level security;
alter table email_jobs enable row level security;
alter table dev_outbox enable row level security;
alter table audit_events enable row level security;
alter table rate_limits enable row level security;
