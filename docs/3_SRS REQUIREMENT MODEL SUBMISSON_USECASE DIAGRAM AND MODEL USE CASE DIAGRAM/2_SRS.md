# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

---

## 1. INTRODUCTION

### 1.1 Purpose
This document describes the Software Requirements Specification for **HireHub: Premium Job Portal**, a full-stack web application designed to connect job seekers with employers through an intelligent recruitment platform.

### 1.2 Scope
The system provides:
- Job seekers: Job search, resume building, application tracking, quizzes, messaging
- Employers: Job posting, candidate management, quiz creation, analytics
- Admins: User management, system monitoring

---

## 2. FUNCTIONAL REQUIREMENTS

### 2.1 User Authentication (FR-1)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Users can register with email and password | Must |
| FR-1.2 | Users can login with email/password | Must |
| FR-1.3 | Users can login with Google OAuth2 | Should |
| FR-1.4 | JWT tokens should expire after 24 hours | Must |
| FR-1.5 | Users can logout securely | Must |
| FR-1.6 | Password reset via email | Should |

### 2.2 User Profile Management (FR-2)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Job seekers can create/edit personal profile | Must |
| FR-2.2 | Employers can create/edit company profile | Must |
| FR-2.3 | Users can upload profile picture | Should |
| FR-2.4 | Users can view other user profiles | Should |

### 2.3 Job Management (FR-3)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Employers can post new jobs | Must |
| FR-3.2 | Employers can edit/delete job postings | Must |
| FR-3.3 | Job seekers can search jobs with filters | Must |
| FR-3.4 | Job seekers can save jobs for later | Should |
| FR-3.5 | Jobs should support multiple filters (location, salary, type) | Must |

### 2.4 Resume Management (FR-4)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Users can build resume using builder | Must |
| FR-4.2 | Users can upload PDF resumes | Must |
| FR-4.3 | System should analyze ATS compatibility | Should |
| FR-4.4 | Users can manage multiple resumes | Must |
| FR-4.5 | Users can preview resumes in PDF | Must |

### 2.5 Application Management (FR-5)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Job seekers can apply to jobs | Must |
| FR-5.2 | Job seekers can track application status | Must |
| FR-5.3 | Employers can view received applications | Must |
| FR-5.4 | Employers can update application status | Must |
| FR-5.5 | System should calculate AI match score | Should |
| FR-5.6 | Kanban view for application pipeline | Should |

### 2.6 Messaging System (FR-6)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Users can send messages to connected users | Must |
| FR-6.2 | Real-time message delivery via WebSocket | Must |
| FR-6.3 | Message history should be preserved | Must |
| FR-6.4 | Users can only message after application | Must |

### 2.7 Notification System (FR-7)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Users receive notifications for new messages | Must |
| FR-7.2 | Users receive notifications for application status changes | Must |
| FR-7.3 | Real-time notification delivery | Must |
| FR-7.4 | Users can mark notifications as read | Must |

### 2.8 Quiz System (FR-8)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8.1 | Employers can create quizzes for jobs | Should |
| FR-8.2 | Employers can add questions to quizzes | Should |
| FR-8.3 | Job seekers can take assigned quizzes | Must |
| FR-8.4 | System should calculate quiz scores | Must |
| FR-8.5 | Quiz results should be visible to employers | Must |

### 2.9 Interview Scheduling (FR-9)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-9.1 | Employers can schedule interviews | Should |
| FR-9.2 | Job seekers can view scheduled interviews | Must |
| FR-9.3 | Employers can mark interviews complete | Should |

### 2.10 Analytics & Dashboard (FR-10)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10.1 | Dashboard shows job statistics | Must |
| FR-10.2 | Charts display application trends | Should |
| FR-10.3 | Employers can view company analytics | Should |

---

## 3. NON-FUNCTIONAL REQUIREMENTS

### 3.1 Performance
| ID | Requirement | Metric |
|----|-------------|-------|
| NFR-1.1 | Page load time | < 3 seconds |
| NFR-1.2 | API response time | < 500ms |
| NFR-1.3 | Support concurrent users | 100+ |
| NFR-1.4 | Database query time | < 200ms |

### 3.2 Scalability
| ID | Requirement |
|----|-------------|
| NFR-2.1 | System should handle 10,000+ job postings |
| NFR-2.2 | System should support 1000+ concurrent users |

### 3.3 Security
| ID | Requirement |
|----|-------------|
| NFR-3.1 | Passwords should be encrypted |
| NFR-3.2 | JWT tokens should be signed |
| NFR-3.3 | HTTPS for all communications |
| NFR-3.4 | Role-based access control |
| NFR-3.5 | Input validation and sanitization |

