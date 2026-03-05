-- Voice Vault initial schema

CREATE TABLE memos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  title       TEXT NOT NULL,
  raw_transcript  TEXT,
  summary_md      TEXT,
  audio_path      TEXT,
  duration_sec    INTEGER,
  language        TEXT DEFAULT 'ko',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE memo_groups (
  memo_id     UUID REFERENCES memos(id) ON DELETE CASCADE,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (memo_id, group_id)
);

-- Indexes
CREATE INDEX idx_memos_user_id ON memos(user_id);
CREATE INDEX idx_memos_created_at ON memos(created_at DESC);
CREATE INDEX idx_groups_user_id ON groups(user_id);
CREATE INDEX idx_memo_groups_memo ON memo_groups(memo_id);
CREATE INDEX idx_memo_groups_group ON memo_groups(group_id);

-- RLS
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE memo_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memos"
  ON memos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own groups"
  ON groups FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own memo_groups"
  ON memo_groups FOR ALL
  USING (
    EXISTS (SELECT 1 FROM memos WHERE memos.id = memo_groups.memo_id AND memos.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM memos WHERE memos.id = memo_groups.memo_id AND memos.user_id = auth.uid())
  );
