# 🚀 HireHub: Premium Job Portal

HireHub is a state-of-the-art, full-stack job portal application designed to bridge the gap between talented job seekers and industry-leading employers. Built with a modern tech stack centered around **Spring Boot 4**, **React 19**, and **Tailwind CSS 4**, it offers a high-performance, immersive experience with a focus on aesthetics and intelligent features.

---

## ✨ Premium Features

### 👤 For Job Seekers
- **Intelligent Job Discovery:** Advanced multi-filter search (location, salary, experience, job type).
- **AI Resume Builder:** Build professional, ATS-friendly resumes directly in the platform.
- **AI Match Analysis:** Predictive "Match Score" using AI to analyze how well your resume fits a specific job posting.
- **Application Tracking:** Visual status pipeline (Applied → Reviewed → Interviewing → Offered).
- **Interactive Quizzes:** Take skill assessments to prove your expertise to employers.
- **Real-time Messaging:** Professional chat system with employers (unlocked after application).
- **Job Notifications:** Instant alerts for status changes and new messages.

### 🏢 For Employers
- **Recruiter Dashboard:** Comprehensive analytics for job postings (views, applications, status breakdown).
- **ATS Management:** Streamlined workflow to manage candidates from application to offer.
- **Quiz Creator:** Build custom screening tests for each job posting to filter top talent.
- **Company Branding:** Fully customizable company profiles with logos, banners, and descriptions.
- **Interview Scheduling:** Manage and track interview phases for candidates.

### 🛡️ Admin & Security
- **Role-Based Access Control (RBAC):** Granular permissions for JobSeekers, Employers, and Admins.
- **Google OAuth2 Integration:** One-click secure login for all users.
- **Secret Management:** Secure handling of API keys and credentials via environment variables.
- **Dark Mode Support:** Premium "Vertex Industrial" design system with seamless theme switching.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 25+, Spring Boot 4.0.4, Spring Security (JWT), Spring Data JPA, Hibernate, MySQL, WebSocket (STOMP) |
| **Frontend** | React 19.2.4, Vite 8.0, Tailwind CSS 4.2.2, Zustand (State Management), Framer Motion (Animations), Recharts |
| **Integrations** | Brevo (SMTP), Google OAuth2, WebSocket Notifications |

---

## 📂 Project Structure

```bash
Job portal project/
├── job-portal-backend/         # Spring Boot REST API
│   ├── src/main/java/.../      # Java Source Code
│   ├── src/main/resources/     # application.properties & Static Assets
│   └── .env                    # Local environment variables (Ignored by Git)
├── job-portal-v2/              # React + Vite Frontend
│   ├── src/components/         # Modular UI Components
│   ├── src/store/              # Zustand Global Stores
│   ├── src/services/           # API Client (Axios)
│   └── tailwind.config.js      # Custom Design Tokens
└── README.md                   # Project Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **JDK 25+**
- **Node.js 18+**
- **MySQL 8.0+**
- **Maven 3.9+**

### 2. Database Setup
Create a MySQL database named `job_portal`:
```sql
CREATE DATABASE job_portal;
```

### 3. Backend Setup
1. Navigate to the backend directory: `cd job-portal-backend`
2. Create or update the `.env` file with your credentials:
   ```env
   DB_USERNAME=root
   DB_PASSWORD=your_password
   JWT_SECRET=your_long_secure_secret_key
   SMTP_USERNAME=your_brevo_email
   SMTP_PASSWORD=your_brevo_smtp_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
3. Run the application:
   ```bash
   .\mvnw.cmd spring-boot:run
   ```

### 4. Frontend Setup
1. Navigate to the frontend directory: `cd job-portal-v2`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the app at `http://localhost:5173`.

---

## 🔒 Security Best Practices
- **Never upload `.env` files** to public repositories.
- Use the provided `application.properties` which utilizes `${ENV_VAR}` placeholders.
- Always use the `DB_PASSWORD` and `JWT_SECRET` variables in production environments.

---

## 📄 License
This project is for educational and professional demonstration purposes.

## 🤝 Support
For any questions or issues, please open an issue in the repository or contact the lead developer.
