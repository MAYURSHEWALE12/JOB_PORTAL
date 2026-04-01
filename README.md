# Job Portal

A full-stack job portal application built with **Spring Boot** (backend) and **React + Vite** (frontend). Features user authentication, job posting, application tracking, real-time messaging, resume management, ATS scoring, quiz-based screening, and admin controls.

## Features

### For Job Seekers
- Browse and search jobs with filters (title, location, type, salary, experience)
- Apply to jobs with cover letter and resume selection
- Track application status (PENDING → REVIEWED → SHORTLISTED → INTERVIEWING → OFFERED → ACCEPTED/REJECTED)
- Take skill assessments (quizzes) for jobs
- Save/bookmark jobs for later
- Build and manage multiple resumes with ATS scoring
- Real-time messaging with employers
- Job alert preferences with email notifications
- View application analytics and status history

### For Employers
- Post and manage job listings
- View and filter applications per job
- Update application status with feedback
- Create skill assessments (quizzes) for screening
- Real-time messaging with candidates
- Company profile management with logo/banner
- View job analytics (views, applications, status breakdown)

### For Admins
- Manage all users (view, edit roles, delete)
- Manage all jobs (view, delete)
- Platform-wide statistics dashboard
- Role management (JOBSEEKER ↔ EMPLOYER ↔ ADMIN)

### Platform Features
- JWT-based authentication with role-based access control
- Real-time notifications via WebSocket
- In-app messaging system
- Resume upload, ATS analysis, and scoring
- Quiz creation and automated scoring
- Email notifications (Brevo SMTP)
- Dark mode support
- Responsive design

## Tech Stack

### Backend
- **Java 25** with **Spring Boot 4.0.4**
- **Spring Security** with JWT authentication
- **Spring Data JPA** with Hibernate
- **MySQL 8.0**
- **WebSocket** (STOMP) for real-time features
- **JavaMailSender** for email notifications
- **Lombok** for boilerplate reduction

### Frontend
- **React 19** with **Vite 7**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Axios** for HTTP requests
- **Lucide React** for icons
- **Recharts** for analytics charts

## Project Structure

```
Job portal project/
├── job-portal-backend/          # Spring Boot API
│   ├── src/main/java/com/jobportal/
│   │   ├── config/              # Security, WebSocket, CORS config
│   │   ├── controller/          # REST endpoints
│   │   ├── dto/                 # Data Transfer Objects
│   │   ├── entity/              # JPA entities
│   │   ├── exception/           # Custom exceptions + global handler
│   │   ├── repository/          # Spring Data JPA repositories
│   │   ├── security/            # JWT filter, util, SecurityUtil
│   │   └── service/             # Business logic
│   └── src/main/resources/
│       ├── application.properties
│       └── application-dev.properties
├── job-portal-frontend/         # React + Vite SPA
│   └── src/
│       ├── components/          # React components
│       ├── services/            # API client
│       ├── store/               # Zustand stores
│       └── utils/               # Helpers
└── .gitignore
```

## Getting Started

### Prerequisites
- **Java 25+**
- **Node.js 18+**
- **MySQL 8.0+**
- **Maven 3.9+**

### Backend Setup

1. **Create MySQL database:**
   ```sql
   CREATE DATABASE job_portal;
   ```

2. **Configure environment variables** (or use the dev profile defaults):
   ```env
   DB_USERNAME=root
   DB_PASSWORD=your_password
   JWT_SECRET=your-secret-key-at-least-256-bits
   SMTP_USERNAME=your-smtp-username
   SMTP_PASSWORD=your-smtp-password
   ```

3. **Run the backend:**
   ```bash
   cd job-portal-backend
   mvn spring-boot:run
   ```
   The API will be available at `http://localhost:8080/api`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd job-portal-frontend
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |

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
| GET | `/api/messages/conversation/{userId}` | Get conversation |
| POST | `/api/messages/send` | Send message |
| GET | `/api/messages/unread-count/{userId}` | Unread count |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload resume PDF |
| GET | `/api/resume/user/{userId}` | Get user's resumes |
| POST | `/api/resume/analyze/{resumeId}` | ATS analysis |
| POST | `/api/resume/match/{resumeId}/{jobId}` | Match score |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/jobs` | List all jobs |
| GET | `/api/admin/stats` | Platform stats |
| PUT | `/api/admin/users/{id}/role` | Change user role |
| DELETE | `/api/admin/users/{id}` | Delete user |
| DELETE | `/api/admin/jobs/{id}` | Delete job |

## Database Schema

Core entities: `User`, `Job`, `JobApplication`, `Message`, `Notification`, `Resume`, `Quiz`, `Question`, `Option`, `SavedJob`, `CompanyProfile`, `JobAlertPreference`, `QuizResult`, `ResumeAnalysis`

## License

This project is for educational purposes.
