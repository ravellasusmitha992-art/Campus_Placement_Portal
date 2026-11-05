package com.campusplacement.config;

import com.campusplacement.entity.Admin;
import com.campusplacement.entity.Student;
import com.campusplacement.repository.AdminRepository;
import com.campusplacement.repository.StudentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DemoCredentialInitializer {
    @Bean
    CommandLineRunner repairDemoCredentials(AdminRepository admins, StudentRepository students, PasswordEncoder encoder) {
        return args -> {
            admins.findByEmail("admin@campus.com").ifPresent(a -> { a.setPassword(encoder.encode("admin123")); admins.save(a); });
            students.findByEmail("rahul@student.com").ifPresent(s -> { s.setPassword(encoder.encode("student123")); students.save(s); });
        };
    }
}
