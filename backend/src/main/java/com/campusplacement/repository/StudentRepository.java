package com.campusplacement.repository;
import com.campusplacement.entity.Student; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface StudentRepository extends JpaRepository<Student,Integer>{ Optional<Student> findByEmail(String email); Optional<Student> findByRollNumber(String rollNumber); List<Student> findByDepartmentIgnoreCase(String department); List<Student> findByRollNumberBetween(String fromRollNumber,String toRollNumber); List<Student> findByRollNumberIn(Collection<String> rollNumbers); }
