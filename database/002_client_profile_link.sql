-- Migration 002:
-- Link client records to their authenticated user profiles.

BEGIN;

-- Add a profile reference to each client record.
ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Ensure the profile reference is valid.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'clients_profile_id_fkey'
          AND conrelid = 'public.clients'::regclass
    ) THEN
        ALTER TABLE public.clients
            ADD CONSTRAINT clients_profile_id_fkey
            FOREIGN KEY (profile_id)
            REFERENCES public.profiles(id)
            ON DELETE SET NULL;
    END IF;
END
$$;

-- A profile can be linked to only one client record.
CREATE UNIQUE INDEX IF NOT EXISTS clients_profile_id_unique_idx
    ON public.clients (profile_id)
    WHERE profile_id IS NOT NULL;

COMMIT;