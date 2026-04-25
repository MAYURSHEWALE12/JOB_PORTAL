# TESTING & DEPLOYMENT DOCUMENTATION

---

## 1. TESTING

### 1.1 Test Cases

#### Authentication Module
| Test ID | Test Case | Expected Result | Status |
|---------|----------|-----------------|--------|
| TC-001 | Login with valid credentials | Successful login, token returned | ✓ Pass |
| TC-002 | Login with invalid credentials | Error message displayed | ✓ Pass |
| TC-003 | Login with empty fields | Validation error | ✓ Pass |
| TC-004 | Register with valid data | Account created | ✓ Pass |
| TC-005 | Register with duplicate email | Error message | ✓ Pass |
| TC-006 | Logout | Session cleared | ✓ Pass |
| TC-007 | JWT token expiration | Redirect to login | ✓ Pass |

#### Job Search Module
| Test ID | Test Case | Expected Result | Status |
|---------|----------|-----------------|--------|
| TC-101 | Search jobs by keyword | Matching jobs displayed | ✓ Pass |
| TC-102 | Search jobs with filters | Filtered results | ✓ Pass |
| TC-103 | Save job | Job saved to list | ✓ Pass |
| TC-104 | View saved jobs | Saved jobs displayed | ✓ Pass |
| TC-105 | Apply to job | Application submitted | ✓ Pass |

#### Resume Module
| Test ID | Test Case | Expected Result | Status |
|---------|----------|-----------------|--------|
| TC-201 | Build complete resume | Resume saved | ✓ Pass |
| TC-202 | Upload PDF resume | File uploaded | ✓ Pass |
| TC-203 | Generate PDF | PDF downloaded | ✓ Pass |
| TC-204 | ATS Analysis | Score displayed | ✓ Pass |
| TC-205 | Delete resume | Resume removed | ✓ Pass |

#### Application Module
| Test ID | Test Case | Expected Result | Status |
|---------|----------|-----------------|--------|
| TC-301 | Track application status | Status displayed | ✓ Pass |
| TC-302 | Update application status | Status updated | ✓ Pass |
| TC-303 | View match score | Score displayed | ✓ Pass |
| TC-304 | Kanban drag-and-drop | Status changed | ✓ Pass |
| TC-305 | Withdraw application | Application withdrawn | ✓ Pass |

#### Messaging Module
| Test ID | Test Case | Expected Result | Status |
|---------|----------|-----------------|--------|
| TC-401 | Send message | Message delivered | ✓ Pass |
| TC-402 | Receive message | Message displayed | ✓ Pass |
| TC-403 | Real-time delivery | Instant display | ✓ Pass |
| TC-404 | Message history | History loaded | ✓ Pass |

### 1.2 Unit Testing

```java
// JobServiceTest.java
@SpringBootTest
class JobServiceTest {
    
    @Autowired
    private JobService jobService;
    
    @Test
    void testCreateJob() {
        Job job = new Job();
        job.setTitle("Software Engineer");
        job.setDescription("Full stack developer");
        
        Job saved = jobService.createJob(job, employer);
        
        assertNotNull(saved.getId());
        assertEquals("Software Engineer", saved.getTitle());
    }
    
    @Test
    void testSearchJobs() {
        List<Job> jobs = jobService.searchJobs("developer", "remote", null);
        
        assertTrue(jobs.size() > 0);
        assertTrue(jobs.stream().allMatch(j -> j.getTitle().contains("developer")));
    }
}
```

### 1.3 Integration Testing

```java
// AuthControllerIntegrationTest.java
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testLogin() throws Exception {
        mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"test@test.com\",\"password\":\"password\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists());
    }
}
```

### 1.4 Frontend Testing

```javascript
// LoginPage.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './LoginPage';

test('renders login form', () => {
  render(<LoginPage />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

test('shows error on invalid login', async () => {
  render(<LoginPage />);
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  expect(await screen.findByText(/invalid/i)).toBeInTheDocument();
});
```

---

## 2. DEBUGGING

### 2.1 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Expired JWT | Refresh token or re-login |
| CORS Error | Missing headers | Add CORS config |
| WebSocket connection fail | Wrong URL | Check WebSocket endpoint |
| File upload fail | Size limit | Increase max size |
| Slow load | Large payload | Implement pagination |
| PDF not generating | Missing library | Add PDF library |

### 2.2 Debug Tools

- **Browser DevTools**: Console logs, Network tab
- **Postman**: API testing
- **MySQL Workbench**: Database queries
- **Chrome React DevTools**: Component inspection

---

## 3. DEPLOYMENT

### 3.1 Backend Deployment

```bash
# Build
cd job-portal-backend
./mvnw clean package

# Run
java -jar target/nexthire-1.0.0.jar
```

### 3.2 Frontend Deployment

```bash
# Build for production
cd job-portal-v2
npm run build

# Deploy to Vercel
vercel deploy --prod
```

### 3.3 Environment Variables

```
# Backend
DB_URL=jdbc:mysql://localhost:3306/job_portal
DB_USERNAME=root
DB_PASSWORD=***
JWT_SECRET=***
SMTP_USERNAME=***
SMTP_PASSWORD=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# Frontend
VITE_API_URL=https://api.nexthire.com
VITE_WS_URL=wss://api.nexthire.com/ws
```

### 3.4 Production Checklist

- [ ] HTTPS enabled
- [ ] Database configured
- [ ] Environment variables set
- [ ] CORS configured for production domain
- [ ] JWT secret changed
- [ ] Database backed up
- [ ] Logging configured
- [ ] Error handling implemented

---

## 4. DOCUMENTATION

### 4.1 User Manuals

#### For Job Seekers
1. Register as a job seeker
2. Complete your profile
3. Build or upload resume
4. Search for jobs
5. Apply to jobs
6. Track applications
7. Take quizzes
8. Message employers

#### For Employers
1. Register as employer
2. Create company profile
3. Post jobs
4. View applications
5. Create quizzes
6. Schedule interviews
7. View analytics
8. Message candidates

### 4.2 System Manual

- **Start Backend**: `./mvnw spring-boot:run`
- **Start Frontend**: `npm run dev`
- **Database**: MySQL Workbench
- **API Testing**: Postman collection

### 4.3 Final Report Structure

```
1. Project Synopsis
2. SRS Document
3. UML Models
4. UI/UX Design
5. Development Documentation
6. Testing & Deployment
7. Screenshots
8. Code Listings
9. Conclusion
10. References
```

---

## 5. COMPLETION CHECKLIST

| Activity | Expected Date | Actual Date | Guide Sign |
|----------|---------------|-------------|-------------|
| Project Synopsis | 13/03/2026 | __________ | __________ |
| SRS Requirements | 18/03/2026 | __________ | __________ |
| UML Models | 27/03/2026 | __________ | __________ |
| UI/UX Design Review | 01/04/2026 | __________ | __________ |
| Frontend/Backend Dev | 16/04/2026 | __________ | __________ |
| Testing & Debugging | 06/05/2026 | __________ | __________ |
| Final Submission | 09/05/2026 | __________ | __________ |

---

*Submitted by:* [Your Name]
*Guide Sign:* _______________
*Date:* 06/05/2026