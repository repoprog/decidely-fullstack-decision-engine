CREATE INDEX idx_projects_content ON projects USING GIN (content jsonb_path_ops);
CREATE INDEX idx_projects_tags ON projects USING GIN (tags);
CREATE INDEX idx_projects_fts ON projects USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(notes, '')));