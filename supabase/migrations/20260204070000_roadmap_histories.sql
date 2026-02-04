CREATE TABLE roadmap_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input JSONB NOT NULL,
  summary JSONB NOT NULL,
  series JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX roadmap_histories_user_id_idx ON roadmap_histories (user_id);
CREATE INDEX roadmap_histories_created_at_idx ON roadmap_histories (created_at);

CREATE TRIGGER roadmap_histories_set_updated_at
BEFORE UPDATE ON roadmap_histories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE roadmap_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own roadmap histories"
ON roadmap_histories
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
