package com.campusplacement.controller;
import com.campusplacement.dto.ApiResponse; import com.campusplacement.entity.*; import com.campusplacement.repository.*; import com.campusplacement.service.PlacementService; import org.springframework.web.bind.annotation.*; import java.time.LocalDateTime; import java.util.*;
@RestController @RequestMapping("/notifications")
public class NotificationController { private final NotificationRepository repo; private final StudentRepository students; private final PlacementService service; public NotificationController(NotificationRepository r,StudentRepository s,PlacementService p){repo=r;students=s;service=p;}
 @GetMapping("/student/{id}") public List<Notification> byStudent(@PathVariable Integer id){return repo.findByStudentIdOrStudentIsNullOrderByCreatedDateDesc(id);}
 @PostMapping public ApiResponse create(@RequestBody Map<String,Object> b){return new ApiResponse(true,"Notification sent",service.bulkNotify(new HashMap<String,Object>(){{putAll(b);if(!containsKey("targetType"))put("targetType",(b.get("studentId")==null&&b.get("studentRollNumber")==null)?"ALL":"INDIVIDUAL");}}));}
 @PostMapping("/bulk") public ApiResponse bulk(@RequestBody Map<String,Object> b){return new ApiResponse(true,"Notification sent to "+service.bulkNotify(b)+" student(s)",null);}
 @PutMapping("/{id}/read") public ApiResponse read(@PathVariable Integer id){Notification n=repo.findById(id).orElseThrow(()->new IllegalArgumentException("Notification not found"));n.setRead(true);return new ApiResponse(true,"Marked as read",repo.save(n));}
}
