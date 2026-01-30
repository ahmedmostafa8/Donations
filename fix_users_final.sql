-- fix_users_final.sql

-- 1. Create New Users (Full Names with IDs)
INSERT INTO app_users (username) VALUES ('ادم محمد 50650') ON CONFLICT DO NOTHING;
INSERT INTO app_users (username) VALUES ('نسرين النجار 30730') ON CONFLICT DO NOTHING;
INSERT INTO app_users (username) VALUES ('نور إبراهيم 707064') ON CONFLICT DO NOTHING;

-- 2. Drop existing foreign keys to allow mass updates
-- We drop both standard names and potential existing ones
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_owner_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_owner_name_fkey;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_owner_name_fkey;

-- 3. Migrate Data (Transactions & Categories)
-- Migrate 'ادم' and 'adam' -> 'ادم محمد 50650'
UPDATE categories SET owner_name = 'ادم محمد 50650' WHERE owner_name IN ('adam', 'ادم');
UPDATE transactions SET owner_name = 'ادم محمد 50650' WHERE owner_name IN ('adam', 'ادم');

-- Migrate 'نسرين' and 'nesreen' -> 'نسرين النجار 30730'
UPDATE categories SET owner_name = 'نسرين النجار 30730' WHERE owner_name IN ('nesreen', 'نسرين');
UPDATE transactions SET owner_name = 'نسرين النجار 30730' WHERE owner_name IN ('nesreen', 'نسرين');

-- Migrate 'نور' and 'nour' -> 'نور إبراهيم 707064'
UPDATE categories SET owner_name = 'نور إبراهيم 707064' WHERE owner_name IN ('nour', 'نور');
UPDATE transactions SET owner_name = 'نور إبراهيم 707064' WHERE owner_name IN ('nour', 'نور');

-- 4. Re-create Constraints with ON DELETE CASCADE
-- This ensures that if you delete a user in the future, their data is deleted or handled automatically (Cascade).

-- Transactions -> App User
ALTER TABLE transactions ADD CONSTRAINT transactions_owner_name_fkey 
    FOREIGN KEY (owner_name) REFERENCES app_users(username) ON DELETE CASCADE;

-- Categories -> App User
ALTER TABLE categories ADD CONSTRAINT categories_owner_name_fkey 
    FOREIGN KEY (owner_name) REFERENCES app_users(username) ON DELETE CASCADE;

-- Transactions -> Categories (Composite Key)
ALTER TABLE transactions ADD CONSTRAINT transactions_category_owner_fkey 
  FOREIGN KEY (category, owner_name) REFERENCES categories (name, owner_name) ON DELETE CASCADE;

-- 5. Delete Old Users
-- Now it is safe to delete old users because their data has been moved.
DELETE FROM app_users WHERE username IN ('adam', 'ادم', 'nesreen', 'نسرين', 'nour', 'نور');
