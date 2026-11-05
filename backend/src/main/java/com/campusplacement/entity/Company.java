package com.campusplacement.entity;

import javax.persistence.*;

@Entity @Table(name="companies")
public class Company {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Integer id;
    private String name; private String logo; @Lob private String description; private String industry; private String website;
    @Column(name="job_role") private String jobRole; @Column(name="job_location") private String jobLocation;
    @Column(name="salary_package") private Double salaryPackage; @Lob @Column(name="job_description") private String jobDescription; @Lob @Column(name="required_skills") private String requiredSkills;
    public Integer getId(){return id;} public void setId(Integer v){id=v;} public String getName(){return name;} public void setName(String v){name=v;}
    public String getLogo(){return logo;} public void setLogo(String v){logo=v;} public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public String getIndustry(){return industry;} public void setIndustry(String v){industry=v;} public String getWebsite(){return website;} public void setWebsite(String v){website=v;}
    public String getJobRole(){return jobRole;} public void setJobRole(String v){jobRole=v;} public String getJobLocation(){return jobLocation;} public void setJobLocation(String v){jobLocation=v;}
    public Double getSalaryPackage(){return salaryPackage;} public void setSalaryPackage(Double v){salaryPackage=v;} public String getJobDescription(){return jobDescription;} public void setJobDescription(String v){jobDescription=v;}
    public String getRequiredSkills(){return requiredSkills;} public void setRequiredSkills(String v){requiredSkills=v;}
}
