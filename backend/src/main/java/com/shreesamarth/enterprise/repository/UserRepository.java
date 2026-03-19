package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    @Query("SELECT u FROM User u JOIN FETCH u.tenant WHERE u.username = :username")
    Optional<User> findByUsernameWithTenant(@Param("username") String username);

    boolean existsByUsername(String username);
    List<User> findByTenantId(Long tenantId);
}
