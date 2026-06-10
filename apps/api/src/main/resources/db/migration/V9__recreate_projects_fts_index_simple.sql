DROP INDEX IF EXISTS idx_projects_fts;
DROP INDEX IF EXISTS idx_projects_fts_simple;

CREATE INDEX idx_projects_fts_simple
ON projects
USING GIN (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(notes, ''))
);