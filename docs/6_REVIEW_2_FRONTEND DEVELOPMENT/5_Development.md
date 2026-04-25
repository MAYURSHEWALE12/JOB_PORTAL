# DEVELOPMENT DOCUMENTATION

---

## 1. FRONTEND DEVELOPMENT

### 1.1 Project Structure

```
job-portal-v2/
├── src/
│   ├── components/
│   │   ├── Admin/
│   │   ├── Applications/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Footer.jsx
│   │   ├── Home/
│   │   ├── Jobs/
│   │   ├── Logo.jsx
│   │   ├── Loader.jsx
│   │   ├── Messages/
│   │   ├── Notifications/
│   │   ├── Profile/
│   │   ├── Quiz/
│   │   ├── Resume/
│   │   ├── Resume/
│   │   ├── Skeleton.jsx
│   │   └── ThemeToggle.jsx
│   ├── hooks/
│   │   ├── useApplications.js
│   │   └── useNotificationSound.js
│   ├── services/
│   │   └── api.js
│   ├── store/
│   │   ├── authStore.js
│   │   ├── themeStore.js
│   │   └── websocketStore.js
│   ├── utils/
│   │   └── sfx.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

### 1.2 Technology Stack

| Technology | Version | Purpose |
|-------------|---------|---------|
| React | 19.2.4 | UI Framework |
| Vite | 8.0 | Build Tool |
| Tailwind CSS | 4.2.2 | Styling |
| Zustand | - | State Management |
| Framer Motion | - | Animations |
| Axios | - | HTTP Client |
| React Router | - | Routing |
| Recharts | - | Charts |

### 1.3 Core Components Implementation

#### Authentication (Auth)
- **LoginPage.jsx**: Email/password login form, Google OAuth button
- **RegisterPage.jsx**: Registration form with role selection

Features:
- Input validation with error messages
- JWT token storage in localStorage
- Redirect to dashboard on success
- Loading states during authentication

```jsx
// LoginPage.jsx - Core Logic
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
    navigate('/dashboard');
  } catch (error) {
    setError('Invalid credentials');
  } finally {
    setLoading(false);
  }
};
```

#### Dashboard (Dashboard)
- **Dashboard.jsx**: Main dashboard with stats and quick actions
- **DashboardNavbar.jsx**: Navigation bar with user menu
- **DashboardBackground.jsx**: Animated background
- **DashboardTabbar.jsx**: Tab navigation
- **DashboardStyles.jsx**: Custom styled components
- **DashboardIcons.jsx**: Icon components

Features:
- Role-based content display
- Statistics cards with animations
- Quick action buttons
- Recent activity feed

#### Job Management (Jobs)
- **JobsPage.jsx**: Job listing with filters
- **JobSearch.jsx**: Search with advanced filters
- **PostJob.jsx**: Job posting form for employers
- **ManageJobs.jsx**: Employer job management
- **SavedJobs.jsx**: User's saved jobs

Features:
- Multi-filter search (location, salary, type)
- Pagination
- Save/unsave jobs
- Employer job CRUD operations

#### Application Management (Applications)
- **ApplicationCard.jsx**: Application card component
- **MyApplications.jsx**: Candidate's applications
- **ViewApplications.jsx**: Employer view
- **HiringKanban.jsx**: Kanban pipeline view
- **ApplicationFilter.jsx**: Filter sidebar
- **BulkActionsToolbar.jsx**: Bulk operations
- **PipelineSidebar.jsx**: Pipeline status sidebar
- **KanbanCard.jsx**: Draggable kanban card

Features:
- Kanban drag-and-drop
- Status updates
- Bulk actions
- Match score display

#### Resume Management (Resume)
- **ResumeBuilderPage.jsx**: Step-by-step builder
- **ResumeManager.jsx**: Resume list
- **ResumeHub.jsx**: Dashboard for resumes
- **ResumeGenerator.jsx**: PDF generation
- **ResumeAnalysisDisplay.jsx**: ATS analysis
- **ResumePreviewModal.jsx**: PDF preview
- **PDFPreviewModal.jsx**: Download preview
- **ApplyResumePicker.jsx**: Resume selection
- **ATSCheck.jsx**: ATS scoring

Features:
- Form-based resume building
- PDF generation
- ATS compatibility scoring
- Multiple resume management

#### Messaging (Messages)
- **Messaging.jsx**: Real-time chat interface
- **FilePreviewModal.jsx**: File preview

Features:
- WebSocket integration
- Real-time message delivery
- File attachments
- Conversation list

#### Quiz System (Quiz)
- **QuizCreatePage.jsx**: Quiz builder for employers
- **QuizTakePage.jsx**: Quiz taking interface
- **QuizResults.jsx**: Results display

Features:
- Multiple question types
- Time limits
- Auto-scoring
- Results tracking

#### Notifications (Notifications)
- **NotificationsPage.jsx**: Notification inbox
- **NotificationBell.jsx**: Notification dropdown
- **useNotificationSound.js**: Sound hook

### 1.4 State Management (Zustand)

```javascript
// store/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  setUser: (user) => set({ user }),
}));

