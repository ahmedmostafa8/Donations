-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Last updated: 2026-02-25

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

  -- Wife (Primary Contact)
  wife_name text NOT NULL,
  wife_national_id text,
  wife_phone text,
  wife_job text DEFAULT 'لا تعمل',

  -- Husband
  husband_name text,
  husband_status text DEFAULT 'متواجد',    -- متوفي / متواجد / منفصل
  husband_national_id text,
  husband_phone text,
  husband_job text DEFAULT 'لا يعمل',

  -- Location (split fields)
  governorate text,                        -- المحافظة
  area text,                               -- المنطقة
  street text,                             -- الشارع
  address text,                            -- العنوان التفصيلي

  -- Housing & Financials
  housing_type text DEFAULT 'إيجار',       -- إيجار / تمليك
  housing_condition text,
  monthly_income numeric,                  -- الدخل الشهري
  income_details text,

  -- Status Category (comma-separated for multi-select)
  -- Options: مرضي, أيتام, ظروف خاصة, أسرة رقيقة الحال, أسرة غارمة, مشروع باب رزق, أسرة خارجية
  status text NOT NULL,

  -- Attachments (Cloudinary URLs as JSONB array)
  -- Format: [{ "url": "...", "label": "...", "public_id": "..." }]
  attachments jsonb DEFAULT '[]'::jsonb,

  -- Researcher Info
  research_date date,
  researcher_name text,
  researcher_phone text,
  researcher_perspective text,
  reference_person text,
  reference_phone text,

  -- Notes
  notes text,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT families_pkey PRIMARY KEY (id)
);

-- Family Children
CREATE TABLE public.family_children (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  family_id bigint NOT NULL,
  child_type text NOT NULL,                -- ابن / ابنة
  child_name text NOT NULL,
  child_age integer,
  child_education text,
  CONSTRAINT family_children_pkey PRIMARY KEY (id),
  CONSTRAINT family_children_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_families_family_code ON families(family_code);
CREATE INDEX idx_families_status ON families(status);
CREATE INDEX idx_families_wife_name ON families(wife_name);
CREATE INDEX idx_families_wife_phone ON families(wife_phone);
CREATE INDEX idx_families_wife_national_id ON families(wife_national_id);
CREATE INDEX idx_families_governorate ON families(governorate);
CREATE INDEX idx_families_monthly_income ON families(monthly_income);
CREATE INDEX idx_families_housing_type ON families(housing_type);
CREATE INDEX idx_family_children_family_id ON family_children(family_id);
