USE campus_placement;

-- v3: performance indexes for department/roll-number targeting and notifications.
-- Run this migration once after migration_v2.sql.
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_students_roll_number ON students(roll_number);
CREATE INDEX idx_notifications_student_created ON notifications(student_id, created_date);
CREATE INDEX idx_interviews_drive_student ON interviews(drive_id, student_id);
