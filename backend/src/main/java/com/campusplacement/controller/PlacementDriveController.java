package com.campusplacement.controller;

import com.campusplacement.entity.Company;
import com.campusplacement.entity.PlacementDrive;
import com.campusplacement.entity.Student;
import com.campusplacement.repository.CompanyRepository;
import com.campusplacement.repository.PlacementDriveRepository;
import com.campusplacement.repository.StudentRepository;
import com.campusplacement.service.PlacementService;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/drives")
public class PlacementDriveController {
    private static final Set<String> STATUSES = new HashSet<>(Arrays.asList(
            "REGISTRATION_OPEN", "UPCOMING", "REGISTRATION_CLOSED", "ONGOING", "COMPLETED"
    ));

    private final PlacementDriveRepository repo;
    private final CompanyRepository companies;
    private final StudentRepository students;
    private final PlacementService service;

    public PlacementDriveController(PlacementDriveRepository r, CompanyRepository c,
                                    StudentRepository s, PlacementService p) {
        repo = r;
        companies = c;
        students = s;
        service = p;
    }

    private Map<String, Object> view(PlacementDrive d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("companyId", d.getCompany() == null ? null : d.getCompany().getId());
        m.put("company", d.getCompany() == null ? "" : d.getCompany().getName());
        m.put("jobRole", d.getJobRole());
        m.put("driveDate", d.getDriveDate());
        m.put("regStartDate", d.getRegStartDate());
        m.put("regEndDate", d.getRegEndDate());
        m.put("jobLocation", d.getJobLocation());
        m.put("salaryPackage", d.getSalaryPackage());
        m.put("jobDescription", d.getJobDescription());
        m.put("requiredSkills", d.getRequiredSkills());
        m.put("minCgpa", d.getMinCgpa());
        m.put("minTenthPercentage", d.getMinTenthPercentage());
        m.put("minTwelfthPercentage", d.getMinTwelfthPercentage());
        m.put("maxBacklogs", d.getMaxBacklogs());
        m.put("eligibleDepartments", d.getEligibleDepartments());
        m.put("graduationYear", d.getGraduationYear());
        m.put("selectionProcess", d.getSelectionProcess());
        m.put("vacancies", d.getVacancies());
        m.put("status", d.getStatus());
        m.put("applicationLink", d.getApplicationLink());
        return m;
    }

