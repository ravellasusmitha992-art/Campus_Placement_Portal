# Campus Placement Information Portal

Full-stack college project using Java, Spring Boot 2.7.18, MySQL, HTML, CSS and JavaScript.

## Existing database
The supplied `database/schema.sql` matches the existing `campus_placement` database schema used by the backend.

## 1. Configure MySQL
Open `backend/src/main/resources/application.properties` and replace:

`spring.datasource.password=YOUR_MYSQL_PASSWORD`

with the password of your MySQL `root` user.

The database must be:

`campus_placement`

## 2. Start backend
Open a terminal in `backend`:

```bash
mvn spring-boot:run
```

Backend base URL:

`http://localhost:8080/api`

## 3. Start frontend
Open the `frontend` folder with VS Code/Antigravity and use Live Server on `index.html`.

Typical URL:

`http://127.0.0.1:5500/index.html`

## Demo accounts
Admin:
- Email: `admin@campus.com`
- Password: `admin123`

Student:
- Email: `rahul@student.com`
- Password: `student123`

These demo credentials correspond to the BCrypt sample records in the supplied schema.

## Main API endpoints
- POST `/api/auth/login`
- POST `/api/auth/register`
- GET/PUT `/api/students/{id}`
- POST `/api/students/{id}/resume`
- GET/POST/PUT/DELETE `/api/companies`
- GET/POST/PUT/DELETE `/api/drives`
- GET `/api/drives/{driveId}/eligibility/{studentId}`
- POST `/api/applications/apply?studentId={id}&driveId={id}`
- GET/PUT `/api/applications`
- GET/POST/PUT `/api/interviews`
- GET/POST `/api/results`
- GET/POST/PUT `/api/notifications`
- GET `/api/admin/stats`

## Notes
- The frontend uses localStorage only to remember the logged-in user for this college-project demo. It is not a production JWT/session implementation.
- The backend performs the actual eligibility check and prevents duplicate applications.
- Resume upload accepts PDF files up to 5 MB.
