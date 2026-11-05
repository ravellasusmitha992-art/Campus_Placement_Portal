package com.campusplacement.controller;

import com.campusplacement.dto.ApiResponse;
import com.campusplacement.dto.LoginRequest;
import com.campusplacement.entity.Admin;
import com.campusplacement.entity.Student;
import com.campusplacement.service.AuthService;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService a) { auth = a; }

    @PostMapping("/login")
    public ApiResponse login(@RequestBody LoginRequest r) {
        Object o = auth.login(r);
        Map<String,Object> m = new HashMap<>();
        if (o instanceof Admin) {
            Admin a = (Admin)o; m.put("id",a.getId()); m.put("name",a.getName()); m.put("email",a.getEmail()); m.put("role","admin");
        } else {
            Student s = (Student)o; m.put("id",s.getId()); m.put("name",s.getName()); m.put("email",s.getEmail()); m.put("rollNumber",s.getRollNumber()); m.put("role","student");
        }
        return new ApiResponse(true,"Login successful",m);
    }

    @PostMapping("/register")
    public ApiResponse register(@RequestBody Student s) {
        Student x = auth.register(s); x.setPassword(null); x.setConfirmPassword(null);
        return new ApiResponse(true,"Registration successful",x);
    }
}
