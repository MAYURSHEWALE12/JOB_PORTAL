# UI/UX DESIGN DOCUMENT

---

## 1. DESIGN SYSTEM

### 1.1 Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|----------|-------|
| `--color-primary` | #6366F1 | #818CF8 | Primary buttons, links |
| `--color-primary-hover` | #4F46E5 | #A5B4FC | Button hover states |
| `--color-secondary` | #10B981 | #34D399 | Success states |
| `--color-accent` | #F59E0B | #FBBF24 | Warnings, highlights |
| `--color-error` | #EF4444 | #F87171 | Error states |
| `--color-background` | #FFFFFF | #0F172A | Page background |
| `--color-surface` | #F8FAFC | #1E293B | Cards, modals |
| `--color-text-primary` | #0F172A | #F1F5F9 | Main text |
| `--color-text-secondary` | #64748B | #94A3B8 | Secondary text |
| `--color-border` | #E2E8F0 | #334155 | Borders |

### 1.2 Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|------|------------|
| Display | Inter | 700 | 48px | 1.1 |
| H1 | Inter | 700 | 36px | 1.2 |
| H2 | Inter | 600 | 28px | 1.3 |
| H3 | Inter | 600 | 22px | 1.4 |
| Body | Inter | 400 | 16px | 1.5 |
| Small | Inter | 400 | 14px | 1.5 |
| Caption | Inter | 500 | 12px | 1.4 |

### 1.3 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight spacing |
| `--space-sm` | 8px | Component internal |
| `--space-md` | 16px | Standard padding |
| `--space-lg` | 24px | Section spacing |
| `--space-xl` | 32px | Major sections |
| `--space-2xl` | 48px | Page margins |

### 1.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Buttons, inputs |
| `--radius-md` | 8px | Cards |
| `--radius-lg` | 12px | Modals |
| `--radius-full` | 9999px | Pills, avatars |

### 1.5 Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) |
| `--shadow-md` | 0 4px 6px rgba(0,0,0,0.1) |
| `--shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) |
| `--shadow-glow` | 0 0 20px rgba(99,102,241,0.3) |

---

## 2. WIREFRAMES

### 2.1 Landing Page (Home)

```
┌────────────────────────────────────────────────────────────────────┐
│ [Logo]        Home  Jobs  Companies  About    [Login] [Register]    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                        Find Your Dream Job                          │
│               Connect with top companies and opportunities         │
│                                                                    │
│    ┌─────────────────────────────────────────────────────────┐   │
│    │ [🔍 Search jobs, titles, or keywords   ] [Search]           │   │
│    └─────────────────────────────────────────────────────────┘   │
│                                                                    │
│         Popular        Remote        Tech        Marketing                │
│          Jobs         Jobs         Jobs         Jobs                      │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               ��
│  │ Senior  │  │ Frontend │  │ Product  │  │ DevOps   │               │
│  │ Python  │  │ Developer│ │ Manager  │  │ Engineer │               │
│  │ Developer│  │         │  │         │  │         │               │
│  │ $120k   │  │ $95k    │  │ $110k   │  │ $130k   │               │
│  │ Remote  │  │ Remote  │  │ NYC      │  │ Remote  │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│                                                                    │
│        ──────────────────────────────────────────────              │
│                                                                    │
│                    Trusted by Top Companies                        │
│                                                                    │
│           [Google]  [Meta]  [Amazon]  [Netflix]  [Spotify]          │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ © 2026 HireHub. All rights reserved.                             │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 Job Search Page

