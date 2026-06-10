CREATE TABLE project_shares (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    shared_with_email VARCHAR(255),
    permission VARCHAR(50) NOT NULL,
    token VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);