# Campus Placement Portal - Fixed

This version keeps the existing `campus_placement` database and repairs authentication.

## 1. Set MySQL password
Edit `backend/src/main/resources/application.properties` and replace `YOUR_MYSQL_PASSWORD` with your local MySQL root password.

## 2. Start backend
PowerShell:
```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-22"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
cd backend
javac -version
mvn clean
mvn spring-boot:run
```
Do not start a second backend on port 8080.

## 3. Login
Demo admin: `admin@campus.com` / `admin123`
Demo student: `rahul@student.com` / `student123`

At backend startup, only these two existing rows are updated with fresh BCrypt passwords; the rest of the database is untouched.

## 4. Frontend
Open `frontend/index.html` or use your existing frontend server. Frontend API is `http://localhost:8080/api`.

## 5. Registration
Student registration now accepts password and confirm password, validates they match, and stores the password as BCrypt.
