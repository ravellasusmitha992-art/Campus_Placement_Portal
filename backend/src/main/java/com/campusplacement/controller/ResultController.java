package com.campusplacement.controller;
import com.campusplacement.dto.ApiResponse; import com.campusplacement.entity.PlacementResult; import com.campusplacement.repository.PlacementResultRepository; import com.campusplacement.service.PlacementService; import org.springframework.web.bind.annotation.*; import java.util.*; import java.util.stream.*;
@RestController @RequestMapping("/results")
public class ResultController { private final PlacementResultRepository repo; private final PlacementService service; public ResultController(PlacementResultRepository r,PlacementService s){repo=r;service=s;}
 private Map<String,Object> view(PlacementResult r){Map<String,Object> m=new LinkedHashMap<>();m.put("id",r.getId());m.put("studentId",r.getStudent().getId());m.put("student",r.getStudent().getName());m.put("company",r.getDrive().getCompany().getName());m.put("role",r.getDrive().getJobRole());m.put("package",r.getPackageValue());m.put("status",r.getStatus());m.put("joiningDate",r.getJoiningDate());return m;}
 @GetMapping public List<Map<String,Object>> all(){return repo.findAll().stream().map(this::view).collect(Collectors.toList());}
 @PostMapping public ApiResponse create(@RequestBody Map<String,String> body){return new ApiResponse(true,"Result published",view(service.publishResult(body)));}
}
