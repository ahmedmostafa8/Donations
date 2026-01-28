-- 1. Create the new user 'ادم'
INSERT INTO app_users (username) VALUES ('ادم') ON CONFLICT DO NOTHING;

-- 2. Move Transactions to 'ادم'
UPDATE transactions 
SET owner_name = 'ادم' 
WHERE owner_name = 'adam';

-- 3. Move Categories to 'ادم'
-- Note: If 'ادم' already has a category with the same name, we might have a conflict.
-- Ideally we update, but in simple case, let's just update owner.
UPDATE categories 
SET owner_name = 'ادم' 
WHERE owner_name = 'adam';

-- 4. Delete the old user 'adam' (Optional, but clean)
DELETE FROM app_users WHERE username = 'adam';
