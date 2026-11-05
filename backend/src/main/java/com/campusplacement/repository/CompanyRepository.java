package com.campusplacement.repository;

import com.campusplacement.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Integer> {
    Optional<Company> findByNameIgnoreCase(String name);
}
