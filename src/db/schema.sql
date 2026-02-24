-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- =============================================
-- DONATIONS APP - SUPABASE SCHEMA
-- =============================================

-- Users table (simple username-based auth)
CREATE TABLE public.app_users (
  username text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  display_name text,
  CONSTRAINT app_users_pkey PRIMARY KEY (username)
);

-- Categories (tabs) - each user can have multiple categories
CREATE TABLE public.categories (
  name text NOT NULL,
  owner_name text NOT NULL DEFAULT 'adam'::text,
  target_amount numeric DEFAULT 0,        -- Financial goal
  unit_enabled boolean DEFAULT false,      -- Enable unit-based tracking
  unit_name text DEFAULT ''::text,         -- e.g., "شنطة"
  unit_price numeric DEFAULT 0,            -- Price per unit
  unit_target integer DEFAULT 0,           -- Target units to reach
  CONSTRAINT categories_pkey PRIMARY KEY (name, owner_name),
  CONSTRAINT categories_owner_name_fkey FOREIGN KEY (owner_name) REFERENCES public.app_users(username)
);

-- Transactions (donations/expenses)
CREATE TABLE public.transactions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  name text NOT NULL,                      -- Donor/recipient name
  amount numeric NOT NULL,                 -- Positive = income, Negative = expense
  note text,                               -- Optional note
  category text NOT NULL,                  -- FK to categories.name
  owner_name text,                         -- FK to app_users.username
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_owner_name_fkey FOREIGN KEY (owner_name) REFERENCES public.app_users(username)
);

-- Families
CREATE TABLE public.families (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  family_code integer NOT NULL,
  wife_name text NOT NULL,
  wife_national_id text,
  wife_phone text,
  wife_job text DEFAULT 'لا تعمل',
  husband_name text,
  husband_status text DEFAULT 'متواجد',
  husband_national_id text,
  husband_phone text,
  husband_job text DEFAULT 'لا يعمل',
  address text,
  housing_condition text,
  income_details text,
  status text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  research_date date,
  researcher_name text,
  researcher_phone text,
  researcher_perspective text,
  reference_person text,
  reference_phone text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT families_pkey PRIMARY KEY (id)
);

-- Family Children
CREATE TABLE public.family_children (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  family_id bigint NOT NULL,
  child_type text NOT NULL,
  child_name text NOT NULL,
  child_age integer,
  child_education text,
  CONSTRAINT family_children_pkey PRIMARY KEY (id),
  CONSTRAINT family_children_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE
);
