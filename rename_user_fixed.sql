-- 1. Create the new user 'ادم'
INSERT INTO app_users (username) VALUES ('ادم') ON CONFLICT DO NOTHING;

-- 2. DISABLE CONSTRAINTS TEMPORARILY (Safest way for migration)
-- Or we just do it in the correct order:

-- A. Duplicate Categories for 'ادم' first (if we are updating owner, we must handle the FK)
-- The problem is Trans depend on (Category, Owner). We can't change Trans Owner until Category Owner is changed.
-- BUT we can't change Category Owner because Trans depends on OLD Category Owner.
-- It's a deadlock of constraints.

-- SOLUTION: Drop constraint -> Update -> Add constraint back.

ALTER TABLE transactions DROP CONSTRAINT transactions_category_owner_fkey;

UPDATE categories SET owner_name = 'ادم' WHERE owner_name = 'adam';
UPDATE transactions SET owner_name = 'ادم' WHERE owner_name = 'adam';

-- Re-add the constraint
ALTER TABLE transactions ADD CONSTRAINT transactions_category_owner_fkey 
  FOREIGN KEY (category, owner_name) REFERENCES categories (name, owner_name) ON DELETE CASCADE;

-- Delete old user
DELETE FROM app_users WHERE username = 'adam';
