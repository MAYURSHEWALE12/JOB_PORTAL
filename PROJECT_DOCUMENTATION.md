# Job Portal - Project Documentation

## 1. Introduction

The Job Portal is a full-stack web application that connects job seekers with employers. It provides a comprehensive platform for posting jobs, applying to positions, tracking applications, communicating in real-time, and managing the entire recruitment lifecycle. Built with Spring Boot (backend) and React (frontend), the system supports three user roles: Job Seeker, Employer, and Administrator.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  React   │ │ Tailwind │ │ Zustand  │ │  Axios   │           │
│  │  SPA     │ │   CSS    │ │  State   │ │  HTTP    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / WebSocket (STOMP)
┌──────────────────────────▼──────────────────────────────────────┐
│                       API GATEWAY                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Spring Boot REST API (Port 8080)             │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ JWT Filter  │ │ CORS Config │ │ WebSocket Handler   │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     SERVICE LAYER                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │  User  │ │  Job   │ │  App   │ │ Message│ │ Resume │       │
│  │ Service│ │ Service│ │ Service│ │ Service│ │ Service│       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │  Quiz  │ │ Admin  │ │ Email  │ │Notifica│ │Company │       │
│  │ Service│ │ Service│ │ Service│ │ Service│ │ Service│       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ JPA / Hibernate
┌──────────────────────────▼──────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Spring Data JPA Repositories                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ JDBC
┌──────────────────────────▼──────────────────────────────────────┐
│                     DATABASE                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    MySQL 8.0                              │   │
│  │              Database: job_portal                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Modules

| Module | Description |
|--------|-------------|
| Authentication | Registration, login, JWT tokens, role-based access control |
| Job Management | Create, edit, delete, search, filter job listings |
| Application Management | Apply to jobs, track status, employer review |
| Resume Management | Upload, ATS scoring, keyword matching, multiple resumes |
| Messaging | Real-time chat, unread tracking, conversation history |
| Quiz & Assessment | Skill quizzes, timed tests, automated scoring |
| Admin Management | User/job management, role changes, platform stats |
| Company Profile | Company branding, logo, banner, social links |
| Notifications | Real-time alerts via WebSocket, click-to-navigate |
| Job Alerts | User preferences, automatic matching, email notifications |
| Saved Jobs | Bookmark jobs for later |
| Analytics | Per-job metrics, employer dashboards, application funnels |

---

