-- Core schema per Section 19 of gopher-project-spec.docx.
-- RLS policies live in a separate migration (00002_rls_policies.sql) so
-- schema and access-control changes are reviewable independently.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  department text,
  created_at timestamptz not null default now()
);

create type trust_tier as enum ('new', 'trusted');
create type verification_status as enum ('pending', 'approved', 'rejected');

create table scouts (
  profile_id uuid primary key references profiles(id) on delete cascade,
  matric_number text not null unique,
  selfie_url text,
  id_photo_url text,
  verification_status verification_status not null default 'pending',
  resubmission_count int not null default 0,
  trust_tier trust_tier not null default 'new',
  completed_errands_count int not null default 0,
  rating_avg numeric(2, 1),
  bank_account_details jsonb,
  paystack_recipient_code text,
  banned_at timestamptz,
  ban_reason text,
  mercy_period_ends_at timestamptz
);

create type errand_status as enum (
  'open', 'accepted', 'purchased', 'delivered', 'confirmed', 'disputed', 'cancelled'
);

create table errands (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id),
  scout_id uuid references profiles(id),
  item_description text not null,
  pickup_location text not null,
  dropoff_location text not null,
  item_budget numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null,
  processing_fee numeric(10, 2) not null default 0,
  status errand_status not null default 'open',
  accepted_at timestamptz,
  purchased_at timestamptz,
  delivered_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create type transaction_type as enum (
  'payment_in', 'item_cost_payout', 'commission_earned', 'refund', 'balance_topup'
);

-- The escrow ledger. Source of truth for all money movement — see
-- Section 6. Client write access is intentionally denied entirely; see
-- the RLS migration.
create table transactions (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references errands(id),
  type transaction_type not null,
  amount numeric(10, 2) not null,
  paystack_reference text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create type balance_request_status as enum ('pending', 'approved', 'declined', 'expired');

create table balance_requests (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references errands(id),
  requested_amount numeric(10, 2) not null,
  reason text,
  evidence_photo_url text,
  status balance_request_status not null default 'pending',
  created_at timestamptz not null default now()
);

create type dispute_status as enum ('open', 'resolved');
create type dispute_resolution as enum (
  'release_to_scout', 'refund_to_requester', 'partial_split', 'escalate'
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references errands(id),
  opened_by uuid not null references profiles(id),
  reason text not null,
  status dispute_status not null default 'open',
  resolution dispute_resolution,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references errands(id),
  sender_id uuid not null references profiles(id),
  message_text text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references errands(id),
  rated_by uuid not null references profiles(id),
  rated_user_id uuid not null references profiles(id),
  stars smallint not null check (stars between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (errand_id, rated_by)
);

create type payout_batch_status as enum ('pending', 'paid');

-- The one-week rolling delay (Section 8) is enforced in the scheduled job
-- that generates batches, not in this table's shape — payout_date is
-- simply computed as week_end + 7 days at generation time.
create table payout_batches (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid not null references scouts(profile_id),
  week_start date not null,
  week_end date not null,
  payout_date date not null,
  total_amount numeric(10, 2) not null default 0,
  status payout_batch_status not null default 'pending',
  paystack_transfer_reference text
);

create table payout_batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references payout_batches(id),
  errand_id uuid not null references errands(id),
  amount numeric(10, 2) not null
);

create table admins (
  id uuid primary key references auth.users(id),
  email text not null
);

-- Hot paths: the open-errand pool query, per-user errand lookups, and
-- ledger lookups by errand all run constantly. Added now rather than
-- retrofitted once there's real traffic to notice the slowdown.
create index idx_errands_status on errands(status);
create index idx_errands_requester on errands(requester_id);
create index idx_errands_scout on errands(scout_id);
create index idx_transactions_errand on transactions(errand_id);