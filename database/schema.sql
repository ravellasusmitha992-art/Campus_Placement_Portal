-- Create database if not exists
CREATE DATABASE IF NOT EXISTS campus_placement;
USE campus_placement;

-- Drop tables in reverse order of dependencies to avoid foreign key constraints
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS placement_results;
DROP TABLE IF EXISTS interviews;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS placement_drives;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admins;

-- Admins Table
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    course VARCHAR(100) NOT NULL,
    graduation_year INT NOT NULL,
    tenth_percentage DOUBLE NOT NULL,
    twelfth_percentage DOUBLE NOT NULL,
    cgpa DOUBLE NOT NULL,
    backlogs INT NOT NULL DEFAULT 0,
    skills TEXT,
    resume VARCHAR(255)
);

-- Companies Table
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo VARCHAR(255),
    description TEXT,
    industry VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    job_role VARCHAR(100) NOT NULL,
    job_location VARCHAR(100) NOT NULL,
    salary_package DOUBLE NOT NULL,
    job_description TEXT,
    required_skills TEXT
);

-- Placement Drives Table
CREATE TABLE placement_drives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    job_role VARCHAR(100) NOT NULL,
    drive_date DATE NOT NULL,
    reg_start_date DATE NOT NULL,
    reg_end_date DATE NOT NULL,
    job_location VARCHAR(100) NOT NULL,
    salary_package DOUBLE NOT NULL,
    job_description TEXT,
    required_skills TEXT,
    min_cgpa DOUBLE NOT NULL,
    min_tenth_percentage DOUBLE NOT NULL,
    min_twelfth_percentage DOUBLE NOT NULL,
    max_backlogs INT NOT NULL,
    eligible_departments VARCHAR(255) NOT NULL, -- Comma-separated departments
    graduation_year INT NOT NULL,
    selection_process TEXT,
    vacancies INT NOT NULL,
    status VARCHAR(50) NOT NULL, -- UPCOMING, REGISTRATION_OPEN, REGISTRATION_CLOSED, ONGOING, COMPLETED
    application_link VARCHAR(1000),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Applications Table
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    drive_id INT NOT NULL,
    applied_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL, -- APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW_SCHEDULED, SELECTED, REJECTED
    registration_details TEXT,
    UNIQUE KEY unique_student_drive (student_id, drive_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE
);

-- Interviews Table
CREATE TABLE interviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    student_id INT NOT NULL,
    drive_id INT NOT NULL,
    round VARCHAR(100) NOT NULL,
    interview_date DATE NOT NULL,
    interview_time TIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    meeting_link VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- ONLINE, OFFLINE
    status VARCHAR(50) NOT NULL, -- SCHEDULED, COMPLETED, CANCELLED
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE
);

-- Placement Results Table
CREATE TABLE placement_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    drive_id INT NOT NULL,
    package DOUBLE NOT NULL,
    status VARCHAR(50) NOT NULL, -- SELECTED, NOT_SELECTED
    joining_date DATE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT, -- NULL means broadcast/sent to all students
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_date DATETIME NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Sample Data Insertion
-- -----------------------------------------------------

-- Admins: Password is 'admin123'
-- BCrypt hash: $2a$10$8.UnVuG9HHgffUDAlk8GP.3nS3rLz5t.P3xJ8406E98JvL26o3UeK
INSERT INTO admins (name, email, password) VALUES 
('Placement Admin', 'admin@campus.com', '$2a$10$8.UnVuG9HHgffUDAlk8GP.3nS3rLz5t.P3xJ8406E98JvL26o3UeK');

