# 🚀 HireHub: Premium Job Portal

HireHub is a state-of-the-art, full-stack job portal application designed to bridge the gap between talented job seekers and industry-leading employers. Built with a modern tech stack centered around **Spring Boot**, **React 19**, and **Vanilla CSS**, it offers a high-performance, immersive experience with a focus on premium aesthetics and intelligent automation.

---

## ✨ Premium Features

### 👤 For Job Seekers
- **🔔 Personal Job Alerts (Radar):** A sophisticated automated matching engine. Set your keywords, location, and salary, and let HireHub watch the market for you.
- **⚡ Smart Notifications:** Interactive, real-time alerts for job matches, messages, and interview updates that take you exactly where you need to be with one click.
- **🔍 Intelligent Job Discovery:** Advanced multi-filter search with a pulsing "Watching" indicator for live updates.
- **🧬 AI Match Analysis:** Predictive "Match Score" using AI to analyze how well your resume fits a specific job posting.
- **💬 Real-time Messaging:** Professional chat system with employers, integrated directly into your dashboard.
- **📋 Visual Application Pipeline:** Track your journey from "Applied" to "Offered" with a sleek, interactive tracker.
- **📝 AI Resume Builder:** Create professional, ATS-friendly resumes directly within the platform.

### 🏢 For Employers
- **📈 Recruiter Analytics:** Deep insights into job performance (views, applications, and candidate quality).
- **🎯 Smart ATS Management:** A specialized workflow to move candidates through custom recruitment stages.
- **🧠 Quiz Creator:** Build custom screening tests for each job posting to filter top-tier talent automatically.
- **🏢 Company Branding:** Fully customizable profiles with premium glassmorphism design and custom banners.
- **📅 Interview Command Center:** Schedule and manage interview phases with integrated seeker notifications.

### 🎨 Design & UX
- **💎 Elite Mastery UI:** A custom design system focusing on micro-animations, glassmorphism, and premium typography.
- **🦴 Skeleton Loading:** High-fidelity pulsing placeholders across all data-heavy sections for a seamless perceived performance.
- **🌓 Adaptive Theme:** Full support for sleek Dark Mode and clean Light Mode with instant switching.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 17+, Spring Boot 3.x, Spring Security (JWT), Spring Data JPA, MySQL, WebSocket (STOMP) |
| **Frontend** | React 19, Vite, Vanilla CSS, Zustand, Framer Motion, Recharts, Lucide Icons |
| **Integrations** | Brevo (SMTP) for Job Alerts, Google OAuth2, Real-time WebSocket Broker |

---

## 📂 Project Structure

```bash
Job portal project/
├── job-portal-backend/         # Spring Boot REST API
│   ├── src/main/java/.../      # Java Source Code (Service, Controller, Repository)
│   └── .env                    # Environment variables for DB & API Keys
├── job-portal-v2/              # React + Vite Frontend
│   ├── src/components/         # Premium UI Components & Layouts
│   ├── src/store/              # Zustand Global State Management
│   └── src/services/           # API Integration Layer
└── README.md                   # Project Documentation
```

---

## 🚀 Getting Started

Follow these steps to set up HireHub on your local machine.

### 1️⃣ Prerequisites
Ensure you have the following installed:
- **Java Development Kit (JDK) 17+**
- **Node.js 18+** & **npm**
- **MySQL Server 8.0+**
- **Maven** (optional, wrapper included)

---

### 2️⃣ Database Configuration
1. Open your MySQL terminal or workbench.
2. Create the database:
   ```sql
   CREATE DATABASE job_portal;
   ```

---

### 3️⃣ Backend Setup (Spring Boot)
1. Navigate to the backend directory:
   ```bash
   cd job-portal-backend
   ```
2. Create a `.env` file in the root of `job-portal-backend/` and add your credentials:
   ```env
   # Database
   DB_URL=jdbc:mysql://localhost:3306/job_portal
   DB_USERNAME=your_mysql_username
   DB_PASSWORD=your_mysql_password

   # Security
   JWT_SECRET=your_long_64_character_secret_key

   # Integrations (Brevo/SMTP)
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USERNAME=your_email
   SMTP_PASSWORD=your_smtp_key

   # Google OAuth2 (Optional for Social Login)
   GOOGLE_CLIENT_ID=your_id
   GOOGLE_CLIENT_SECRET=your_secret
   ```
3. Run the backend server:
   ```bash
   # Windows
   .\mvnw.cmd spring-boot:run
   
   # Linux/Mac
   ./mvnw spring-boot:run
   ```
   *The backend will be live at `http://localhost:8080`*

---

### 4️⃣ Frontend Setup (React + Vite)
1. Navigate to the frontend directory:
   ```bash
   cd job-portal-v2
   ```
2. Install the premium dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be live at `http://localhost:5173`*

---

### 🧪 Verification
- Open your browser to `http://localhost:5173`.
- You should see the **Vertex Industrial** landing page.
- Log in or Register to start using the **Personal Job Alerts**!

---

## 🛡️ Security & Performance
- **Secure Authentication**: JWT-based stateless authentication with secure cookie storage.
- **Optimized Performance**: Lazy loading, intelligent caching, and optimized database queries for large-scale job listings.
- **Real-Time Scalability**: WebSocket broker configured for high-concurrency notification delivery.

---

## 📄 License
This project is for educational and professional demonstration purposes.

## 🤝 Support
For any questions regarding the **Elite Mastery** features or architectural implementation, please contact the lead developer.