```
┌────────────────────────────────────────────────────────────────────┐
│ [Logo] Dashboard   Jobs   Messages   [Notifications] [Profile ▼]  │
├────────────────────────────────────────┬───────────────────────────┤
│ FILTERS                              │ SEARCH RESULTS (42 jobs)  │
│                                     │                           │
│ □ Remote Only                       │ ┌─────────────────────────┐ │
│                                     │ │ Senior Java Developer   │ │
│ Location                           │ │ Tech Corp • Remote      │ │
│ ├─ Remote                          │ │ $120k - $150k        │ │
│ ├─ New York                        │ │ Full-time • 2d ago   │ │
│ ├─ San Francisco                  │ │ [View Details] [Save]│ │
│ └─ London                          │ └─────────────────────────┘ │
│                                     │                           │
│ Salary Range                       │ ┌─────────────────────────┐ │
│ ○ $50k - $80k                      │ │ Frontend Engineer     │ │
│ ○ $80k - $120k                     │ │ StartupXYZ • NYC      │ │
│ ○ $120k+                           │ │ $90k - $120k          │ │
│                                     │ │ Full-time • 5h ago    │ │
│ Job Type                           │ │ [View Details] [Save]│ │
│ ☑ Full-time                       │ └─────────────────────────┘ │
│ ☑ Part-time                       │                           │
│ ☐ Contract                         │ ┌─────────────────────���───┐ │
│                                     │ │ UI/UX Designer         │ │
│ Experience                         │ │ Design Studio • Remote│ │
│ ○ Entry Level                      │ │ $80k - $100k         │ │
│ ○ Mid Level                        │ │ Full-time • 1d ago   │ │
│ ○ Senior Level                    │ │ [View Details] [Save]│ │
│ ○ Executive                       │ └─────────────────────────┘ │
└────────────────────────────────────────┴───────────────────────────┘
```

### 2.3 Job Seeker Dashboard

```
┌────────────────────────────────────────────────────────────────────┐
│ [Logo]  [Dashboard] [Jobs] [Applications] [Quizzes] [Messages]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Welcome back, John!                                                │
│                                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
│  │ 5       │ │ 3       │ │ 2       │ │ 1       │                      │
│  │ Active  │ │ In      │ │ Under   │ │ Interview│                     │
│  │ Apps    │ │ Review  │ │ Review  │ │ Stage   │                      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                      │
│                                                                    │
│  YOUR APPLICATIONS                                                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ ┌───────┐ Senior Python Developer    Tech Corp    INTERVIEWING   │ │
│  │ │ Logo │ │ Applied: Feb 20    Match: 92%                  │ │
│  │ └───────┘ │ [View] [Message] [Withdraw  ]                  │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ ┌───────┐ Frontend Developer         StartupXYZ   REVIEWED     │ │
│  │ │ Logo │ │ Applied: Feb 18    Match: 78%                  │ │
│  │ └───────┘ │ [View] [Message] [Withdraw  ]                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  RECOMMENDED JOBS                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ React Dev   │ │ UX Designer │ │ Data Analyst │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
└────────────────────────────────────────────────────────────────────┘
```

### 2.4 Employer Dashboard

