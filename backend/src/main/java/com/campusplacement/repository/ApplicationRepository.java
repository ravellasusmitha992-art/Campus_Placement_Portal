package com.campusplacement.repository;
import com.campusplacement.entity.Application; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface ApplicationRepository extends JpaRepository<Application,Integer>{ List<Application> findByStudentId(Integer studentId); List<Application> findByDriveId(Integer driveId); Optional<Application> findByStudentIdAndDriveId(Integer studentId,Integer driveId); List<Application> findByDriveIdAndStudentIdIn(Integer driveId,Collection<Integer> studentIds); }
