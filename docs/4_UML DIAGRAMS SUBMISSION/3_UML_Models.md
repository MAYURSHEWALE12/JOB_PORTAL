# UML MODELS

---

## 1. CLASS DIAGRAM

### 1.1 User Management Classes

```
┌─────────────────────────────────────┐
│            User                      │
├─────────────────────────────────────┤
│ - id: Long                          │
│ - email: String                     │
│ - password: String                 │
│ - firstName: String                │
│ - lastName: String                 │
│ - role: UserRole                   │
│ - createdAt: DateTime              │
│ - updatedAt: DateTime              │
├─────────────────────────────────────┤
│ + login()                           │
│ + logout()                          │
│ + updateProfile()                   │
│ + changePassword()                 │
└──────────────────┬──────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│JobSeeker │ │ Employer  │ │   Admin   │
├───────────┤ ├───────────┤ ├───────────┤
│ resume   │ │ company  │ │ permissions│
│ skills   │ │ jobs    │ └───────────┘
│ applications│ │ candidates│
│ quizzes  │ │ analytics│
└───────────┘ └───────────┘

        ▲
        │ extends
┌──────┴────────────────────────────┐
│         <<enumeration>>              │
│            UserRole                  │
├─────────────────────────────────────┤
│ JOB_SEEKER                          │
│ EMPLOYER                           │
│ ADMIN                              │
└─────────────────────────────────────┘
```

### 1.2 Job and Application Classes

```
┌─────────────────────────────────────┐
│             Job                     │
├─────────────────────────────────────┤
│ - id: Long                          │
│ - title: String                     │
│ - description: String               │
│ - location: String                  │
│ - salary: BigDecimal               │
│ - jobType: JobType                 │
│ - experienceLevel: String         │
│ - status: JobStatus               │
│ - employer: User                   │
│ - createdAt: DateTime              │
├─────────────────────────────────────┤
│ + post()                            │
│ + update()                         │
│ + close()                          │
│ + getApplications()               │
└──────────────────┬──────────────────┘
                    │
                    │ 1..* ─────────┐
                    │                ▼
┌────────────────────┴─────────────────────────────────────┐
│            Application                              │
├─────────────────────────────────────┤
│ - id: Long                          │
│ - job: Job                          │
│ - applicant: User                  │
│ - resume: Resume                   │
│ - status: ApplicationStatus       │
│ - matchScore: Integer             │
│ - coverLetter: String             │
│ - appliedAt: DateTime             │
├─────────────────────────────────────┤
│ + apply()                          │
│ + withdraw()                      │
│ + updateStatus()                  │
│ + calculateMatchScore()          │
└──────────────────┬──────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│  APPLIED   │ │ REVIEWED │ │INTERVIEW │
├───────────┤ ├───────────┤ ├───────────┤
└───────────┘ └───────────┘ └───────────┘

        ▲
        │ extends
┌──────┴────────────────────────────┐
│      <<enumeration>>                 │
│        ApplicationStatus            │
├─────────────────────────────────────┤
│ APPLIED                              │
│ REVIEWED                             │
│ SHORTLISTED                          │
│ INTERVIEWING                         │
│ OFFERED                             │
│ REJECTED                             │
│ WITHDRAWN                            │
└─────────────────────────────────────┘
```

### 1.3 Resume Classes

```
┌─────────────────────────────────────┐
│            Resume                    │
├─────────────────────────────────────┤
│ - id: Long                          │
│ - title: String                     │
│ - user: User                        │
│ - content: JSON                     │
│ - atsScore: Integer                │
│ - isPrimary: Boolean              │
│ - createdAt: DateTime              │
│ - updatedAt: DateTime              │
├─────────────────────────────────────┤
│ + build()                          │
│ + upload()                         │
│ + generatePDF()                   │
│ + analyzeATS()                    │
│ + setPrimary()                    │
└──────────────────┬──────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│Education │ │ Experience│ │  Skill    │
├───────────┤ ├───────��───┤ ├───────────┤
│institution│ │ company  │ │ name      │
│degree     │ │ title    │ │ level     │
│field      │ │ startDate│ └───────────┘
│startDate  │ │ endDate  │
│endDate    │ │ description│
│gpa       │ └───────────┘
└───────────┘
```

### 1.4 Messaging Classes

