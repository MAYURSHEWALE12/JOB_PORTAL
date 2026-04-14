# Job Portal

A full-stack job portal application built with **Spring Boot** (backend) and **React + Vite** (frontend). Features user authentication, job posting, application tracking, real-time messaging, resume management, ATS scoring, quiz-based screening, and admin controls.

---

## Features

### For Job Seekers
- Browse and search jobs with filters (title, location, type, salary, experience)
- Apply to jobs with cover letter and resume selection
- Track application status (PENDING → REVIEWED → SHORTLISTED → INTERVIEWING → OFFERED → ACCEPTED/REJECTED)
- Take skill assessments (quizzes) for jobs
- Save/bookmark jobs for later
- Build and manage multiple resumes with ATS scoring
- Real-time messaging with employers (restricted to professional connections)
- Job alert preferences with email notifications
- View application analytics and status history

### For Employers
- Post and manage job listings
- View and filter applications per job
- Update application status with feedback
- Create skill assessments (quizzes) for screening
- Real-time messaging with candidates (restricted to applicants)
- Company profile management with logo/banner
- View job analytics (views, applications, status breakdown)

### For Admins
- Manage all users (view, edit roles, delete)
- Manage all jobs (view, delete)
- Platform-wide statistics dashboard
- Role management (JOBSEEKER ↔ EMPLOYER ↔ ADMIN)

### Platform Features
- JWT-based authentication with role-based access control
- Google OAuth2 login support
- Real-time notifications via WebSocket
- In-app messaging system with professional restrictions
- Resume upload, ATS analysis, and scoring
- Quiz creation and automated scoring
- Email notifications (Brevo SMTP)
- Dark mode support
- Responsive design (mobile-friendly)

---

## Tech Stack

### Backend
| Technology | Version |
|------------|---------|
| Java | 25+ |
| Spring Boot | 4.0.4 |
| Spring Security | JWT |
| Spring Data JPA | Hibernate |
| MySQL | 8.0+ |
| WebSocket | STOMP |
| Lombok | - |

### Frontend
| Technology | Version |
|------------|---------|
| React | 19.2.4 |
| Vite | 8.0+ |
| Tailwind CSS | 4.2.2 |
| Zustand | 5.0.12 |
| Axios | 1.14.0 |
| STOMP.js | 7.3.0 |
| Recharts | 3.8.1 |

---

## Prerequisites

