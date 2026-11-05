package com.campusplacement.repository;
import com.campusplacement.entity.PlacementResult; import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface PlacementResultRepository extends JpaRepository<PlacementResult,Integer>{ List<PlacementResult> findByStudentId(Integer studentId); }
