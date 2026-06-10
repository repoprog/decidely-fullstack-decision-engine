package com.decidely.api.domain.project;

import com.decidely.api.api.admin.dto.SystemStatsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    Optional<Project> findByIdAndIsDeletedFalse(UUID id);

    Optional<Project> findByIdAndOwnerIdAndIsDeletedFalse(UUID id, UUID ownerId);

    boolean existsByIdAndOwnerIdAndIsDeletedFalse(UUID id, UUID ownerId);

    @Query(
            value = """
                    SELECT
                        p.id AS id,
                        p.title AS title,
                        p.type AS type,
                        p.tags AS tags,
                        p.category AS category,
                        p.notes AS notes,
                        p.created_at AS createdAt,
                        p.updated_at AS updatedAt,
                        COUNT(s.id)::int AS snapshotCount
                    FROM projects p
                    LEFT JOIN project_snapshots s ON s.project_id = p.id
                    WHERE p.owner_id = :ownerId
                      AND p.is_deleted = false
                      AND (:type IS NULL OR p.type = :type)
                      AND (:category IS NULL OR p.category = :category)
                      AND (
                          CAST(:search AS TEXT) IS NULL
                          OR to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.notes, ''))
                             @@ plainto_tsquery('simple', CAST(:search AS TEXT))
                      )
                    GROUP BY p.id
                    """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM projects p
                    WHERE p.owner_id = :ownerId
                      AND p.is_deleted = false
                      AND (:type IS NULL OR p.type = :type)
                      AND (:category IS NULL OR p.category = :category)
                      AND (
                          CAST(:search AS TEXT) IS NULL
                          OR to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.notes, ''))
                             @@ plainto_tsquery('simple', CAST(:search AS TEXT))
                      )
                    """,
            nativeQuery = true
    )
    Page<ProjectSummaryProjection> findProjectSummariesByCriteria(
            @Param("ownerId")
            UUID ownerId,
            @Param("type")
            String type,
            @Param("category")
            String category,
            @Param("search")
            String search,
            Pageable pageable
    );

    @Query(
            value = """
                    SELECT
                        (SELECT COUNT(*) FROM users) AS totalUsers,
                        (SELECT COUNT(*) FROM projects WHERE is_deleted = false) AS totalProjects,
                        (SELECT COUNT(*) FROM projects WHERE type = 'TREE' AND is_deleted = false) AS projectsByTypeTree,
                        (SELECT COUNT(*) FROM projects WHERE type = 'TABLE' AND is_deleted = false) AS projectsByTypeTable,
                        (SELECT COUNT(*) FROM project_shares WHERE expires_at IS NULL OR expires_at > NOW()) AS activeShareLinks
                    """, nativeQuery = true
    )
    SystemStatsDTO getSystemStats();
}