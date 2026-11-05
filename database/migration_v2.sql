USE campus_placement;
ALTER TABLE placement_drives ADD COLUMN IF NOT EXISTS application_link VARCHAR(1000) NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS registration_details TEXT NULL;
