package com.campusplacement.repository;
import com.campusplacement.entity.Notification; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface NotificationRepository extends JpaRepository<Notification,Integer>{ List<Notification> findByStudentIdOrStudentIsNullOrderByCreatedDateDesc(Integer studentId); }
