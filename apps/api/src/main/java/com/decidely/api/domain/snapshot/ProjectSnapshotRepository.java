package com.decidely.api.domain.snapshot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectSnapshotRepository extends JpaRepository<ProjectSnapshot, UUID> {
    List<ProjectSnapshot> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Optional<ProjectSnapshot> findByIdAndProjectId(UUID id, UUID projectId);

    long countByProjectId(UUID projectId);
}