ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividend_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own holdings"
ON holdings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings"
ON user_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow read access to dividend data"
ON dividend_data
FOR SELECT
USING (true);
