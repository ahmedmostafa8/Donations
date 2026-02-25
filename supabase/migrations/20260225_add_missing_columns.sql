-- Add missing columns to families table
-- These fields exist in the form & TypeScript types but were never added to the DB
-- Date: 2026-02-25

-- Location fields (split from single 'address' field)
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS street TEXT;

-- Housing type (إيجار / تمليك)
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS housing_type TEXT DEFAULT 'إيجار';

-- Monthly income (numeric for calculations/analytics)
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS monthly_income NUMERIC;

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_families_governorate ON families(governorate);
CREATE INDEX IF NOT EXISTS idx_families_monthly_income ON families(monthly_income);
CREATE INDEX IF NOT EXISTS idx_families_housing_type ON families(housing_type);
