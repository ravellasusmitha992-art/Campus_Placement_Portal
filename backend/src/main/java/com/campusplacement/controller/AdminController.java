package com.campusplacement.controller;
import com.campusplacement.repository.*; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/admin")
public class AdminController { private final StudentRepository students; private final CompanyRepository companies; private final PlacementDriveRepository drives; private final ApplicationRepository apps; private final InterviewRepository interviews; private final PlacementResultRepository results;
 public AdminController(StudentRepository s,CompanyRepository c,PlacementDriveRepository d,ApplicationRepository a,InterviewRepository i,PlacementResultRepository r){students=s;companies=c;drives=d;apps=a;interviews=i;results=r;}
 @GetMapping("/stats") public Map<String,Object> stats(){Map<String,Object> m=new LinkedHashMap<>();m.put("students",students.count());m.put("companies",companies.count());m.put("drives",drives.count());m.put("applications",apps.count());m.put("interviews",interviews.count());m.put("results",results.count());return m;}
}