## 4. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ JOB : creates
    USER ||--o{ JOB_APPLICATION : submits
    USER ||--o{ MESSAGE : sends
    USER ||--o{ MESSAGE : receives
    USER ||--o{ SAVED_JOB : bookmarks
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ RESUME : uploads
    USER ||--o{ RESUME_ANALYSIS : generates
    USER ||--o{ JOB_ALERT_PREFERENCE : configures
    USER ||--o| COMPANY_PROFILE : owns
    USER ||--o{ QUIZ_RESULT : takes

    JOB ||--o{ JOB_APPLICATION : receives
    JOB ||--o| QUIZ : has
    JOB ||--o{ SAVED_JOB : saved_in
    JOB ||--o{ RESUME_ANALYSIS : matched_with

    JOB_APPLICATION ||--o| RESUME : uses
    JOB_APPLICATION ||--o| QUIZ_RESULT : has

    QUIZ ||--o{ QUESTION : contains
    QUESTION ||--o{ OPTION : has

    USER {
        bigint id PK
        string email UK
        string password
        string first_name
        string last_name
        string phone
        enum role
        string profile_image_url
        string resume_url
        datetime created_at
    }

    JOB {
        bigint id PK
        bigint employer_id FK
        string title
        text description
        text requirements
        string location
        enum job_type
        decimal salary_min
        decimal salary_max
        string experience_required
        int positions_available
        enum status
        int view_count
        int application_count
        datetime posted_at
    }

    JOB_APPLICATION {
        bigint id PK
        bigint job_id FK
        bigint jobseeker_id FK
        bigint resume_id FK
        text cover_letter
        enum status
        int rating
        text feedback
        datetime applied_at
        datetime updated_at
    }

    MESSAGE {
        bigint id PK
        bigint sender_id FK
        bigint receiver_id FK
        text content
        boolean is_read
        datetime sent_at
    }

    RESUME {
        bigint id PK
        bigint user_id FK
        string name
        string file_name
        string file_path
        datetime created_at
    }

    RESUME_ANALYSIS {
        bigint id PK
        bigint user_id FK
        bigint resume_id FK
        bigint job_id FK
        int score
        text feedback
        text extracted_skills
        text matched_keywords
        text missing_keywords
        datetime analyzed_at
    }

    QUIZ {
        bigint id PK
        bigint job_id FK
        string title
        text description
        int passing_score
        int time_limit
    }

    QUESTION {
        bigint id PK
        bigint quiz_id FK
        text question_text
        int score
    }

    OPTION {
        bigint id PK
        bigint question_id FK
        text option_text
        boolean is_correct
    }

    NOTIFICATION {
        bigint id PK
        bigint user_id FK
        string title
        text message
        string type
        bigint reference_id
        string reference_type
        boolean is_read
        datetime created_at
    }

    COMPANY_PROFILE {
        bigint id PK
        bigint user_id FK
        string company_name
        string industry
        string description
        string location
        string website
        string logo_url
        string banner_url
        string employee_count
        int founded_year
        string specialties
        string linkedin
        string twitter
        string github
        datetime created_at
    }

    JOB_ALERT_PREFERENCE {
        bigint id PK
        bigint user_id FK
        string keywords
        string location
        string job_type
        boolean is_active
        boolean email_enabled
        boolean in_app_enabled
    }

    SAVED_JOB {
        bigint id PK
        bigint user_id FK
        bigint job_id FK
        datetime saved_at
    }

    QUIZ_RESULT {
        bigint id PK
        bigint application_id FK
        int score
        boolean passed
        int time_taken
        datetime completed_at
    }
```

---

## 5. Use Case Diagram

```mermaid
graph TB
    subgraph Actors
        JS[Job Seeker]
        EM[Employer]
        AD[Admin]
    end

    subgraph Job Seeker Use Cases
        JS --> JS1[Register/Login]
        JS --> JS2[Search & Filter Jobs]
        JS --> JS3[View Job Details]
        JS --> JS4[Apply to Jobs]
        JS --> JS5[Track Applications]
        JS --> JS6[Take Skill Quizzes]
        JS --> JS7[Upload & Manage Resumes]
        JS --> JS8[Save/Bookmark Jobs]
        JS --> JS9[Chat with Employers]
        JS --> JS10[Set Job Alerts]
        JS --> JS11[View Notifications]
    end

    subgraph Employer Use Cases
        EM --> EM1[Register/Login]
        EM --> EM2[Post & Manage Jobs]
        EM --> EM3[View Applications]
        EM --> EM4[Update Application Status]
        EM --> EM5[Create Skill Quizzes]
        EM --> EM6[Chat with Candidates]
        EM --> EM7[Manage Company Profile]
        EM --> EM8[View Job Analytics]
    end

    subgraph Admin Use Cases
        AD --> AD1[Manage Users]
        AD --> AD2[Manage Jobs]
        AD --> AD3[Change User Roles]
        AD --> AD4[View Platform Stats]
        AD --> AD5[Delete Users/Jobs]
    end
```

---

## 6. Sequence Diagrams

### 6.1 User Registration & Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant AC as AuthController
    participant US as UserService
    participant BC as PasswordEncoder
    participant JWT as JwtUtil
    participant DB as Database

    U->>F: Enter credentials & submit
    F->>AC: POST /api/auth/register or /login
    AC->>US: register() / authenticate()

    alt Registration
        US->>DB: Check if email exists
        DB-->>US: Not found
        US->>BC: encode(password)
        US->>DB: INSERT INTO users
        DB-->>US: User created
        US->>JWT: generateToken(user)
        JWT-->>US: JWT token
        US-->>AC: User + Token
    else Login
        US->>DB: Find user by email
        DB-->>US: User entity
        US->>BC: matches(raw, encoded)
        alt Valid
            US->>JWT: generateToken(user)
            JWT-->>US: JWT token
            US-->>AC: User + Token
        else Invalid
            US-->>AC: AuthenticationException
        end
    end

    AC-->>F: Response (User + Token)
    F->>F: Store token in localStorage
    F-->>U: Redirect to Dashboard
```

### 6.2 Job Application Flow

```mermaid
sequenceDiagram
    participant JS as Job Seeker
    participant F as Frontend
    participant JC as JobController
    participant JAC as JobApplicationController
    participant JAS as JobApplicationService
    participant NS as NotificationService
    participant DB as Database

    JS->>F: Click "Apply Now" on job
    F->>JC: GET /api/jobs/{id}
    JC->>DB: Fetch job details
    DB-->>JC: Job entity
    JC-->>F: Job + Employer info

    JS->>F: Fill cover letter, select resume
    F->>JAC: POST /api/applications
    JAC->>JAS: applyToJob()
    JAS->>DB: Check if already applied
    DB-->>JAS: Not found

    JAS->>DB: INSERT INTO job_applications
    DB-->>JAS: Application created
    JAS->>DB: UPDATE jobs SET application_count+1
    JAS->>NS: sendNotification(employer, "New Application")
    NS->>DB: INSERT INTO notifications
    NS->>NS: WebSocket push to employer

    JAS-->>JAC: Application created
    JAC-->>F: Success response
    F-->>JS: "Application submitted!"
```

### 6.3 Application Status Update Flow

```mermaid
sequenceDiagram
    participant EM as Employer
    participant F as Frontend
    participant JAC as JobApplicationController
    participant JAS as JobApplicationService
    participant NS as NotificationService
    participant DB as Database

    EM->>F: View applications, select status
    F->>JAC: PUT /api/applications/{id}/status
    JAC->>JAS: updateApplicationStatus()
    JAS->>DB: UPDATE job_applications SET status
    DB-->>JAS: Updated

    JAS->>NS: sendNotification(jobseeker, "Application Updated")
    NS->>DB: INSERT INTO notifications
    NS->>NS: WebSocket push to jobseeker

    JAS-->>JAC: Updated application
    JAC-->>F: Success response
    F-->>EM: Status updated
```

### 6.4 Real-Time Messaging Flow

```mermaid
sequenceDiagram
    participant S as Sender
    participant WS as WebSocket
    participant MC as MessageController
    participant MS as MessageService
    participant NS as NotificationService
    participant DB as Database
    participant R as Receiver

    S->>WS: Connect (STOMP)
    WS->>MC: Subscribe to /topic/messages/{userId}

    S->>F: Type message & send
    F->>WS: SEND /app/chat.send
    WS->>MC: sendMessage()
    MC->>MS: send()
    MS->>DB: INSERT INTO messages
    DB-->>MS: Message saved

    MS->>NS: sendNotification(receiver, "New message")
    NS->>DB: INSERT INTO notifications
    NS->>WS: convertAndSend /topic/notifications/{receiverId}
    WS->>R: Push notification

    MS->>WS: convertAndSend /topic/messages/{receiverId}
    WS->>R: Push message
    R->>F: Display new message
```

---

## 7. Class Diagram

```mermaid
classDiagram
    class User {
        +Long id
        +String email
        +String password
        +String firstName
        +String lastName
        +String phone
        +UserRole role
        +String profileImageUrl
        +String resumeUrl
        +LocalDateTime createdAt
    }

    class Job {
        +Long id
        +String title
        +String description
        +String requirements
        +String location
        +JobType jobType
        +BigDecimal salaryMin
        +BigDecimal salaryMax
        +String experienceRequired
        +Integer positionsAvailable
        +JobStatus status
        +Integer viewCount
        +Integer applicationCount
        +LocalDateTime postedAt
    }

    class JobApplication {
        +Long id
        +String coverLetter
        +ApplicationStatus status
        +Integer rating
        +String feedback
        +LocalDateTime appliedAt
        +LocalDateTime updatedAt
    }

    class Message {
        +Long id
        +String content
        +Boolean isRead
        +LocalDateTime sentAt
    }

    class Resume {
        +Long id
        +String name
        +String fileName
        +String filePath
        +LocalDateTime createdAt
    }

    class Quiz {
        +Long id
        +String title
        +String description
        +Integer passingScore
        +Integer timeLimit
    }

    class Question {
        +Long id
        +String questionText
        +Integer score
    }

    class Option {
        +Long id
        +String optionText
        +Boolean isCorrect
    }

    class Notification {
        +Long id
        +String title
        +String message
        +String type
        +Long referenceId
        +String referenceType
        +Boolean isRead
        +LocalDateTime createdAt
    }

    class CompanyProfile {
        +Long id
        +String companyName
        +String industry
        +String description
        +String location
        +String website
        +String logoUrl
        +String bannerUrl
        +String employeeCount
        +Integer foundedYear
        +String specialties
    }

    User "1" --> "*" Job : creates
    User "1" --> "*" JobApplication : submits
    User "1" --> "*" Message : sends/receives
    User "1" --> "*" Resume : owns
    User "1" --> "*" Notification : receives
    User "1" --> "1" CompanyProfile : owns

    Job "1" --> "*" JobApplication : receives
    Job "1" --> "0..1" Quiz : has

    JobApplication "*" --> "0..1" Resume : uses

    Quiz "1" --> "*" Question : contains
    Question "1" --> "*" Option : has
```

---

## 8. Database Schema

### 8.1 Core Tables

| Table | Columns | Primary Key | Foreign Keys |
|-------|---------|-------------|--------------|
| **users** | id, email, password, first_name, last_name, phone, role, profile_image_url, resume_url, created_at, updated_at | id | - |
| **jobs** | id, employer_id, title, description, requirements, location, job_type, salary_min, salary_max, experience_required, positions_available, status, view_count, application_count, posted_at, updated_at | id | employer_id → users(id) |
| **job_applications** | id, job_id, jobseeker_id, resume_id, cover_letter, status, rating, feedback, applied_at, updated_at | id | job_id → jobs(id), jobseeker_id → users(id), resume_id → resumes(id) |
| **messages** | id, sender_id, receiver_id, content, is_read, sent_at | id | sender_id → users(id), receiver_id → users(id) |
| **resumes** | id, user_id, name, file_name, file_path, created_at | id | user_id → users(id) |
| **notifications** | id, user_id, title, message, type, reference_id, reference_type, is_read, created_at | id | user_id → users(id) |
| **quizzes** | id, job_id, title, description, passing_score, time_limit | id | job_id → jobs(id) |
| **questions** | id, quiz_id, question_text, score | id | quiz_id → quizzes(id) |
| **options** | id, question_id, option_text, is_correct | id | question_id → questions(id) |
| **company_profiles** | id, user_id, company_name, industry, description, location, website, logo_url, banner_url, employee_count, founded_year, specialties, linkedin, twitter, github, created_at, updated_at | id | user_id → users(id) |
| **saved_jobs** | id, user_id, job_id, saved_at | id | user_id → users(id), job_id → jobs(id) |
| **job_alert_preferences** | id, user_id, keywords, location, job_type, is_active, email_enabled, in_app_enabled | id | user_id → users(id) |
| **resume_analyses** | id, user_id, resume_id, job_id, score, feedback, extracted_skills, matched_keywords, missing_keywords, analyzed_at | id | user_id → users(id), resume_id → resumes(id), job_id → jobs(id) |
| **quiz_results** | id, application_id, score, passed, time_taken, completed_at | id | application_id → job_applications(id) |

---

## 9. API Documentation

### 9.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login with email/password |
| PUT | `/api/users/{id}/password` | User | Change password |

### 9.2 Jobs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/jobs` | Public | Search & filter jobs |
| GET | `/api/jobs/{id}` | Public | Get job details |
| POST | `/api/jobs` | Employer | Create job |
| PUT | `/api/jobs/{id}` | Employer | Update job |
| DELETE | `/api/jobs/{id}` | Employer/Admin | Delete job |
| GET | `/api/jobs/employer/{id}` | Public | Get employer's jobs |
| GET | `/api/jobs/{id}/analytics` | Employer | Job analytics |

### 9.3 Applications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/applications` | Job Seeker | Apply to job |
| GET | `/api/applications/seeker/{id}` | Job Seeker | Get my applications |
| GET | `/api/applications/employer/{id}` | Employer | Get applications for jobs |
| PUT | `/api/applications/{id}/status` | Employer | Update status |
| DELETE | `/api/applications/{id}` | Employer/Admin | Delete application |

### 9.4 Messaging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/messages/inbox/{userId}` | User | Get inbox |
| GET | `/api/messages/conversation/{userId}` | User | Get conversation |
| POST | `/api/messages/send` | User | Send message |
| GET | `/api/messages/unread-count/{userId}` | User | Unread count |

### 9.5 Resume

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/resume/upload` | User | Upload resume PDF |
| GET | `/api/resume/user/{userId}` | User | Get user's resumes |
| POST | `/api/resume/analyze/{resumeId}` | User | ATS analysis |
| POST | `/api/resume/match/{resumeId}/{jobId}` | User | Match score |
| DELETE | `/api/resume/delete/{resumeId}` | User | Delete resume |

### 9.6 Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/jobs` | Admin | List all jobs |
| GET | `/api/admin/stats` | Admin | Platform stats |
| PUT | `/api/admin/users/{id}/role` | Admin | Change user role |
| DELETE | `/api/admin/users/{id}` | Admin | Delete user |
| DELETE | `/api/admin/jobs/{id}` | Admin | Delete job |

---

## 10. Technology Stack

### Backend
- **Java 25** - Programming language
- **Spring Boot 4.0.4** - Application framework
- **Spring Security** - Authentication & authorization
- **Spring Data JPA** - Data access layer
- **Hibernate 7.2** - ORM framework
- **MySQL 8.0** - Relational database
- **WebSocket (STOMP)** - Real-time communication
- **JavaMailSender** - Email notifications
- **Lombok** - Boilerplate reduction

### Frontend
- **React 19** - UI library
- **Vite 7** - Build tool
- **Tailwind CSS** - Styling framework
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Recharts** - Charting library

### DevOps
- **Maven** - Build automation
- **Git** - Version control
- **GitHub** - Repository hosting

---

## 11. Security Features

| Feature | Implementation |
|---------|---------------|
| Password Encryption | BCrypt hashing via Spring Security PasswordEncoder |
| JWT Authentication | Stateless token-based auth with 24-hour expiration |
| Role-Based Access | @PreAuthorize annotations on endpoints |
| CORS Configuration | Whitelisted origins for frontend |
| Input Validation | @Valid annotations on request bodies |
| SQL Injection Prevention | JPA parameterized queries |
| XSS Prevention | React auto-escapes output |
| File Upload Validation | PDF-only restriction, size limits |

---

## 12. Future Enhancements

- **OAuth2 Login** - Google, GitHub, LinkedIn sign-in
- **AI Resume Parsing** - LLM-based skill extraction
- **Video Interviews** - Integrated video calling
- **Push Notifications** - Browser & mobile push
- **Mobile App** - React Native companion app
- **Advanced Analytics** - Machine learning job matching
- **Multi-language Support** - Internationalization (i18n)
- **Payment Integration** - Premium job postings
- **Candidate Scoring** - AI-based candidate ranking
- **Interview Scheduling** - Calendar integration
