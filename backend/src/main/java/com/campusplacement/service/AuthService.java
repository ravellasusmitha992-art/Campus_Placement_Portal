package com.campusplacement.service;

import com.campusplacement.dto.LoginRequest;
import com.campusplacement.entity.Admin;
import com.campusplacement.entity.Student;
import com.campusplacement.repository.AdminRepository;
import com.campusplacement.repository.StudentRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AdminRepository admins;
    private final StudentRepository students;
    private final PasswordEncoder encoder;

    public AuthService(AdminRepository a, StudentRepository s, PasswordEncoder e) {
        admins = a; students = s; encoder = e;
    }

    public Object login(LoginRequest r) {
        if (r == null || r.getEmail() == null || r.getPassword() == null || r.getRole() == null)
            throw new IllegalArgumentException("Email, password and role are required");
        String email = r.getEmail().trim().toLowerCase();
        String password = r.getPassword();
        if ("admin".equalsIgnoreCase(r.getRole())) {
            return admins.findByEmail(email)
                    .filter(a -> a.getPassword() != null && encoder.matches(password, a.getPassword()))
                    .orElseThrow(() -> new IllegalArgumentException("Invalid admin email or password"));
        }
        if (!"student".equalsIgnoreCase(r.getRole()))
            throw new IllegalArgumentException("Invalid role");
        return students.findByEmail(email)
                .filter(s -> s.getPassword() != null && encoder.matches(password, s.getPassword()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid student email or password"));
    }

    public Student register(Student s) {
        if (s == null || s.getEmail() == null || s.getPassword() == null || s.getPassword().trim().isEmpty())
            throw new IllegalArgumentException("Email and password are required");
        if (s.getConfirmPassword() == null || !s.getPassword().equals(s.getConfirmPassword()))
            throw new IllegalArgumentException("Password and confirm password do not match");
        s.setEmail(s.getEmail().trim().toLowerCase());
        if (students.findByEmail(s.getEmail()).isPresent()) throw new IllegalArgumentException("Email already registered");
        if (s.getRollNumber() == null || s.getRollNumber().trim().isEmpty()) throw new IllegalArgumentException("Roll number is required");
        if (students.findByRollNumber(s.getRollNumber().trim()).isPresent()) throw new IllegalArgumentException("Roll number already registered");
        s.setRollNumber(s.getRollNumber().trim());
        s.setPassword(encoder.encode(s.getPassword()));
        s.setConfirmPassword(null);
        if (s.getBacklogs() == null) s.setBacklogs(0);
        return students.save(s);
    }
}
