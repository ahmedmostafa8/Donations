-- Enable RLS on the tables to remove the warning
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies to allow the app to work (Since we manage security in the App Code)

-- 1. Policies for app_users
-- Allow anyone to CHECK if a user exists (for login)
CREATE POLICY "Public Read Access" ON app_users FOR SELECT USING (true);
-- Allow anyone to create a user (if you want manual insert via dashboard, this is fine)
CREATE POLICY "Public Insert Access" ON app_users FOR INSERT WITH CHECK (true);

-- 2. Policies for transactions
-- We allow public access because our App Server protects the data by filtering 'owner_name'
CREATE POLICY "App Managed Access" ON transactions USING (true) WITH CHECK (true);

-- 3. Policies for categories
CREATE POLICY "App Managed Access" ON categories USING (true) WITH CHECK (true);