-- Students: Password is 'student123'
-- BCrypt hash: $2a$10$V9V/oF.k7xR62jTsm8H9/.mC3mE0H.VjO6K/2/5m2B2/X297ePRee
INSERT INTO students (roll_number, name, email, phone, password, department, course, graduation_year, tenth_percentage, twelfth_percentage, cgpa, backlogs, skills, resume) VALUES 
('STU001', 'Rahul Sharma', 'rahul@student.com', '9876543210', '$2a$10$V9V/oF.k7xR62jTsm8H9/.mC3mE0H.VjO6K/2/5m2B2/X297ePRee', 'Computer Science', 'B.Tech', 2026, 88.5, 85.0, 8.2, 0, 'Java, SQL, HTML, CSS', 'rahul_resume.pdf'),
('STU002', 'Priya Patel', 'priya@student.com', '8765432109', '$2a$10$V9V/oF.k7xR62jTsm8H9/.mC3mE0H.VjO6K/2/5m2B2/X297ePRee', 'Information Technology', 'B.Tech', 2026, 92.0, 90.5, 9.1, 0, 'Python, Machine Learning, JavaScript', 'priya_resume.pdf'),
('STU003', 'Amit Kumar', 'amit@student.com', '7654321098', '$2a$10$V9V/oF.k7xR62jTsm8H9/.mC3mE0H.VjO6K/2/5m2B2/X297ePRee', 'Electronics', 'B.Tech', 2026, 75.0, 78.0, 7.1, 1, 'C++, Embedded Systems, IoT', 'amit_resume.pdf');

-- Companies
INSERT INTO companies (name, logo, description, industry, website, job_role, job_location, salary_package, job_description, required_skills) VALUES 
('TCS', 'tcs_logo.png', 'Tata Consultancy Services is a global leader in IT services, consulting & business solutions.', 'IT Services', 'https://www.tcs.com', 'System Engineer', 'Bangalore', 3.6, 'Responsible for system administration, software development support, and server configurations.', 'Java, SQL, Linux'),
('Infosys', 'infosys_logo.png', 'Infosys is a global leader in next-generation digital services and consulting.', 'Consulting & IT', 'https://www.infosys.com', 'Systems Associate', 'Hyderabad', 4.0, 'Develop frontend components, debug java controllers, and interact with relational schemas.', 'JavaScript, SQL, Java'),
('Wipro', 'wipro_logo.png', 'Wipro Limited is a leading technology services and consulting company.', 'IT Services', 'https://www.wipro.com', 'Project Engineer', 'Pune', 3.5, 'Assist in system maintenance, backend web-services coding, and API integrations.', 'C++, SQL, HTML'),
('Accenture', 'accenture_logo.png', 'Accenture is a global professional services company with leading capabilities in digital, cloud and security.', 'Consulting', 'https://www.accenture.com', 'Associate Software Engineer', 'Chennai', 4.5, 'Work on cutting-edge enterprise cloud platforms, microservices architectures, and automation scripts.', 'Java, Python, Cloud Computing'),
('Cognizant', 'cognizant_logo.png', 'Cognizant engineers modern businesses, helping clients modernize technology, reimagine processes and transform experiences.', 'IT Services', 'https://www.cognizant.com', 'Programmer Analyst', 'Kochi', 4.0, 'Analyze requirements, construct data flow diagrams, write SQL queries, and implement web-interfaces.', 'Java, React, SQL'),
('Amazon', 'amazon_logo.png', 'Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, and AI.', 'Technology', 'https://www.amazon.com', 'Software Development Engineer', 'Hyderabad', 18.0, 'Build highly scalable distributed backend systems, design cloud workflows, and optimize microservice performance.', 'Java, C++, Data Structures, Algorithms');

