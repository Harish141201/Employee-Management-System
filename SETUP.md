# Local Setup (Windows)

## Required software
- JDK 17
- Maven 3.9+ (or use the included `mvnw.cmd` wrapper — no separate install needed)
- Node.js 18+ and npm
- MySQL 8.x running locally

## 1. Database setup
```sql
CREATE DATABASE employee_management;
```
Tables (`employees`, `departments`, `users`) are auto-created by Hibernate on first run.

## 2. Backend setup — environment variables
In PowerShell, before starting the backend:
```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password_here"
$env:ADMIN_SEED_PASSWORD="ChooseAStrongPassword123!"
```
- `DB_PASSWORD` — your real MySQL password (never commit this).
- `ADMIN_SEED_PASSWORD` — the password for the initial admin account, created
  automatically the first time the app starts (username defaults to `admin`,
  override with `ADMIN_SEED_USERNAME` if you want). If this variable isn't
  set, no admin account is created and you won't be able to log in at all —
  the app will log a warning telling you this.
- Optional: `JWT_SECRET` — a long random string for signing tokens. A dev
  default is baked in so the app runs without setting this, but set your
  own before deploying anywhere real.
- Optional: `DEMO_DATA` — defaults to `true`. On startup, the app creates
  four departments and ten Indian employee profiles with department,
  designation, phone, birth date, employment type, active status, and joining
  date so the dashboard, employee list, reports, and calendar views have
  useful data immediately. Set `DEMO_DATA=false` for an empty workforce.

Then, from `ems-backend/ems-backend`:
```powershell
.\mvnw.cmd spring-boot:run
```
Backend runs at: **http://localhost:8080**

(If you're running from IntelliJ, set these under Run Configuration →
Environment Variables instead of the terminal.)

## 3. Frontend setup
From `ems-fullstack`:
```powershell
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**

Optional — copy `.env.example` to `.env` if you need to point the frontend
at a different backend URL than `http://localhost:8080/api`.

## 4. Logging in
Open **http://localhost:5173/login** and sign in with:
- Username: `admin` (or your `ADMIN_SEED_USERNAME`)
- Password: whatever you set as `ADMIN_SEED_PASSWORD`

As admin, you can:
- Create departments (`POST /api/departments`)
- Create employee records (via the UI's "Add Employee" button)
- Manage login accounts, roles, access, and password resets from the **User
  Management** screen
- Review audit logs, create company calendar events, and use the reports,
  notifications, and settings screens

### Demo workforce

With `DEMO_DATA=true`, the employee list includes Aarav Sharma, Ananya Iyer,
Rohan Verma, Priya Nair, Vikram Reddy, Kavya Menon, Arjun Patel, Meera
Kulkarni, Aditya Rao, and Sneha Gupta. Each profile contains a department,
designation, phone number, date of birth, employment type, active status, and
joining date. The demo entries use the clearly marked `@peoplehub.demo` email
domain.

### Roles at a glance
| Role | Can do |
|---|---|
| ADMIN | Everything — manage users, departments, employees (including delete) |
| HR | Manage departments and employee records (cannot delete, cannot manage user accounts) |
| EMPLOYEE | View their own profile only (`/api/emp/me`) |

## 5. API docs (Swagger)
With the backend running: **http://localhost:8080/swagger-ui.html**
Click "Authorize" and paste a JWT (obtained from `/api/auth/login`) to try
out protected endpoints directly from the browser.

## 6. Running tests
From `ems-backend/ems-backend`:
```powershell
.\mvnw.cmd test
```
Tests run against an in-memory H2 database (see `src/test/resources/application.properties`)
— no MySQL instance or environment variables needed to run them. Covers:
- `EmployeeServiceTest`, `DepartmentServiceTest`, `AuthServiceTest` — business rule unit tests
  (duplicate email/name/username, not-found cases, self-management rejection, password hashing)
- `EmployeeControllerSecurityTest` — proves the RBAC matrix is actually enforced end-to-end
  through the real Spring Security filter chain (EMPLOYEE forbidden from listing, HR forbidden
  from deleting, ADMIN allowed, anonymous requests rejected)
- `AuditLogControllerSecurityTest` and `CalendarEventControllerSecurityTest`
  — prove the admin-only management endpoints remain protected

## 7. Running everything with Docker (alternative to steps 1-4)

If you have Docker Desktop installed, this is the fastest way to run the
whole stack — no local JDK, Node, or MySQL install needed.

```powershell
cd Full-stack-Employee-Management-System-using-SpringBoot-and-React-Js-
copy .env.example .env
```
Edit `.env` and set real values for `MYSQL_ROOT_PASSWORD`, `JWT_SECRET`, and
`ADMIN_SEED_PASSWORD`. Then:
```powershell
docker compose up --build
```

- Frontend: **http://localhost:5173**
- Backend (direct): **http://localhost:8080**
- Swagger UI: **http://localhost:5173/swagger-ui.html** (proxied through the
  frontend's nginx, so it shares the same origin as the app)
- MySQL: exposed on **localhost:3306** if you want to connect with a DB client

The frontend container runs nginx, which serves the built React app and
reverse-proxies `/api/*` to the backend container — the browser only ever
talks to one origin, so CORS doesn't come into play in this setup (it's
still configured correctly for the case where you hit the backend directly,
e.g. via `localhost:8080`).

First run takes a few minutes (Maven downloads dependencies, npm installs
packages). Subsequent runs are fast thanks to Docker layer caching. To stop:
```powershell
docker compose down
```
Add `-v` to also delete the MySQL data volume (full reset).

**Note:** I can't run `docker compose up` inside this sandbox to verify it
end-to-end (no Docker daemon, no Maven Central access here). What I *did*
verify directly: the frontend (`npm install && npm run build && npm run
lint`) builds clean with zero errors/warnings. The backend Maven build
itself I could not run here (no Maven Central access in this sandbox) —
please run `.\mvnw.cmd clean package` locally once to confirm before relying
on the Docker build, though the changes since the last verified state were
mechanical (new dependencies, new small classes) rather than structural.

## Recommended: install the pre-commit hook

`application.properties` reads all secrets from environment variables with
no literal fallback, but to catch it early if a hardcoded credential is ever
accidentally reintroduced (e.g. from merging an old branch or snapshot),
install the included guard once per clone:
```powershell
copy scripts\hooks\pre-commit .git\hooks\pre-commit
```
On macOS/Linux:
```bash
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```
It blocks any commit that reintroduces a known-bad literal secret, or a new
literal fallback on any `*_PASSWORD`/`*_SECRET` property in
`application.properties`.

## Known limitation: document storage on Render

`EmployeeDocumentService` currently writes uploaded files to local disk
(`./uploads/peoplehub-documents` by default). That's fine for local dev and
Docker (the volume persists across container restarts), but Render's web
service filesystem is ephemeral — every redeploy wipes it, so uploaded
documents won't survive a redeploy on the live demo. Before relying on
document upload/download in a persistent live demo, swap this for real
object storage (e.g. S3-compatible storage) or a Render persistent disk.