- **Java Development Kit (JDK) 25+** - [Download](https://adoptium.net/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
- **Maven 3.9+** - [Download](https://maven.apache.org/download.cgi)

---

## Project Structure

```
Job portal project/
├── job-portal-backend/              # Spring Boot API
│   ├── src/main/java/com/jobportal/
│   │   ├── config/                  # Security, WebSocket, CORS config
│   │   ├── controller/             # REST endpoints
│   │   ├── dto/                     # Data Transfer Objects
│   │   ├── entity/                  # JPA entities
│   │   ├── exception/               # Custom exceptions + global handler
│   │   ├── repository/              # Spring Data JPA repositories
│   │   ├── security/                # JWT filter, util, SecurityUtil
│   │   └── service/                # Business logic
│   └── src/main/resources/
│       └── application.properties   # Configuration
│
├── job-portal-frontend/              # React + Vite SPA
│   └── src/
│       ├── components/              # React components
│       ├── pages/                   # Page components
│       ├── services/                # API client
│       ├── store/                   # Zustand stores
│       └── utils/                   # Helpers
│
├── job-portal-v2/                    # Alternative frontend (if exists)
└── README.md
```

---

## Getting Started

### 1. Database Setup

Create a MySQL database named `job_portal`:

```sql
CREATE DATABASE job_portal;
```

Make sure MySQL is running and accessible on port `3306`.

### 2. Backend Setup

#### Environment Variables

Set the following environment variables (or configure in `application.properties`):

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_USERNAME` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `your_password` |
| `JWT_SECRET` | JWT signing key (min 256 bits) | `your-secret-key...` |

**Quick Setup (Windows PowerShell):**
```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your-256-bit-secret-key-here-must-be-long-enough"
```

**Quick Setup (Linux/Mac):**
```bash
export DB_USERNAME=root
export DB_PASSWORD=your_password
export JWT_SECRET=your-256-bit-secret-key-here-must-be-long-enough
```

#### Run Backend

```bash
# Navigate to backend directory
cd job-portal-backend

# Run with Maven
mvn spring-boot:run
```

The API will start at `http://localhost:8080/api`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd job-portal-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will start at `http://localhost:5173`

---

## Accessing on Mobile

To access the application from a mobile device on the same network:

### 1. Find Your Local IP Address

**Windows:**
```powershell
ipconfig
```
Look for `IPv4 Address` under your active network adapter.

**Linux/Mac:**
```bash
ifconfig
# or
ip addr show
```

### 2. Run Frontend with Host Flag

```bash
cd job-portal-frontend
npm run dev -- --host
```

The terminal will display something like:
```
Local:   http://localhost:5173
Network: http://192.168.x.x:5173
```

### 3. Update Backend CORS (if needed)

If the backend rejects requests from mobile, update `application.properties`:

```properties
# Add your network IP
cors.allowed-origins=http://192.168.x.x:5173

# Or allow all (for development only)
cors.allowed-origins=*
```

### 4. Access on Mobile

Open your mobile browser and navigate to:
```
http://192.168.x.x:5173
```

**Note:** Both devices must be on the same network (WiFi).

---

## User Roles & Default Access

### Roles
- **JOB_SEEKER** - Job applicants
- **EMPLOYER** - Companies posting jobs
- **ADMIN** - Platform administrators

### Creating Users

Users can be registered through:
1. The registration form in the frontend
2. Google OAuth2 login (if configured)

### Initial Admin Setup

After starting the application, you can create an admin user through:
1. Register a new user via the UI
2. Manually update the role in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

---

## Messaging Security

The messaging system enforces professional communication restrictions:

### Rules
| User Type | Can Message |
|-----------|-------------|
| **Job Seeker** | Admins + Employers of jobs they've applied to |
| **Employer** | Admins + Job Seekers who applied to their jobs |
| **Admin** | Everyone |

### Features
- **Existing conversations are preserved** - Active chats remain accessible
- **Server-side validation** - API rejects unauthorized message attempts with `403 Forbidden`
- **User discovery filtering** - Only valid recipients appear in search

This prevents unsolicited messages and maintains professional communication.

---

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Google OAuth login |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | Search & filter jobs |
| GET | `/api/jobs/{id}` | Get job details |
| POST | `/api/jobs` | Create job (Employer) |
| PUT | `/api/jobs/{id}` | Update job (Employer) |
| DELETE | `/api/jobs/{id}` | Delete job |
| GET | `/api/jobs/employer/{id}` | Get employer's jobs |
| GET | `/api/jobs/{id}/analytics` | Job analytics |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Apply to job |
| GET | `/api/applications/seeker/{id}` | Get my applications |
| GET | `/api/applications/employer/{id}` | Get employer's applications |
| PUT | `/api/applications/{id}/status` | Update status |

### Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/inbox/{userId}` | Get inbox |
| GET | `/api/messages/conversation` | Get conversation with partner |
| POST | `/api/messages/send` | Send message |
| GET | `/api/messages/users` | Get messagable users |
| GET | `/api/messages/unread-count` | Get unread count |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload resume PDF |
| GET | `/api/resume/user/{userId}` | Get user's resumes |
| POST | `/api/resume/analyze/{resumeId}` | ATS analysis |
| POST | `/api/resume/match/{resumeId}/{jobId}` | Match score |

### Quiz
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz` | Create quiz |
| GET | `/api/quiz/job/{jobId}` | Get job's quiz |
| POST | `/api/quiz/submit/{quizId}` | Submit quiz answers |
| GET | `/api/quiz/results/{applicationId}` | Get quiz results |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/jobs` | List all jobs |
| GET | `/api/admin/stats` | Platform stats |
| PUT | `/api/admin/users/{id}/role` | Change user role |
| DELETE | `/api/admin/users/{id}` | Delete user |
| DELETE | `/api/admin/jobs/{id}` | Delete job |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/{id}/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `/ws` | WebSocket connection endpoint |
| `/topic/notifications/{userId}` | Subscribe to notifications |
| `/topic/chat/{userId}` | Subscribe to chat messages |

---

## Database Schema

### Core Entities
- **User** - User accounts with roles
- **Job** - Job listings
- **JobApplication** - Applications with status tracking
- **Message** - Direct messages between users
- **Notification** - In-app notifications
- **Resume** - Uploaded resumes with ATS data
- **Quiz** - Skill assessments
- **Question / Option** - Quiz questions
- **QuizResult** - Quiz submissions
- **SavedJob** - Bookmarked jobs
- **CompanyProfile** - Company branding
- **JobAlertPreference** - Email alert settings
- **ResumeAnalysis** - ATS analysis results

---

## Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Find and kill the process using port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Database connection failed:**
- Verify MySQL is running
- Check credentials in environment variables
- Ensure database `job_portal` exists

**JWT errors:**
- Verify `JWT_SECRET` is set (minimum 256 bits)
- Clear browser cookies and login again

### Frontend Issues

**Port 5173 already in use:**
```bash
npm run dev -- --port 5174
```

**CORS errors:**
- Check backend `cors.allowed-origins` includes frontend URL
- Ensure backend is running

**Module not found errors:**
```bash
npm install
```

### Mobile Access Issues

1. Verify devices are on same WiFi network
2. Check firewall allows connection on port 5173
3. Use the Network URL shown in terminal (not localhost)

---

## Development Commands

### Backend
```bash
# Run in development mode
mvn spring-boot:run

# Build JAR file
mvn clean package

# Run JAR file
java -jar target/job-portal-backend-0.0.1-SNAPSHOT.jar

# Skip tests
mvn spring-boot:run -DskipTests
```

### Frontend
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Environment Variables Reference

### Backend (`application.properties`)
| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USERNAME` | root | MySQL username |
| `DB_PASSWORD` | - | MySQL password |
| `JWT_SECRET` | - | JWT signing key |
| `server.port` | 8080 | Backend server port |
| `spring.datasource.url` | jdbc:mysql://localhost:3306/job_portal | Database URL |

### Frontend (`.env` - create if needed)
```env
VITE_API_URL=http://localhost:8080/api
```

---

## License

This project is for educational purposes.

---

## Support

For issues or questions, please create an issue in the repository.