```
┌─────────────────────────────────────┐
│           Conversation              │
├─────────────────────────────────────┤
│ - id: Long                          │
│ - participants: List<User>        │
│ - lastMessage: Message             │
│ - updatedAt: DateTime              │
├─────────────────────────────────────┤
│ + addParticipant()                 │
│ + removeParticipant()              │
│ + getMessages()                   │
└──────────────────┬──────────────────┘
                    │
                    │ 1..*
                    ▼
┌─────────────────────────────────────┐
│            Message                  │
├─────────────────────────────────────┤
│ - id: Long                          │
│ - conversation: Conversation     │
│ - sender: User                     │
│ - content: String                  │
│ - isRead: Boolean                  │
│ - createdAt: DateTime              │
├─────────────────────────────────────┤
│ + send()                           │
│ + markAsRead()                     │
│ + delete()                        │
└─────────────────────────────────────┘
```

### 1.5 Quiz Classes

```
┌─────────────────────────────────────┐
│             Quiz                     │
├─────────────────────────────────────┤
│ - id: Long                          │
│ - job: Job                          │
│ - title: String                     │
│ - questions: List<Question>        │
│ - timeLimit: Integer               │
│ - passingScore: Integer            │
├─────────────────────────────────────┤
│ + create()                         │
│ + publish()                        │
│ + calculateScore()                │
└──────────────────┬──────────────────┘
                    │
                    │ 1..*
                    ▼
┌─────────────────────────────────────┐
│           Question                  │
├─────────────────────────────────────┤
│ - id: Long                          │
│ - quiz: Quiz                        │
│ - text: String                      │
│ - type: QuestionType               │
│ - options: List<String>            │
│ - correctAnswer: String           │
│ - points: Integer                  │
├─────────────────────────────────────┤
│ + addOption()                      │
│ + setCorrectAnswer()              │
└──────────────────┬──────────────────┘
                    │
                    │ 1..*
                    ▼
┌─────────────────────────────────────┐
│        QuizAttempt                  │
├─────────────────────────────────────┤
│ - id: Long                          │
│ - quiz: Quiz                        │
│ - user: User                        │
│ - answers: Map<Question, String>    │
│ - score: Integer                    │
│ - attemptedAt: DateTime            │
├─────────────────────────────────────┤
│ + submit()                         │
│ + getScore()                      │
└─────────────────────────────────────┘
```

---

## 2. SEQUENCE DIAGRAM

### 2.1 User Login Sequence

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Client  │  │  Auth    │  │  User    │  │  JWT     │
│          │  │ Controller│ Repository│ Provider │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     │ 1.POST /login             │             │
     ├─────►────────────────────►│             │
     │             │             │             │
     │ 2.validate │             │             │
     │◄────────────│             │             │
     │             │             │             │
     │ 3.findByEmail             │             │
     ├─────────────────────►─────┤             │
     │             │             │             │
     │ 4.User     │             │             │
     │◄────────────│◄────────────┤             │
     │             │             │             │
     │ 5.PasswordMatch│          │             │
     │◄────────────│             │             │
     │             │             │             │
     │ 6.GenerateJWT│            │             │
     ├────────────────────────────►│         │
     │             │             │             │
     │ 7.Token     │             │             │
     │◄────────────│◄────────────┤             │
     │             │             │             │
     │ 8.Response │             │             │
     ├─────►────────────────────►│             │
     │             │             │             │
```

### 2.2 Job Application Sequence

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Client  │  │JobController│  App    │  │   AI     │
│          │  │          │  Repository│ │ Service  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     │ 1.POST /apply              │             │
     ├─────►────────────────────►│             │
     │             │             │             │
     │ 2.Validate│              │             │
     │◄────────────│             │             │
     │             │             │             │
     │ 3.Create App             │             │
     ├─────────────────────►─────┤             │
     │             │             │             │
     │ 4.Save      │             │             │
     │◄────────────│◄────────────┤             │
     │             │             │             │
     │ 5.Get Resume              │             │
     ├──────────────────────►────┤             │
     │             │             │             │
     │ 6.Resume    │             │             │
     │◄────────────│◄────────────┤             │
     │             │             │             │
     │ 7.Analyze Match           │             │
     ├──────────────────────────►│           │
     │             │             │             │
     │ 8.Score      │             │             │
     │◄────────────│◄────────────┤             │
     │             │             │             │
     │ 9.Update MatchScore       │             │
     │◄────────────│             │             │
     │             │             │             │
     │ 10.Send Notification       │            │
     ├─────────────────────►──────┤           │
     │             │             │             │
     │ 11.Response │             │             │
     ├─────►────────────────────►│             │
     │             │             │             │
```

