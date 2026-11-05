package com.campusplacement.entity;

import javax.persistence.*; import java.time.LocalDateTime;
@Entity @Table(name="notifications")
public class Notification {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Integer id; @ManyToOne @JoinColumn(name="student_id") private Student student; private String title; @Lob private String message; @Column(name="created_date") private LocalDateTime createdDate; @Column(name="is_read") private Boolean read=false;
 public Integer getId(){return id;} public void setId(Integer v){id=v;} public Student getStudent(){return student;} public void setStudent(Student v){student=v;} public String getTitle(){return title;} public void setTitle(String v){title=v;} public String getMessage(){return message;} public void setMessage(String v){message=v;} public LocalDateTime getCreatedDate(){return createdDate;} public void setCreatedDate(LocalDateTime v){createdDate=v;} public Boolean getRead(){return read;} public void setRead(Boolean v){read=v;}
}
