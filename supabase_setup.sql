-- 1. Create the simple users table
CREATE TABLE IF NOT EXISTS app_users (
  username TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add owner_name column to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS owner_name TEXT REFERENCES app_users(username);

-- 3. Create default users
INSERT INTO app_users (username) VALUES ('adam') ON CONFLICT DO NOTHING;
INSERT INTO app_users (username) VALUES ('nesreen') ON CONFLICT DO NOTHING;

-- 4. MIGRATE DATA (Assign all current data to adam)
UPDATE transactions SET owner_name = 'adam' WHERE owner_name IS NULL;

-- 5. ISOLATE CATEGORIES (New Requirement)
-- Add owner_name to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS owner_name TEXT REFERENCES app_users(username);
UPDATE categories SET owner_name = 'adam' WHERE owner_name IS NULL;

-- 6. UPDATE CONSTRAINTS (Allow duplicate names for different users)
-- We need to drop the old Primary Key on 'name' and allow (name, owner_name) to be unique
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_fkey;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE categories ADD PRIMARY KEY (name, owner_name);
ALTER TABLE transactions ADD CONSTRAINT transactions_category_owner_fkey 
  FOREIGN KEY (category, owner_name) REFERENCES categories (name, owner_name) ON DELETE CASCADE;