### 2.3 Real-time Messaging Sequence

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Sender   │  │WebSocket │  │Message   │  │ Receiver │
│  Client   │  │ Handler │  │Service   │  │ Client   │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     │ 1.CONNECT /ws/chat        │             │
     ├─────►───────►────────────►│             │
     │             │             │             │
     │ 2.SESSION  │             │             │
     │◄───────────◄─────────────┤             │
     │             │             │             │
     │ 3.SEND message           │             │
     ├─────►───────►────────────│             │
     │             │             │             │
     │ 4.Validate │             │             │
     │◄────────────│             │             │
     │             │             │             │
     │ 5.Save to DB             │             │
     ├─────────────────────►──┤             │
     │             │             │             │
     │ 6.ACK       │             │             │
     │◄────────────│◄────────────┤             │
     │             │             │             │
     │ 7.BROADCAST│            │             │
     ├────────────────────►────┤             │
     │             │             │             │
     │ 8.Receive  │             │             │
     ├─────►───────►────────────►│             │
     │             │             │             │
```

---

## 3. OBJECT DIAGRAM

### 3.1 User Object Instance

```
┌─────────────────────────────────────┐
│        <<object>>                   │
│        jobseeker_user_001           │
├─────────────────────────────────────┤
│  id: 1                              │
│  email: "john@example.com"          │
│  firstName: "John"                  │
│  lastName: "Smith"                  │
│  role: JOB_SEEKER                   │
│  createdAt: 2026-01-15T10:30:00    │
│  [resume]: ───────────────────►[object]
│              resume_object_001     │
└─────────────────────────────────────┘

        │
        │ links
        ▼
┌─────────────────────────────────────┐
│        <<object>>                   │
│        resume_object_001            │
├─────────────────────────────────────┤
│  id: 1                              │
│  title: "Software Engineer Resume"  │
│  user_id: 1                         │
│  atsScore: 85                      │
│  isPrimary: true                    │
└─────────────────────────────────────┘
```

### 3.2 Application Object Instance

```
┌─────────────────────────────────────┐
│        <<object>>                   │
│        application_001              │
├─────────────────────────────────────┤
│  id: 100                            │
│  job_id: 50                         │
│  applicant_id: 1                    │
│  resume_id: 1                      │
│  status: INTERVIEWING               │
│  matchScore: 92                    │
│  appliedAt: 2026-02-20T14:00:00    │
│  [job]: ─────────────────────►[object]
│              job_object_050        │
└─────────────────────────────────────┘
        │
        │ links
        ▼
┌─────────────────────────────────────┐
│        <<object>>                   │
│        job_object_050               │
├─────────────────────────────────────┤
│  id: 50                             │
│  title: "Senior Java Developer"     │
│  company: "Tech Corp"              │
│  location: "Remote"                │
│  salary: 120000                    │
└─────────────────────────────────────┘
```

---

## 4. STATE TRANSITION DIAGRAM

### 4.1 Application Status State Machine

```
        ┌──────────────────────────────────────────────────┐
        │                                                  │
        │     ┌─────────┐     SHORTLIST    ┌─────────────┐    │
        │     │ APPLIED │ ─────────────► │  REVIEWED  │    │
        │     └─────────┘                 └─────────────┘    │
        │         │                         │               │
        │         │                      ┌──┴──┐           │
        │         │ REJECT        ┌────►▼────▼◄────┐      │
        │         │          │    │INTERVIEW │    │      │
        │         │          │    └─────────┘    │      │
        │         │          │                  │      │
        │         │          │         OFFER  ◄────┘      │
        │         │          │         │            │    │
        │         │          │    ┌────┴────┐      │    │
        │         │          │    ▼         │      │    │
        │    WITHDRAWN       │ OFFERED ◄────┼──────────┘
        │         │          │    │            │
        │         │          │    └────┬────┘
        │         │          │         ▼
        │         │          │    ┌─────────┐
        │         │          │    │REJECTED │
        │         │          │    └─────────┘
        │         │ ACCEPTED
        │         │◄───────────┘
        │         │
        │◄───────┤
        └────────┘
