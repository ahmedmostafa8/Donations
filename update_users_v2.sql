-- 1. Create new users
INSERT INTO app_users (username) VALUES ('ادم محمد 50650') ON CONFLICT DO NOTHING;
INSERT INTO app_users (username) VALUES ('نسرين النجار 30730') ON CONFLICT DO NOTHING;
INSERT INTO app_users (username) VALUES ('نور إبراهيم 707064') ON CONFLICT DO NOTHING;

-- 2. Disable constraints temporarily to allow updating PK/FK data without ordering issues
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_owner_fkey;

-- 3. Migrate 'adam' -> 'ادم محمد 50650'
UPDATE categories SET owner_name = 'ادم محمد 50650' WHERE owner_name = 'adam';
UPDATE transactions SET owner_name = 'ادم محمد 50650' WHERE owner_name = 'adam';

-- 4. Migrate 'nesreen' -> 'نسرين النجار 30730'
UPDATE categories SET owner_name = 'نسرين النجار 30730' WHERE owner_name = 'nesreen';
UPDATE transactions SET owner_name = 'نسرين النجار 30730' WHERE owner_name = 'nesreen';

-- 5. Restore constraints
ALTER TABLE transactions ADD CONSTRAINT transactions_category_owner_fkey 
  FOREIGN KEY (category, owner_name) REFERENCES categories (name, owner_name) ON DELETE CASCADE;

-- 6. Cleanup old users
DELETE FROM app_users WHERE username = 'adam';
DELETE FROM app_users WHERE username = 'nesreen';