-- Placement Drives
-- Drive 1: TCS (Registration Open)
INSERT INTO placement_drives (company_id, job_role, drive_date, reg_start_date, reg_end_date, job_location, salary_package, job_description, required_skills, min_cgpa, min_tenth_percentage, min_twelfth_percentage, max_backlogs, eligible_departments, graduation_year, selection_process, vacancies, status) VALUES 
(1, 'System Engineer', '2026-09-15', '2026-08-01', '2026-08-30', 'Bangalore', 3.6, 'Join the TCS software development unit. Work on agile teams to design and document database integrations.', 'Java, SQL, Linux', 6.0, 60.0, 60.0, 2, 'Computer Science, Information Technology, Electronics', 2026, 'Aptitude Test, Technical Interview, HR Interview', 100, 'REGISTRATION_OPEN'),
-- Drive 2: Amazon (Registration Open, high requirements)
(6, 'Software Development Engineer', '2026-10-10', '2026-08-05', '2026-09-15', 'Hyderabad', 18.0, 'Work on core e-commerce or cloud systems. Build REST APIs, optimize cache layers, and write highly efficient multithreaded systems.', 'Java, C++, Data Structures, Algorithms', 8.0, 80.0, 80.0, 0, 'Computer Science, Information Technology', 2026, 'Online Coding Assessment, 3 Technical Rounds, System Design, Fit Round', 10, 'REGISTRATION_OPEN'),
-- Drive 3: Infosys (Ongoing)
(2, 'Systems Associate', '2026-08-20', '2026-07-10', '2026-08-05', 'Hyderabad', 4.0, 'Standard systems associate role. Support client implementations.', 'JavaScript, SQL, Java', 6.5, 65.0, 65.0, 0, 'Computer Science, Information Technology, Electronics', 2026, 'Aptitude Test, Technical & HR Round', 50, 'ONGOING'),
-- Drive 4: Wipro (Completed)
(3, 'Project Engineer', '2026-07-10', '2026-06-01', '2026-06-25', 'Pune', 3.5, 'Perform software coding, unit testing, and continuous deployment tasks.', 'C++, SQL, HTML', 6.0, 60.0, 60.0, 1, 'Computer Science, Information Technology, Electronics', 2026, 'Online Test, Technical Round', 30, 'COMPLETED');

-- Applications
-- Rahul (STU001) applied to TCS (Drive 1) and Amazon (Drive 2)
INSERT INTO applications (student_id, drive_id, applied_date, status) VALUES 
(1, 1, '2026-08-02 10:15:00', 'SHORTLISTED'),
(1, 2, '2026-08-06 14:30:00', 'APPLIED'),
-- Priya (STU002) applied to TCS (Drive 1), Amazon (Drive 2), and Infosys (Drive 3)
(2, 1, '2026-08-03 09:20:00', 'SHORTLISTED'),
(2, 2, '2026-08-05 11:10:00', 'SHORTLISTED'),
(2, 3, '2026-08-01 16:45:00', 'INTERVIEW_SCHEDULED'),
-- Amit (STU003) applied to TCS (Drive 1)
(3, 1, '2026-08-04 15:00:00', 'UNDER_REVIEW');

-- Interviews
-- Priya has an interview scheduled for Infosys (Drive 3)
INSERT INTO interviews (application_id, student_id, drive_id, round, interview_date, interview_time, venue, meeting_link, type, status) VALUES 
(5, 2, 3, 'Technical Round 1', '2026-08-15', '10:00:00', 'Online MS Teams', 'https://teams.microsoft.com/l/meetup-join/infosys-session', 'ONLINE', 'SCHEDULED');

-- Results
-- Let's put a result for Wipro Drive (Drive 4) where Rahul was selected
-- First create application for Rahul for Wipro Drive
INSERT INTO applications (student_id, drive_id, applied_date, status) VALUES 
(1, 4, '2026-06-15 11:00:00', 'SELECTED');

INSERT INTO placement_results (student_id, drive_id, package, status, joining_date) VALUES 
(1, 4, 3.5, 'SELECTED', '2026-07-01');

-- Notifications
INSERT INTO notifications (student_id, title, message, created_date, is_read) VALUES 
(NULL, 'New Placement Drive: TCS Systems Engineer', 'TCS is hiring System Engineers. Registration is open until August 30, 2026.', '2026-08-01 10:00:00', FALSE),
(NULL, 'New Placement Drive: Amazon SDE', 'Amazon is hiring SDEs with a package of 18 LPA. Check details and check your eligibility now.', '2026-08-05 09:00:00', FALSE),
(2, 'Interview Scheduled: Infosys Systems Associate', 'Your interview for the Infosys Systems Associate drive has been scheduled for August 15 at 10:00 AM.', '2026-08-07 16:50:00', FALSE),
(1, 'Selected in Wipro!', 'Congratulations! You have been selected for the Project Engineer role at Wipro with a package of 3.5 LPA.', '2026-07-12 12:00:00', TRUE);