```

### 4.2 Job Status State Machine

```
         ┌─────────┐     publish     ┌─────────┐
         │ DRAFT   │ ─────────────► │ ACTIVE  │
         └─────────┘                 └─────────┘
             │                       │
             │                     ┌──┴──┐
             │                ┌──►▼────▼◄────┐
             │                │    CLOSED   ◄─┼─────►Archive
             │                └──────────────┘
             │                     │
             ▼                     │
         ┌─────────┐              │
         │ CANCEL │              │
         └─────────┘              │
```

---

## 5. COMPONENT DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND COMPONENTS                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Auth Pages  │  │ Job Pages   │  │Resume Pages │  │Dashboard│  │
│  │ (Login,Reg)│  │ (Search,Post│  │(Builder,Hub│  │(Analytics│  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬───┘  │
│         │                │                │              │        │
│         └────────────────┼────────────────┼──────────────┘        │
│                          │                                  │
│                   ┌──────┴──────┐                    ┌─────┴──────┐
│                   │  API Client │                    │ WebSocket  │
│                   │ (Axios)    │                    │ Client   │
│                   └──────┬─────┘                    └─────┬─────┘
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │
                           │ HTTP/WebSocket
                           │
┌──────────────────────────┼──────────────────────────────────────────┐
│                     BACKEND COMPONENTS                            │
├──────────────────────────┼──────────────────────────────────────────┤
│                   ┌──────┴─────┐                           │
│                   │ REST API   │                           │
│                   │ Controller│                           │
│                   └──────┬─────┘                           │
│         ┌────────────────┼────────────────┐                 │
│         │                │                │                 │
│   ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐   ┌────┴─────┐
│   │ Auth     │   │ Job       │   │Application│   │ Message  │
│   │ Service  │   │ Service  │   │ Service   │   │ Service │
│   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └────┬─────┘
│         │                │                │              │
│   ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐   ┌────┴─────┐
│   │ JWT       │   │ JPA      │   │ AI       │   │ WebSocket│
│   │ Provider │   │ Repository│   │ Engine   │   │ Handler │
│   └──────────┘   └──────────┘   └──────────┘   └─────────┘
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

        │
        ▼
┌───────────────────────────────────────────────��─��────────────────┐
│                        DATABASE                                   │
├──────────────────────────────────────────────────────────────────┤
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│   │  MySQL  │    │  MySQL   │    │  MySQL   │    │  MySQL  │       │
│   │  User  │    │   Job    │    │Application│  │ Message │       │
│   └─────────┘    └─────────┘    └──────────┘    └─────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. DEPLOYMENT DIAGRAM

```
                            ┌─────────────────────────────────────┐
                            │         INTERNET                      │
                            └──────────────────┬──────────────┘
                                           │
                                ┌────────────┴────────────┐
                                │    CDN / Load Balancer    │
                                │    (Cloudflare/AWS)    │
                                └───────────┬────────────┘
                                            │
                        ┌─────────────────────┼─────────────────────┐
                        │                   │                     │
                        ▼                   ▼                     ▼
            ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
            │   Frontend App    │ │   Frontend App    │ │   Frontend App    │
            │  (Vercel/CDN)    │ │  (Vercel/CDN)    │ │  (Vercel/CDN)    │
            │   React + Vite  │ │   React + Vite  │ │   React + Vite  │
            └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                      │                   │                   │
                      └─────────────────────┼─────────────────────┘
                                            │
                                            ▼
                            ┌────────────────────────────┐
                            │     API Gateway          │
                            │    (Spring Boot)         │
                            └───────────┬────────────┘
                                        │
           ┌───────────────────────────────┼───────────────────────────────┐
           │                               │                               │
           ▼                               ▼                               ▼
┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
│  Auth Service    │         │  Job Service     │         │ Message Service  │
│  (JWT)          │         │  (CRUD)          │         │  (WebSocket)      │
└───────────────────┘         └───────────────────┘         └───────────────────┘
           │                               │                               │
           └───────────────────────────────┼───────────────────────────────┘
                                        │
                                        ▼
                            ┌────────────────────────────┐
                            │    MySQL Database          │
                            │    (RDS/AWS)              │
                            └────────────────────────────┘
```

---

*Submitted by:* [Your Name]
*Guide Sign:* _______________
*Date:* 27/03/2026