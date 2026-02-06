-- Add unit goal columns to categories table
-- Run this in Supabase SQL Editor

ALTER TABLE categories ADD COLUMN IF NOT EXISTS unit_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS unit_name TEXT DEFAULT '';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS unit_target INTEGER DEFAULT 0;
