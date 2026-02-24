-- Families App Database Schema
-- Created: 2026-02-07

-- Families Table
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  family_code INTEGER UNIQUE NOT NULL,
  list_id INTEGER NOT NULL DEFAULT 1,
  
  -- Wife (Primary Contact)
  wife_name TEXT NOT NULL,
  wife_national_id TEXT,
  wife_phone TEXT,
  wife_job TEXT DEFAULT 'لا تعمل',
  
  -- Husband
  husband_name TEXT,
  husband_status TEXT DEFAULT 'متواجد', -- متوفي / متواجد
  husband_national_id TEXT,
  husband_phone TEXT,
  husband_job TEXT DEFAULT 'لا يعمل',
  
  -- Housing & Financials
  address TEXT,
  housing_condition TEXT,
  income_details TEXT,
  
  -- Status Category
  status TEXT DEFAULT 'أسرة رقيقة الحال',
  -- Options: مرضي, أيتام, ظروف خاصة, أسرة رقيقة الحال, أسرة غارمة, مشروع باب رزق, أسرة خارجية
  
  -- Attachments (Cloudinary URLs as JSONB array)
  -- Format: [{ "url": "...", "label": "...", "public_id": "..." }]
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Children Table
CREATE TABLE IF NOT EXISTS family_children (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
  child_type TEXT NOT NULL, -- ابن / ابنة
  child_name TEXT NOT NULL,
  child_age INTEGER,
  child_education TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_families_family_code ON families(family_code);
CREATE INDEX IF NOT EXISTS idx_families_list_id ON families(list_id);
CREATE INDEX IF NOT EXISTS idx_families_status ON families(status);
CREATE INDEX IF NOT EXISTS idx_families_wife_name ON families(wife_name);
CREATE INDEX IF NOT EXISTS idx_families_wife_phone ON families(wife_phone);
CREATE INDEX IF NOT EXISTS idx_families_wife_national_id ON families(wife_national_id);
CREATE INDEX IF NOT EXISTS idx_family_children_family_id ON family_children(family_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE families;
ALTER PUBLICATION supabase_realtime ADD TABLE family_children;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
