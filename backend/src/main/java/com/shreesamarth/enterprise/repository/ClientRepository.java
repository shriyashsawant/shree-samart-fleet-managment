package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    Optional<Client> findByGstNumber(String gstNumber);
    boolean existsByGstNumber(String gstNumber);
    List<Client> findByTenantId(Long tenantId);
}
