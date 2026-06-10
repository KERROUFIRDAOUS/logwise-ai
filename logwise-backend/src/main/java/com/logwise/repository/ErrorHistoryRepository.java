package com.logwise.repository;

import com.logwise.entity.ErrorHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ErrorHistoryRepository extends JpaRepository<ErrorHistory, Long> {
    Optional<ErrorHistory> findByErrorKey(String errorKey);
}