-- Client Management & Project Tracking System
-- Initial PostgreSQL schema for Supabase.
-- Data access is intended to go through the Node.js API, not directly from the mobile/web client.

begin;

-- 1. User profiles: one profile per Supabase Auth user.
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text not null default 'New user',
    email text unique,
    phone text,
    role text not null default 'client'
        check (role in ('administrator', 'developer', 'finance_manager', 'client')),
    is_active boolean not null default true,
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now()
);

-- 2. Clients.
create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    company_name text not null,
    contact_name text not null,
    email text,
    phone text,
    address text,
    notes text,
    status text not null default 'active'
        check (status in ('active', 'inactive')),
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now()
);

-- 3. Projects. Each project belongs to one client.
create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients (id) on delete restrict,
    project_code text not null unique,
    name text not null,
    description text,
    status text not null default 'planned'
        check (status in ('planned', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    priority text not null default 'medium'
        check (priority in ('low', 'medium', 'high', 'urgent')),
    start_date date,
    due_date date,
    budget numeric(12, 2) not null default 0 check (budget >= 0),
    assigned_developer_id uuid references public.profiles (id) on delete set null,
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now(),
    constraint projects_dates_valid check (
        start_date is null or due_date is null or due_date >= start_date
    )
);

-- 4. Milestones belong to projects.
create table if not exists public.milestones (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    title text not null,
    description text,
    due_date date,
    status text not null default 'pending'
        check (status in ('pending', 'in_progress', 'completed', 'blocked')),
    assigned_to uuid references public.profiles (id) on delete set null,
    completed_at timestamptz,
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now()
);

-- 5. Document metadata. Actual files will be stored in a private Supabase Storage bucket.
create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    file_name text not null,
    storage_path text not null unique,
    mime_type text,
    size_bytes bigint check (size_bytes is null or size_bytes >= 0),
    description text,
    visibility text not null default 'internal'
        check (visibility in ('internal', 'client')),
    uploaded_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now()
);

-- 6. Invoices. total_amount is calculated by PostgreSQL from subtotal + tax_amount.
create table if not exists public.invoices (
    id uuid primary key default gen_random_uuid(),
    invoice_number text not null unique,
    client_id uuid not null references public.clients (id) on delete restrict,
    project_id uuid references public.projects (id) on delete set null,
    issue_date date not null default current_date,
    due_date date not null,
    subtotal numeric(12, 2) not null check (subtotal >= 0),
    tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
    total_amount numeric(12, 2) generated always as (subtotal + tax_amount) stored,
    currency char(3) not null default 'ZAR',
    status text not null default 'draft'
        check (status in ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    notes text,
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now(),
    constraint invoices_dates_valid check (due_date >= issue_date)
);

-- 7. Payments belong to invoices.
create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.invoices (id) on delete restrict,
    amount numeric(12, 2) not null check (amount > 0),
    payment_date date not null default current_date,
    method text not null default 'other'
        check (method in ('eft', 'card', 'cash', 'other')),
    reference text unique,
    status text not null default 'completed'
        check (status in ('pending', 'completed', 'failed', 'refunded')),
    notes text,
    recorded_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default pg_catalog.now()
);

-- 8. Notifications belong to a user profile.
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    title text not null,
    message text not null,
    type text not null default 'system'
        check (type in ('info', 'project_update', 'milestone', 'invoice', 'payment', 'system')),
    is_read boolean not null default false,
    read_at timestamptz,
    related_project_id uuid references public.projects (id) on delete set null,
    created_at timestamptz not null default pg_catalog.now()
);

-- 9. Persistent per-user application settings.
create table if not exists public.user_settings (
    user_id uuid primary key references public.profiles (id) on delete cascade,
    theme text not null default 'system'
        check (theme in ('light', 'dark', 'system')),
    notifications_enabled boolean not null default true,
    email_notifications boolean not null default true,
    language text not null default 'en',
    compact_mode boolean not null default false,
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now()
);

-- Index foreign-key/filter columns used by the application.
create index if not exists idx_clients_status on public.clients (status);
create index if not exists idx_projects_client_id on public.projects (client_id);
create index if not exists idx_projects_assigned_developer on public.projects (assigned_developer_id);
create index if not exists idx_projects_status on public.projects (status);
create index if not exists idx_milestones_project_id on public.milestones (project_id);
create index if not exists idx_milestones_status_due_date on public.milestones (status, due_date);
create index if not exists idx_documents_project_id on public.documents (project_id);
create index if not exists idx_invoices_client_id on public.invoices (client_id);
create index if not exists idx_invoices_status_due_date on public.invoices (status, due_date);
create index if not exists idx_payments_invoice_id on public.payments (invoice_id);
create index if not exists idx_notifications_user_created on public.notifications (user_id, created_at desc);

-- Automatically maintain updated_at fields.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = pg_catalog.now();
    return new;
end;
$$;

-- Automatically create a profile for each new Supabase Auth user.
-- The role is always 'client' at signup; privileged roles must be assigned server-side.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, display_name, email, phone, role)
    values (
        new.id,
        coalesce(
            nullif(new.raw_user_meta_data ->> 'display_name', ''),
            nullif(new.raw_user_meta_data ->> 'full_name', ''),
            nullif(pg_catalog.split_part(coalesce(new.email, ''), '@', 1), ''),
            'New user'
        ),
        new.email,
        nullif(new.phone, ''),
        'client'
    )
    on conflict (id) do update
        set email = excluded.email;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Trigger functions should not be callable directly through the Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated, service_role;

-- Create default settings for every new profile.
create or replace function public.create_default_user_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.user_settings (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

    return new;
end;
$$;

drop trigger if exists trg_profile_default_settings on public.profiles;
create trigger trg_profile_default_settings
after insert on public.profiles
for each row execute function public.create_default_user_settings();

revoke execute on function public.create_default_user_settings() from public, anon, authenticated, service_role;

-- Re-create timestamp triggers safely so this script can be re-run during setup.
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_milestones_updated_at on public.milestones;
create trigger trg_milestones_updated_at before update on public.milestones
for each row execute function public.set_updated_at();

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at before update on public.user_settings
for each row execute function public.set_updated_at();

revoke execute on function public.set_updated_at() from public, anon, authenticated, service_role;

-- The website and Android app will use the Node.js API with a server-only database connection.
-- Keep these tables unavailable through the Supabase Data API until explicit, tested policies are designed.
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.documents enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.user_settings enable row level security;

revoke all on table
    public.profiles,
    public.clients,
    public.projects,
    public.milestones,
    public.documents,
    public.invoices,
    public.payments,
    public.notifications,
    public.user_settings
from anon, authenticated, service_role;

commit;
