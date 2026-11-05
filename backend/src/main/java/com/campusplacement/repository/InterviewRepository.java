package com.campusplacement.repository;
import com.campusplacement.entity.Interview; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface InterviewRepository extends JpaRepository<Interview,Integer>{ List<Interview> findByStudentId(Integer studentId); List<Interview> findByDriveId(Integer driveId); boolean existsByApplicationIdAndRound(Integer applicationId,String round); }
