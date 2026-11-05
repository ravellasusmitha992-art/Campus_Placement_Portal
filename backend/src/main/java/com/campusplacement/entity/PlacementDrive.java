package com.campusplacement.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity @Table(name="placement_drives")
public class PlacementDrive {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Integer id;
    @ManyToOne @JoinColumn(name="company_id") private Company company;
    @Column(name="job_role") private String jobRole;
    @Column(name="drive_date") private LocalDate driveDate;
    @Column(name="reg_start_date") private LocalDate regStartDate;
    @Column(name="reg_end_date") private LocalDate regEndDate;
    @Column(name="job_location") private String jobLocation;
    @Column(name="salary_package") private Double salaryPackage;
    @Lob @Column(name="job_description") private String jobDescription;
    @Lob @Column(name="required_skills") private String requiredSkills;
    @Column(name="min_cgpa") private Double minCgpa;
    @Column(name="min_tenth_percentage") private Double minTenthPercentage;
    @Column(name="min_twelfth_percentage") private Double minTwelfthPercentage;
    @Column(name="max_backlogs") private Integer maxBacklogs;
    @Column(name="eligible_departments") private String eligibleDepartments;
    @Column(name="graduation_year") private Integer graduationYear;
    @Lob @Column(name="selection_process") private String selectionProcess;
    private Integer vacancies; private String status;
    @Column(name="application_link", length=1000) private String applicationLink;
    public Integer getId(){return id;} public void setId(Integer v){id=v;} public Company getCompany(){return company;} public void setCompany(Company v){company=v;}
    public String getJobRole(){return jobRole;} public void setJobRole(String v){jobRole=v;} public LocalDate getDriveDate(){return driveDate;} public void setDriveDate(LocalDate v){driveDate=v;}
    public LocalDate getRegStartDate(){return regStartDate;} public void setRegStartDate(LocalDate v){regStartDate=v;} public LocalDate getRegEndDate(){return regEndDate;} public void setRegEndDate(LocalDate v){regEndDate=v;}
    public String getJobLocation(){return jobLocation;} public void setJobLocation(String v){jobLocation=v;} public Double getSalaryPackage(){return salaryPackage;} public void setSalaryPackage(Double v){salaryPackage=v;}
    public String getJobDescription(){return jobDescription;} public void setJobDescription(String v){jobDescription=v;} public String getRequiredSkills(){return requiredSkills;} public void setRequiredSkills(String v){requiredSkills=v;}
    public Double getMinCgpa(){return minCgpa;} public void setMinCgpa(Double v){minCgpa=v;} public Double getMinTenthPercentage(){return minTenthPercentage;} public void setMinTenthPercentage(Double v){minTenthPercentage=v;}
    public Double getMinTwelfthPercentage(){return minTwelfthPercentage;} public void setMinTwelfthPercentage(Double v){minTwelfthPercentage=v;} public Integer getMaxBacklogs(){return maxBacklogs;} public void setMaxBacklogs(Integer v){maxBacklogs=v;}
    public String getEligibleDepartments(){return eligibleDepartments;} public void setEligibleDepartments(String v){eligibleDepartments=v;} public Integer getGraduationYear(){return graduationYear;} public void setGraduationYear(Integer v){graduationYear=v;}
    public String getSelectionProcess(){return selectionProcess;} public void setSelectionProcess(String v){selectionProcess=v;} public Integer getVacancies(){return vacancies;} public void setVacancies(Integer v){vacancies=v;} public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public String getApplicationLink(){return applicationLink;} public void setApplicationLink(String v){applicationLink=v;}
}
