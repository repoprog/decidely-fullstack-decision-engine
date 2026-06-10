package com.decidely.api.domain.share;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface ProjectShareRepository extends JpaRepository<ProjectShare, UUID> {

    Optional<ProjectShare> findByToken(String token);

    Optional<ProjectShare> findByIdAndProjectId(UUID id, UUID projectId);


    @Query(
            value = """
                        SELECT s FROM ProjectShare s
                        JOIN FETCH s.project p
                        JOIN FETCH p.owner o
                        WHERE s.expiresAt > :now OR s.expiresAt IS NULL
                    """,
            countQuery = "SELECT COUNT(s) FROM ProjectShare s WHERE s.expiresAt > :now OR s.expiresAt IS NULL"
    )
    Page<ProjectShare> findActiveSharesWithDetails(
            @Param("now")
            Instant now, Pageable pageable);
}