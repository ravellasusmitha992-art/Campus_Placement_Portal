# Campus Placement Portal - Updated Build

## Important fixes included

- Placement Drive creation now accepts the `company` name sent by the existing Manage Drives form.
- Existing companies are resolved case-insensitively by name.
- A new company name is automatically created with the required non-null company fields when it does not already exist.
- Placement Drive backend validates required fields, dates, status values, eligible departments, numeric values, and `http://` / `https://` application links.
- Eligible departments remain stored in the existing comma-separated `eligible_departments` column and are used by backend eligibility checking.
- Student placement cards continue to use the backend `/api/drives` response and show the Company Registration link only when present.
- Application API responses now include `applicationLink` for both admin and student application views.
- Application status validation includes `INTERVIEW_SCHEDULED` and `INTERVIEW_NOT_SCHEDULED`.
- Interview scheduling supports Individual, Specific roll numbers, Branch/Department, and Roll Number Range targets.
- Interview drive dropdown displays `Company - Job Role` without exposing the internal drive ID.
- Scheduling an interview updates the application to `INTERVIEW_SCHEDULED` and creates a student notification.
- Cancelling an interview updates the related application to `INTERVIEW_NOT_SCHEDULED`.
- Notification targeting supports ALL, INDIVIDUAL roll number, SPECIFIC roll numbers, BRANCH, and RANGE.
- Student notifications can be marked as read through the backend.
- Added `database/migration_v3.sql` for useful indexes.

## Database

The existing schema already contains the required columns for `application_link` and `registration_details`. Run `migration_v2.sql` if an older database does not contain those columns, then run `migration_v3.sql` once for the indexes.

## Backend run on Windows

Open PowerShell in the `backend` folder:

```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-25.0.2"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn clean package -DskipTests
mvn spring-boot:run
```

The backend uses:

- URL: `http://localhost:8080/api`
- MySQL database: `campus_placement`
- `spring.jpa.hibernate.ddl-auto=none`

## Frontend

Open the `frontend` folder with a local static server, or use the project's existing frontend serving method. The frontend API base is:

`http://localhost:8080/api`

## Verification performed in this package

- Java source static audit: passed.
- Java Markdown-fence audit: passed.
- Java brace-balance audit: passed.
- All frontend JavaScript files: passed `node --check`.

A live Maven/Spring Boot/MySQL integration build was not run in the packaging environment because Maven and MySQL are not installed there. The project should be built on the user's Windows development machine with the commands above before deployment.
