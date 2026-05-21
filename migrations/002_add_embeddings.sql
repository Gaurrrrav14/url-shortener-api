-- Add new columns
ALTER TABLE urls ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE urls ADD COLUMN IF NOT EXISTS page_title TEXT;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS page_summary TEXT;

-- Create vector index safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_urls_embedding'
  ) THEN
    CREATE INDEX idx_urls_embedding
    ON urls
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  END IF;
END$$;