    @GetMapping
    public List<Map<String, Object>> all() {
        return repo.findAll().stream().map(this::view).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Map<String, Object> one(@PathVariable Integer id) {
        return view(repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Drive not found")));
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> body) {
        return view(repo.save(from(body, null)));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        if (!repo.existsById(id)) {
            throw new IllegalArgumentException("Drive not found");
        }
        return view(repo.save(from(body, id)));
    }

    private PlacementDrive from(Map<String, Object> b, Integer id) {
        PlacementDrive d = id == null
                ? new PlacementDrive()
                : repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        d.setId(id);

        String companyName = text(b.get("company"));
        if (companyName == null) {
            Number companyId = number(b.get("companyId"));
            if (companyId != null) {
                Company c = companies.findById(companyId.intValue())
                        .orElseThrow(() -> new IllegalArgumentException("Company not found"));
                companyName = c.getName();
            }
        }
        if (companyName == null) {
            throw new IllegalArgumentException("Company is required");
        }

        final String finalCompanyName = companyName;
        Company company = companies.findByNameIgnoreCase(finalCompanyName)
                .orElseGet(() -> createCompany(finalCompanyName, b));
        d.setCompany(company);

        d.setJobRole(requiredText(b.get("jobRole"), "Job role is required"));
        d.setDriveDate(date(b.get("driveDate"), "Drive date is required"));
        d.setRegStartDate(date(b.get("regStartDate"), "Registration start date is required"));
        d.setRegEndDate(date(b.get("regEndDate"), "Registration end date is required"));
        if (d.getRegEndDate().isBefore(d.getRegStartDate())) {
            throw new IllegalArgumentException("Registration end date cannot be before registration start date");
        }
        d.setJobLocation(requiredText(b.get("jobLocation"), "Job location is required"));
        d.setSalaryPackage(doubleValue(b.get("salaryPackage"), "Salary package is required"));
        d.setJobDescription(text(b.get("jobDescription")));
        d.setRequiredSkills(text(b.get("requiredSkills")));
        d.setMinCgpa(doubleValue(b.get("minCgpa"), "Minimum CGPA is required"));
        d.setMinTenthPercentage(doubleValue(b.get("minTenthPercentage"), "Minimum 10th percentage is required"));
        d.setMinTwelfthPercentage(doubleValue(b.get("minTwelfthPercentage"), "Minimum 12th percentage is required"));
        d.setMaxBacklogs(intValue(b.get("maxBacklogs"), "Maximum backlogs is required"));

        String departments = requiredText(b.get("eligibleDepartments"), "Select at least one eligible department");
        d.setEligibleDepartments(normalizeDepartments(departments));
        d.setGraduationYear(intValue(b.get("graduationYear"), "Graduation year is required"));
        d.setSelectionProcess(text(b.get("selectionProcess")));
        d.setVacancies(intValue(b.get("vacancies"), "Vacancies are required"));

        String status = requiredText(b.get("status"), "Status is required").toUpperCase(Locale.ROOT);
        if (!STATUSES.contains(status)) {
            throw new IllegalArgumentException("Invalid placement drive status");
        }
        d.setStatus(status);

        String link = text(b.get("applicationLink"));
        if (link != null) {
            try {
                URI u = URI.create(link);
                if (!"http".equalsIgnoreCase(u.getScheme()) && !"https".equalsIgnoreCase(u.getScheme())) {
                    throw new IllegalArgumentException();
                }
            } catch (Exception ex) {
                throw new IllegalArgumentException("Application link must start with http:// or https://");
            }
        }
        d.setApplicationLink(link);
        return d;
    }

    private Company createCompany(String name, Map<String, Object> b) {
        Company c = new Company();
        c.setName(name);
        c.setIndustry("IT / Technology");
        c.setJobRole(text(b.get("jobRole")) == null ? "Placement Role" : text(b.get("jobRole")));
        c.setJobLocation(text(b.get("jobLocation")) == null ? "Not specified" : text(b.get("jobLocation")));
        c.setSalaryPackage(number(b.get("salaryPackage")) == null ? 0.0 : number(b.get("salaryPackage")).doubleValue());
        c.setJobDescription(text(b.get("jobDescription")));
        c.setRequiredSkills(text(b.get("requiredSkills")));
        return companies.save(c);
    }

    private static String normalizeDepartments(String value) {
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private static String text(Object value) {
        if (value == null) return null;
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? null : s;
    }

    private static String requiredText(Object value, String message) {
        String s = text(value);
        if (s == null) throw new IllegalArgumentException(message);
        return s;
    }

    private static Number number(Object value) {
        if (value == null || String.valueOf(value).trim().isEmpty()) return null;
        if (value instanceof Number) return (Number) value;
        try { return Double.valueOf(String.valueOf(value).trim()); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("Invalid numeric value: " + value); }
    }

    private static double doubleValue(Object value, String message) {
        Number n = number(value);
        if (n == null) throw new IllegalArgumentException(message);
        return n.doubleValue();
    }

    private static int intValue(Object value, String message) {
        Number n = number(value);
        if (n == null) throw new IllegalArgumentException(message);
        return n.intValue();
    }

    private static LocalDate date(Object value, String message) {
        String s = requiredText(value, message);
        try { return LocalDate.parse(s); }
        catch (Exception e) { throw new IllegalArgumentException("Invalid date: " + s); }
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        if (!repo.existsById(id)) throw new IllegalArgumentException("Drive not found");
        repo.deleteById(id);
    }

    @GetMapping("/{driveId}/eligibility/{studentId}")
    public Map<String, Object> eligibility(@PathVariable Integer driveId, @PathVariable Integer studentId) {
        Student s = students.findById(studentId).orElseThrow(() -> new IllegalArgumentException("Student not found"));
        PlacementDrive d = repo.findById(driveId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        boolean eligible = service.eligible(s, d);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("eligible", eligible);
        m.put("message", eligible ? "Eligible to apply" : "Not eligible based on academic, department, or graduation criteria");
        return m;
    }
}
