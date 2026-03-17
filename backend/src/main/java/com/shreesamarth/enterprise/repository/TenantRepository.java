package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByCompanyCode(String companyCode);
    Optional<Tenant> findByCompanyName(String companyName);
}