export default useAuthStore;
```

### 1.5 API Service

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 1.6 Forms & Validation

| Form | Fields | Validation |
|------|--------|------------|
| Login | email, password | Required, Email format |
| Register | email, password, name, role | Required, Email, Password min 6 |
| Post Job | title, description, location, salary, type | Required, Min length |
| Resume Builder | name, email, education, experience, skills | Required fields |
| Profile | name, bio, skills, location | Optional updates |

---

## 2. BACKEND DEVELOPMENT

### 2.1 Project Structure

```
job-portal-backend/
├── src/main/java/
│   └── com/
│       └── nexthire/
│           ├── NexthireApplication.java
│           ├── config/
│           ├── controller/
│           ├── dto/
│           ├── entity/
│           ├── exception/
│           ├── repository/
│           ├── security/
│           ├── service/
│           └── websocket/
├── src/main/resources/
│   ├── application.properties
│   └── static/
└── pom.xml
```

### 2.2 Technology Stack

| Technology | Version | Purpose |
|-------------|---------|---------|
| Java | 25+ | Programming Language |
| Spring Boot | 4.0.4 | Framework |
| Spring Security | - | Security |
| Spring Data JPA | - | ORM |
| Hibernate | - | Database ORM |
| MySQL | 8.0+ | Database |
| JWT | - | Authentication |
| Spring WebSocket | - | Real-time |
| Maven | 3.9+ | Build Tool |

### 2.3 API Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| POST | /api/auth/google | Google OAuth |
| POST | /api/auth/refresh | Refresh token |
| GET | /api/auth/me | Get current user |

#### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/jobs | Search jobs |
| GET | /api/jobs/{id} | Get job details |
| POST | /api/jobs | Create job (Employer) |
| PUT | /api/jobs/{id} | Update job |
| DELETE | /api/jobs/{id} | Delete job |
| GET | /api/jobs/my | Employer's jobs |

#### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/applications | Apply to job |
| GET | /api/applications | Get applications |
| GET | /api/applications/{id} | Get application |
| PUT | /api/applications/{id}/status | Update status |
| GET | /api/applications/my | My applications |

#### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/resumes | Get resumes |
| POST | /api/resumes | Create resume |
| PUT | /api/resumes/{id} | Update resume |
| DELETE | /api/resumes/{id} | Delete resume |
| GET | /api/resumes/{id}/analyze | ATS analysis |

#### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/messages/conversations | Get conversations |
| GET | /api/messages/{conversationId} | Get messages |
| POST | /api/messages | Send message |

#### Quizzes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quizzes | Get quizzes |
| POST | /api/quizzes | Create quiz |
| GET | /api/quizzes/{id}/take | Take quiz |
| POST | /api/quizzes/{id}/submit | Submit quiz |

### 2.4 Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('JOB_SEEKER', 'EMPLOYER', 'ADMIN') NOT NULL,
    google_id VARCHAR(255),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Jobs Table
```sql
CREATE TABLE jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employer_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    salary DECIMAL(10,2),
    job_type ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'),
    experience_level VARCHAR(50),
    status ENUM('ACTIVE', 'CLOSED', 'DRAFT') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES users(id)
);
```

#### Applications Table
```sql
CREATE TABLE applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_id BIGINT NOT NULL,
    applicant_id BIGINT NOT NULL,
    resume_id BIGINT,
    status ENUM('APPLIED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'REJECTED', 'WITHDRAWN') DEFAULT 'APPLIED',
    match_score INT,
    cover_letter TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (resume_id) REFERENCES resumes(id)
);
```

#### Resumes Table
```sql
CREATE TABLE resumes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255),
    content JSON,
    ats_score INT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Messages Table
```sql
CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

### 2.5 Security Implementation

#### JWT Configuration
```java
@Configuration
public class JwtConfig {
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private Long jwtExpiration;
    
    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret(jwtSecret.getBytes()));
    }
}
```

#### Security Filter Chain
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/jobs/**").authenticated()
                .anyRequest().authenticated()
            )
            .jwtAuthenticationConverter(jwtConverter)
            .build();
    }
}
```

### 2.6 WebSocket Configuration

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins("*")
            .withSockJS();
    }
}
```

---

## 3. API INTEGRATION

### 3.1 Frontend-Backend Connection

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │◄───────►│   Backend       │
│   (React)       │  REST   │   (Spring Boot) │
│                 │         │                 │
│   Axios Client  │◄───────►│   REST API      │
│   WebSocket     │◄───────►│   WebSocket     │
└─────────────────┘         └─────────────────┘
```

### 3.2 CRUD Operations

| Operation | Frontend | Backend |
|-----------|----------|---------|
| Create | POST /api/resource | POST mapping |
| Read | GET /api/resource | GET mapping |
| Update | PUT /api/resource/{id} | PUT mapping |
| Delete | DELETE /api/resource/{id} | DELETE mapping |

### 3.3 Data Flow

```
User Action → API Call → JWT Token → Controller → Service → 
Repository → Database → Response → State Update → UI Update
```

---

## 4. KEY IMPLEMENTATIONS

### 4.1 Job Search with Filters
```javascript
const searchJobs = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/api/jobs?${params}`);
  return response.data;
};
```

### 4.2 AI Match Score Calculation
```java
public int calculateMatchScore(Resume resume, Job job) {
    int score = 0;
    
    // Skills matching (40%)
    List<String> resumeSkills = extractSkills(resume.getContent());
    List<String> jobSkills = extractSkills(job.getDescription());
    int skillMatch = calculateOverlap(resumeSkills, jobSkills);
    score += skillMatch * 0.4;
    
    // Experience matching (30%)
    int expMatch = compareExperience(resume.getExperience(), job.getExperienceLevel());
    score += expMatch * 0.3;
    
    // Location match (20%)
    if (resume.getLocation().equals(job.getLocation())) {
        score += 20;
    }
    
    // Education match (10%)
    score += compareEducation(resume.getEducation(), job.getRequirements()) * 0.1;
    
    return Math.min(score, 100);
}
```

### 4.3 Real-time Notifications
```java
@MessageMapping("/notifications")
public void sendNotification(Notification notification) {
    notificationService.save(notification);
    messagingTemplate.convertAndSendToUser(
        notification.getUserId(),
        "/queue/notifications",
        notification
    );
}
```

---

*Submitted by:* [Your Name]
*Guide Sign:* _______________
*Date:* 16/04/2026