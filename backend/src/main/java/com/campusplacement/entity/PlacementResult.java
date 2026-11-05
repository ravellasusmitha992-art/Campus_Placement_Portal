package com.campusplacement.entity;

import javax.persistence.*; import java.time.LocalDate;
@Entity @Table(name="placement_results")
public class PlacementResult {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Integer id; @ManyToOne @JoinColumn(name="student_id") private Student student; @ManyToOne @JoinColumn(name="drive_id") private PlacementDrive drive; @Column(name="package") private Double packageValue; private String status; @Column(name="joining_date") private LocalDate joiningDate;
 public Double getPackageValue(){return packageValue;} public void setPackageValue(Double v){packageValue=v;} public Integer getId(){return id;} public void setId(Integer v){id=v;} public Student getStudent(){return student;} public void setStudent(Student v){student=v;} public PlacementDrive getDrive(){return drive;} public void setDrive(PlacementDrive v){drive=v;} public String getStatus(){return status;} public void setStatus(String v){status=v;} public LocalDate getJoiningDate(){return joiningDate;} public void setJoiningDate(LocalDate v){joiningDate=v;}
}
