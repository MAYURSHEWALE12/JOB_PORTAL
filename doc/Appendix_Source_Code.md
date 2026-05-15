# Appendix B: Core Source Code (Important Excerpts)

This section contains the most critical implementation logic for the HireHub project, highlighting the use of Spring Security, Natural Language Processing, and Real-Time WebSocket communication.

---

## 1. Backend: Security Configuration (`SecurityConfig.java`)
This file defines the stateless JWT security filter chain, CORS policies, and role-based access control rules.

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserRepository userRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/jobs/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

---

## 2. Backend: AI Match Scoring Service (`ResumeAnalysisService.java`)
This service uses Apache PDFBox to extract text from resumes and calculates a predictive match score based on keyword tokenization.

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ResumeAnalysisService {

    private final ResumeAnalysisRepository analysisRepository;
    private final CloudinaryService cloudinaryService;

    public ResumeAnalysis analyzeMatch(Long resumeId, Long jobId) {
        Resume resume = resumeRepository.findById(resumeId).get();
        Job job = jobRepository.findById(jobId).get();

        String text = extractText(resume);
        return performAnalysis(resume, job, text);
    }

    private String extractText(Resume resume) {
        // Logic to fetch PDF from Cloudinary and extract text using PDFBox
        try (PDDocument document = PDDocument.load(url.openStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private ResumeAnalysis performAnalysis(Resume resume, Job job, String text) {
        // Tokenization and Match Scoring Algorithm
        String normalizedText = text.toLowerCase();
        Set<String> jobKeywords = extractKeywords(job.getDescription());
        
        long matches = jobKeywords.stream()
                .filter(normalizedText::contains)
                .count();
                
        int score = (int) ((double) matches / jobKeywords.size() * 100);
        
        return analysisRepository.save(ResumeAnalysis.builder()
                .score(score)
                .analyzedAt(LocalDateTime.now())
                .build());
    }
}
```

---

## 3. Backend: Real-Time Messaging Controller (`MessageWebSocketController.java`)
Handles the STOMP WebSocket routing for instant peer-to-peer messaging between candidates and recruiters.

```java
@Controller
@RequiredArgsConstructor
public class MessageWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageDTO messageDto) {
        Message savedMessage = messageService.saveMessage(messageDto);
        
        // Push to private topic of the receiver
        messagingTemplate.convertAndSendToUser(
                messageDto.getReceiverId().toString(),
                "/topic/private",
                savedMessage
        );
    }
}
```

---

## 4. Frontend: Application Router & Global State (`App.jsx`)
Defines the client-side routing, lazy-loaded pages, and global state hydration logic.

```jsx
function AppRoutes() {
    const location = useLocation();

    return (
        <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/jobs" element={<JobsPage />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AnimatePresence>
        </Suspense>
    );
}

function App() {
    const { user, isLoggedIn, restoreUser } = useAuthStore();
    const { connect, disconnect } = useWebsocketStore();

    useEffect(() => {
        restoreUser();
    }, [restoreUser]);

    useEffect(() => {
        if (isLoggedIn && user?.id) {
            connect(user.id);
        }
        return () => disconnect();
    }, [isLoggedIn, user?.id]);

    return (
        <Router>
            <Toaster position="top-right" />
            <AppRoutes />
        </Router>
    );
}
```
