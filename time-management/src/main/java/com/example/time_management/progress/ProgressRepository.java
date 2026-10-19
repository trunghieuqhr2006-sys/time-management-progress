package com.example.time_management.progress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProgressRepository extends JpaRepository<Progress, Long> {

    Optional<Progress> findByTaskId(Long taskId);

    boolean existsByTaskId(Long taskId);

    long countByCompletedTrue();
}
