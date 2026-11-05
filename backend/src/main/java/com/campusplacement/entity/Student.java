package com.campusplacement.entity;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity @Table(name="students")
public class Student {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Integer id;
    @Column(name="roll_number") private String rollNumber; private String name; private String email; private String phone; @JsonIgnore private String password;
    private String department; private String course;
    @Transient private String confirmPassword;
    @Column(name="graduation_year") private Integer graduationYear;
    @Column(name="tenth_percentage") private Double tenthPercentage;
    @Column(name="twelfth_percentage") private Double twelfthPercentage;
    private Double cgpa; private Integer backlogs; @Lob private String skills; private String resume;
    public Integer getId(){return id;} public void setId(Integer id){this.id=id;}
    public String getRollNumber(){return rollNumber;} public void setRollNumber(String v){rollNumber=v;}
    public String getName(){return name;} public void setName(String v){name=v;} public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;} public String getPassword(){return password;} public void setPassword(String v){password=v;}
    public String getConfirmPassword(){return confirmPassword;} public void setConfirmPassword(String v){confirmPassword=v;}
    public String getDepartment(){return department;} public void setDepartment(String v){department=v;} public String getCourse(){return course;} public void setCourse(String v){course=v;}
    public Integer getGraduationYear(){return graduationYear;} public void setGraduationYear(Integer v){graduationYear=v;} public Double getTenthPercentage(){return tenthPercentage;} public void setTenthPercentage(Double v){tenthPercentage=v;}
    public Double getTwelfthPercentage(){return twelfthPercentage;} public void setTwelfthPercentage(Double v){twelfthPercentage=v;} public Double getCgpa(){return cgpa;} public void setCgpa(Double v){cgpa=v;}
    public Integer getBacklogs(){return backlogs;} public void setBacklogs(Integer v){backlogs=v;} public String getSkills(){return skills;} public void setSkills(String v){skills=v;}
    public String getResume(){return resume;} public void setResume(String v){resume=v;}
}