```
┌────────────────────────────────────────────────────────────────────┐
│ [Logo]  [Dashboard] [Post Job] [Applications] [Quizzes] [Messages]│
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Tech Corp (Employer)                              [Company Profile]   │
│                                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
│  │ 12      │ │ 156     │ │ 8        │ │ 3        │                      │
│  │ Active  │ │ Total   │ │ Pending │ │ In       │                      │
│  │ Jobs    │ │ Apps    │ │ Review  │ │ Interview│                      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                      │
│                                                                    │
│  APPLICATION PIPELINE                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                     │
│  │Applied│ │Review│ │Short │ │Inter│ │Offer│                      │
│  │  45   │ │  28   │ │  12  │ │  5   │ │  2  │                      │
│  │ ▓▓▓▓▓ │ │ ▓▓▓▓░ │ │ ▓▓░░ │ │ ▓░░░ │ │ ░░░░│                      │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                     │
│                                                                    │
│  RECENT APPLICATIONS                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ John D. • Python • Match: 92%    [Review] [Schedule] [Reject]  │ │
│  │ Jane S. • React • Match: 88%     [Review] [Schedule] [Reject]  │ │
│  │ Mike T. • Java • Match: 75%      [Review] [Schedule] [Reject]  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 2.5 Resume Builder

```
┌────────────────────────────────────────────────────────────────────┐
│ [Logo]  Resume Builder  [My Resumes]                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  RESUME BUILDER                     [Preview] [Download PDF]          │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ PERSONAL DETAILS                                             │ │
│  │ Full Name: [________________________]                         │ │
│  │ Email:    [________________________]                        │ │
│  │ Phone:   [________________________]                        │ │
│  │ Location: [________________________]                        │ │
│  │ LinkedIn: [________________________]                         │ │
│  │ GitHub:   [________________________]                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ EDUCATION                                                 │ │
│  │ [+ Add Education]                                         │ │
│  │ Institution: [________________] Degree: [___________]   │ │
│  │ Field: [________________] GPA: [__] From: [__] To: [__]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ EXPERIENCE                                                │ │
│  │ [+ Add Experience]                                       │ │
│  │ Company: [________________] Title: [________________]   │ │
│  │ From: [__] To: [__] Description: [___________________] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ SKILLS                                                    │ │
│  │ [+ Add Skill]                                             │ │
│  │ [Java] [React] [Python] [Node.js] [+Add]                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 2.6 Application Pipeline (Kanban)

```
┌────────────────────────────────────────────────────────────────────┐
│ [Logo] Applications  [Pipeline] [List] [Chart]                    │
├──────────────────────────────────────────────────��─��───────────────┤
│                                                                    │
│  HIRING PIPELINE - Senior Java Developer                           │
│                                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ APPLIED │ │REVIEWED │ │SHORTLIST│ │INTERVIEW│ │ OFFERED │   │
│  │         │ │         │ │         │ │         │ │         │   │
│  │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │   │
│  │ │Card │ │ │ │Card │ │ │ │Card │ │ │ │Card │ │ │ │Card │ │   │
│  │ │John │ │ │ │Jane │ │ │ │Mike │ │ │ │Sam │ │ │ │Alex │ │   │
│  │ │92%  │ │ │ │85%  │ │ │ │78%  │ │ │ │95%  │ │ │ │88%  │ │   │
│  │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │   │
│  │         │ │         │ │         │ │         │ │         │   │
│  │ + Add   │ │         │ │         │ │         │ │         │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. LAYOUT SPECIFICATIONS

### 3.1 Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column, stacked navigation |
| Tablet | 640px - 1024px | Two column, collapsible sidebar |
| Desktop | > 1024px | Full layout, fixed sidebar |

### 3.2 Grid System

- **Container**: max-width 1280px, centered
- **Grid**: 12-column, gap 24px
- **Sidebar**: 280px fixed width
- **Content Area**: Flexible, min-height calc(100vh - header)

### 3.3 Component States

| Component | Default | Hover | Active | Disabled |
|-----------|---------|-------|--------|----------|
| Button Primary | bg-primary | bg-primary-hover | scale(0.98) | opacity(0.5) |
| Button Secondary | border-primary | bg-primary/10 | scale(0.98) | opacity(0.5) |
| Input | border-border | border-primary | ring-primary | bg-gray-100 |
| Card | shadow-md | shadow-lg, translateY(-2px) | - | opacity(0.7) |
| Link | text-primary | underline | text-primary-hover | text-gray-400 |

---

## 4. ANIMATIONS

### 4.1 Page Transitions
- Entrance: fadeIn + slideUp, 300ms ease-out
- Exit: fadeOut, 200ms ease-in

### 4.2 Micro-interactions
- Button hover: scale(1.02), 150ms
- Card hover: translateY(-4px), 200ms
- Input focus: ring, 150ms

### 4.3 Loading States
- Spinner: rotate 360deg, 1s linear infinite
- Skeleton: shimmer, 1.5s ease-in-out infinite

---

*Submitted by:* [Your Name]
*Guide Sign:* _______________
*Date:* 01/04/2026