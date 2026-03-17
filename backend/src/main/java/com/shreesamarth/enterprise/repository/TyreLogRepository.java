package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.TyreLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TyreLogRepository extends JpaRepository<TyreLog, Long> {
    List<TyreLog> findByTyreIdOrderByLogDateDesc(Long tyreId);
}
