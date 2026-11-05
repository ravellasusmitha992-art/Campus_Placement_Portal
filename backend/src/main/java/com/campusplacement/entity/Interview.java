package com.campusplacement.entity;

import javax.persistence.*; import java.time.LocalDate; import java.time.LocalTime;
@Entity @Table(name="interviews")
public class Interview {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Integer id;
 @ManyToOne @JoinColumn(name="application_id") private Application application;
 @ManyToOne @JoinColumn(name="student_id") private Student student;
 @ManyToOne @JoinColumn(name="drive_id") private PlacementDrive drive;
 private String round; @Column(name="interview_date") private LocalDate interviewDate; @Column(name="interview_time") private LocalTime interviewTime;
 private String venue; @Column(name="meeting_link") private String meetingLink; private String type; private String status;
 public Integer getId(){return id;} public void setId(Integer v){id=v;} public Application getApplication(){return application;} public void setApplication(Application v){application=v;} public Student getStudent(){return student;} public void setStudent(Student v){student=v;} public PlacementDrive getDrive(){return drive;} public void setDrive(PlacementDrive v){drive=v;} public String getRound(){return round;} public void setRound(String v){round=v;} public LocalDate getInterviewDate(){return interviewDate;} public void setInterviewDate(LocalDate v){interviewDate=v;} public LocalTime getInterviewTime(){return interviewTime;} public void setInterviewTime(LocalTime v){interviewTime=v;} public String getVenue(){return venue;} public void setVenue(String v){venue=v;} public String getMeetingLink(){return meetingLink;} public void setMeetingLink(String v){meetingLink=v;} public String getType(){return type;} public void setType(String v){type=v;} public String getStatus(){return status;} public void setStatus(String v){status=v;}
}
