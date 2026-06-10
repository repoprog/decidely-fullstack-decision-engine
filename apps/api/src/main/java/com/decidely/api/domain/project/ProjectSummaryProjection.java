package com.decidely.api.domain.project;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public interface ProjectSummaryProjection {
    UUID getId();

    String getTitle();

    ProjectType getType();

    Set<String> getTags();

    String getCategory();

    String getNotes();

    Instant getCreatedAt();

    Instant getUpdatedAt();

    Integer getSnapshotCount();
}