### 3.4 Reliability
| ID | Requirement |
|----|-------------|
| NFR-4.1 | System uptime | 99% |
| NFR-4.2 | Automatic backup | Daily |
| NFR-4.3 | Error handling | Graceful |

### 3.5 Usability
| ID | Requirement |
|----|-------------|
| NFR-5.1 | Responsive design for all screen sizes |
| NFR-5.2 | Dark mode support |
| NFR-5.3 | Intuitive navigation |
| NFR-5.4 | Accessible color contrast |

### 3.6 Compatibility
| ID | Requirement |
|----|-------------|
| NFR-6.1 | Chrome (latest) |
| NFR-6.2 | Firefox (latest) |
| NFR-6.3 | Edge (latest) |

---

## 4. USE CASE DIAGRAM

```
                    ┌─────────────────┐
                    │   <<actor>>     │
                    │  Job Seeker     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Register      │  │ Search Jobs   │  │ Build Resume  │
│ & Login        │  │ & Apply       │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────┴────────
                    │ Track Applications,
                    │ Take Quizzes,
                    │ Send Messages
                    └────────┬────────
                             │
                    ┌────────┴────────
                    │ View Notifications
                    └─────────────────┘


                    ┌─────────────────┐
                    │   <<actor>>     │
                    │   Employer     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼���─��─────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Post Jobs     │  │ Create Quizzes│  │ Manage       │
│ & Manage      │  │               │  │ Applications  │
└───────────────┘  └───────────────┘  └───────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────┴────────
                    │ Schedule Interviews,
                    │ View Analytics
                    └─────────────────┘


                    ┌─────────────────┐
                    │   <<actor>>     │
                    │    Admin       │
                    └────────┬────────┘
                             │
                    ┌────────┴────────
                    │ Manage Users,
                    │ System Monitoring,
                    │ Content Moderation
                    └─────────────────┘
```

---

## 5. USE CASE DESCRIPTIONS

### UC-1: User Registration
**Actors:** Job Seeker, Employer
**Flow:**
1. User clicks "Register"
2. User selects user type (Job Seeker/Employer)
3. User enters email, password, name
4. System validates input
5. System creates user account
6. System sends verification email
7. User verifies email
8. Account is activated

### UC-2: Job Search and Application
**Actors:** Job Seeker
**Flow:**
1. User enters search criteria
2. System displays matching jobs
3. User selects a job
4. User views job details
5. User selects resume
6. User submits application
7. System calculates match score
8. System sends notification to employer

### UC-3: Resume Building
**Actors:** Job Seeker
**Flow:**
1. User clicks "Build Resume"
2. User enters personal details
3. User adds education
4. User adds experience
5. User adds skills
6. User adds projects
7. System generates PDF
8. User saves resume

### UC-4: Application Management
**Actors:** Employer
**Flow:**
1. Employer views applications
2. Employer filters by status
3. Employer reviews candidate
4. Employer updates status
5. Employer schedules interview
6. System notifies candidate

### UC-5: Real-time Messaging
**Actors:** Job Seeker, Employer
**Flow:**
1. User opens chat
2. System establishes WebSocket
3. User types message
4. System sends in real-time
5. Recipient receives message
6. Message saved to history

---

## 6. ACTIVITY DIAGRAM

### 6.1 Job Application Activity Diagram

```
┌──────────────┐
│   Start      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Search Jobs  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ View Job     │──── Yes ───┐
│ Details?     │            │
└──────┬───────┘            │
       │ No                │
       ▼                   │
┌──────────────┐          │
│ Select       │          │
│ Resume       │          │
└──────┬───────┘          │
       │                  │
       ▼                  │
┌──────────────┐         │
│ Submit       │         │
│ Application  │         │
└──────┬───────┘         │
       │                 │
       ▼                 │
┌──────────────┐         │
│ Calculate    │         │
│ Match Score  │         │
└──────┬───────┘         │
       │                 │
       ▼                 │
┌──────────────┐         │
│ Save to DB   │         │
└──────┬───────┘         │
       │                 │
       ▼                 │
┌──────────────┐         │
│ Notify       │◄────────┘
│ Employer    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    End       │
└──────────────┘
```

### 6.2 User Login Activity Diagram

```
┌──────────────┐
│   Start      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Enter        │
│ Credentials │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Validate     │──── No ─────┐
│ Input?       │             │
└──────┬───────┘             │
       │ Yes                │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│ Authenticate │     │ Show Error   │
│ with DB      │     │ Message     │
└──────┬───────┘     └──────────────┘
       │                    │
       ▼                  ▼
┌──────────────┐     ┌──────────────┐
│ Generate    │     │    End      │
│ JWT Token   │     └──────────────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Redirect to  │
│ Dashboard    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    End       │
└──────────────┘
```

---

*Submitted by:* [Your Name]
*Guide Sign:* _______________
*Date:* 18/03/2026