package com.campusplacement.entity;
import javax.persistence.*; import java.time.LocalDateTime;
@Entity @Table(name="applications", uniqueConstraints=@UniqueConstraint(columnNames={"student_id","drive_id"}))
public class Application {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Integer id;
 @ManyToOne @JoinColumn(name="student_id") private Student student; @ManyToOne @JoinColumn(name="drive_id") private PlacementDrive drive;
 @Column(name="applied_date") private LocalDateTime appliedDate; private String status;
 @Lob @Column(name="registration_details") private String registrationDetails;
 public Integer getId(){return id;} public void setId(Integer v){id=v;} public Student getStudent(){return student;} public void setStudent(Student v){student=v;} public PlacementDrive getDrive(){return drive;} public void setDrive(PlacementDrive v){drive=v;} public LocalDateTime getAppliedDate(){return appliedDate;} public void setAppliedDate(LocalDateTime v){appliedDate=v;} public String getStatus(){return status;} public void setStatus(String v){status=v;} public String getRegistrationDetails(){return registrationDetails;} public void setRegistrationDetails(String v){registrationDetails=v;}
}
