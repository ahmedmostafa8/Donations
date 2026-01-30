-- 1. Add display_name column
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Populate display_name for existing users
-- Trimming the numbers based on known format, or just setting specific values
UPDATE app_users SET display_name = 'ادم محمد' WHERE username LIKE 'ادم محمد%';
UPDATE app_users SET display_name = 'نسرين النجار' WHERE username LIKE 'نسرين النجار%';
UPDATE app_users SET display_name = 'نور إبراهيم' WHERE username LIKE 'نور إبراهيم%';

-- 3. Set a default for any others (fallback to username)
UPDATE app_users SET display_name = username WHERE display_name IS NULL;
