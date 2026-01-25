# REdI Competency Assessment Web Application

## Comprehensive Specification Document

**Version:** 1.0  
**Date:** January 2026  
**Project Codename:** REdI Assess  

---

## 1. Executive Summary

### 1.1 Purpose

A web-based application enabling real-time, multi-assessor competency evaluation during clinical education courses. The system must support concurrent access from multiple assessors on various devices while maintaining data consistency and providing a unified dashboard view of all participant progress.

### 1.2 Core Problem Statement

Current paper-based or single-user assessment systems cannot:
- Support simultaneous data entry from multiple assessors
- Provide real-time visibility of assessment progress
- Aggregate feedback efficiently across components and assessors
- Enable quick "pass" workflows for efficient assessment

### 1.3 Success Criteria

1. Multiple assessors can enter data simultaneously without conflicts
2. Dashboard updates within 5 seconds of any data change
3. Complete assessment for one participant in under 3 minutes (when passing)
4. Zero data loss even with intermittent connectivity

---

## 2. Domain Model

### 2.1 Entity Definitions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DOMAIN MODEL                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Course                                                                     │
│  ├── courseId (PK)                                                         │
│  ├── courseName                                                            │
│  ├── courseType: FULL_COURSE | REFRESHER | ASSESSMENT_ONLY                 │
│  ├── courseDate                                                            │
│  ├── courseCoordinator                                                     │
│  └── sharepointRef                                                         │
│                                                                             │
│  Participant                                                                │
│  ├── participantId (PK)                                                    │
│  ├── courseId (FK)                                                         │
│  ├── candidateName                                                         │
│  ├── payrollNumber                                                         │
│  ├── designation                                                           │
│  ├── workArea                                                              │
│  ├── assessmentRole: TEAM_LEADER | TEAM_MEMBER | BOTH                      │
│  └── engagementRating: 1-5 (emoji scale)                                   │
│                                                                             │
│  Component                                                                  │
│  ├── componentId (PK)                                                      │
│  ├── componentName                                                         │
│  ├── componentOrder                                                        │
│  └── courseTemplateId (FK) -- links to course type template                │
│                                                                             │
│  Outcome                                                                    │
│  ├── outcomeId (PK)                                                        │
│  ├── componentId (FK)                                                      │
│  ├── outcomeText                                                           │
│  ├── outcomeOrder                                                          │
│  ├── outcomeType: BONDY_SCALE | BINARY                                     │
│  ├── isMandatory: boolean                                                  │
│  └── applicableTo: TEAM_LEADER | TEAM_MEMBER | BOTH                        │
│                                                                             │
│  Assessment (participant × component)                                       │
│  ├── assessmentId (PK)                                                     │
│  ├── participantId (FK)                                                    │
│  ├── componentId (FK)                                                      │
│  ├── componentFeedback: text                                               │
│  ├── isPassedQuick: boolean (quick-pass button)                            │
│  ├── lastModifiedBy                                                        │
│  └── lastModifiedAt                                                        │
│                                                                             │
│  OutcomeScore                                                               │
│  ├── outcomeScoreId (PK)                                                   │
│  ├── assessmentId (FK)                                                     │
│  ├── outcomeId (FK)                                                        │
│  ├── bondyScore: INDEPENDENT | SUPERVISED | ASSISTED | MARGINAL | NOT_OBS  │
│  ├── binaryScore: PASS | FAIL | null                                       │
│  ├── scoredBy                                                              │
│  └── scoredAt                                                              │
│                                                                             │
│  OverallAssessment (per participant)                                        │
│  ├── overallId (PK)                                                        │
│  ├── participantId (FK)                                                    │
│  ├── overallFeedback: text                                                 │
│  ├── engagementScore: 1-5                                                  │
│  ├── teamLeaderOutcome: PASS | UNSUCCESSFUL_ATTEMPT                        │
│  ├── teamMemberOutcome: PASS | UNSUCCESSFUL_ATTEMPT                        │
│  ├── recommendedAction: enum (see below)                                   │
│  └── lastModifiedAt                                                        │
│                                                                             │
│  Assessor                                                                   │
│  ├── assessorId (PK)                                                       │
│  ├── name                                                                  │
│  ├── email                                                                 │
│  └── pin (simple auth)                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Enumeration Values

**Bondy Scale (5-point competence)**
| Value | Label | Description |
|-------|-------|-------------|
| 5 | Independent | Safe, accurate, and proficient; no supporting cues required |
| 4 | Supervised | Safe, accurate; occasional supportive cues required |
| 3 | Assisted | Safe but requires frequent verbal/physical directive cues |
| 2 | Marginal/Dependent | Unsafe; continuous verbal/physical cues required |
| 1 | Not Observed | Not demonstrated/observed during assessment |

**Recommended Actions (on unsuccessful attempt)**
- `RESTART_LEARNING` - Restart Learning
- `REATTEMPT_COURSE` - Re-Attempt Course  
- `REASSESSMENT_ONLY` - Re-Assessment Only
- `REFER_EDUCATOR` - Refer to Unit Educator

**Engagement Scale (Emoji)**
| Value | Emoji | Meaning |
|-------|-------|---------|
| 5 | 😁 | Excellent engagement |
| 4 | 🙂 | Good engagement |
| 3 | 😐 | Adequate engagement |
| 2 | 🙁 | Poor engagement |
| 1 | 😞 | Very poor engagement |

### 2.3 Course Template Structure (REdI Example)

Based on the uploaded form, the REdI course has these components:

**Component 1: Airway Management and Mask Ventilation**
- Applies to: Team Member
- Outcomes (all Bondy scale, mandatory):
  1. Safely and systematically assesses the patient using a structure (such as DRSABCDE)
  2. Performs manual airway manoeuvres with consideration to spinal injury
  3. Uses suction and patient positioning to clear airway obstruction
  4. Selects and inserts appropriate oropharyngeal and nasopharyngeal airways
  5. Effectively ventilates patient using one-handed and two-handed seal with Bag Mask
  6. Selects and inserts iGel supraglottic airway

**Component 2: Electrical Therapies for Arrhythmias**
- Applies to: Team Member
- Outcomes (all Bondy scale, mandatory):
  1. Safely and systematically assesses the patient using a structure (such as DRSABCDE)
  2. Identifies clinical features of poor perfusion or haemodynamic instability
  3. Selects, prepares and performs appropriate therapy for peri-arrest bradyarrhythmia
  4. Selects, prepares and performs appropriate therapy for peri-arrest tachyarrhythmia

**Component 3: Quality CPR and COACHED Defibrillation**
- Applies to: Team Member
- Outcomes (all Bondy scale, mandatory):
  1. Safely and systematically assesses the patient using a structure (such as DRSABCDE)
  2. Demonstrates effective chest compressions
  3. Demonstrates appropriate placement of adhesive defibrillation pads
  4. Prepares and performs 'charge and check' using COACHED (including disarm/defib on Lifepak)
  5. Promptly and confidently recognises shockable and non-shockable cardiac rhythms
  6. Maintains situational awareness and ensures safe defibrillator operation at all times

**Component 4: Integrated Simulation – Summative Assessment**
- Contains Team Member AND Team Leader outcomes
- Team Member outcomes (Bondy scale):
  - Patient assessment, airway/breathing, circulation, rhythm recognition, medications, reversible causes, post-ROSC care, communication
- Team Leader outcomes (Bondy scale):
  - Leadership/role allocation, situational awareness, prioritisation, reversible causes consideration, medication management

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | Assessors authenticate with name + 4-digit PIN | Must |
| AUTH-02 | Session persists for duration of course day (configurable) | Must |
| AUTH-03 | No role-based permissions for v1 (all assessors equal) | Must |
| AUTH-04 | Future: SSO integration with Queensland Health | Should |

### 3.2 Course Management

| ID | Requirement | Priority |
|----|-------------|----------|
| COURSE-01 | Fetch course details from SharePoint API on demand | Must |
| COURSE-02 | Display course: name, date, type, coordinator | Must |
| COURSE-03 | List all participants with payroll, designation, work area | Must |
| COURSE-04 | Support multiple course types with different templates | Should |
| COURSE-05 | Allow manual participant addition if not in SharePoint | Should |

### 3.3 Assessment Entry

| ID | Requirement | Priority |
|----|-------------|----------|
| ASSESS-01 | Select participant from course list | Must |
| ASSESS-02 | Navigate between components via tabs or swipe | Must |
| ASSESS-03 | For each outcome, select Bondy scale value (tap/click) | Must |
| ASSESS-04 | For binary outcomes, toggle Pass/Fail | Must |
| ASSESS-05 | Free-text feedback field per component (expandable) | Must |
| ASSESS-06 | **Quick Pass button** per component - sets all mandatory outcomes to "Independent" | Must |
| ASSESS-07 | Visual indicator of outcome applicability (TL/TM) | Must |
| ASSESS-08 | Mandatory outcomes visually distinguished from optional | Must |
| ASSESS-09 | Overall free-text feedback field (separate from components) | Must |
| ASSESS-10 | Engagement emoji scale selector (5 levels) | Must |
| ASSESS-11 | Auto-save on every change (no explicit save button) | Must |
| ASSESS-12 | Offline queue for intermittent connectivity | Should |

### 3.4 Concurrent Access & Conflict Resolution

| ID | Requirement | Priority |
|----|-------------|----------|
| SYNC-01 | Real-time sync across all connected devices | Must |
| SYNC-02 | Optimistic locking with last-write-wins for scores | Must |
| SYNC-03 | Append-only merge for feedback text (with assessor attribution) | Should |
| SYNC-04 | Visual indicator when another assessor is editing same participant | Should |
| SYNC-05 | Conflict notification if same outcome scored differently by two assessors | Should |

### 3.5 Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| DASH-01 | Grid view: rows = participants, columns = components | Must |
| DASH-02 | Cell colour indicates: not started, in progress, complete, issues | Must |
| DASH-03 | Click cell to see outcomes scored and any feedback | Must |
| DASH-04 | Engagement emoji displayed per participant | Must |
| DASH-05 | All free-text feedback aggregated and visible | Must |
| DASH-06 | Auto-refresh every 5 seconds (or websocket push) | Must |
| DASH-07 | Summary statistics: % complete, % passed, etc. | Should |
| DASH-08 | Filter/sort by completion status, outcome, designation | Should |
| DASH-09 | Print-friendly view for end-of-day reporting | Should |

### 3.6 Reporting

| ID | Requirement | Priority |
|----|-------------|----------|
| RPT-01 | Generate per-participant assessment summary | Should |
| RPT-02 | Export to PDF matching original form layout | Could |
| RPT-03 | Bulk export for SharePoint upload | Could |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| PERF-01 | Dashboard load time | < 2 seconds |
| PERF-02 | Score entry latency (UI feedback) | < 100ms |
| PERF-03 | Sync propagation to other devices | < 3 seconds |
| PERF-04 | Support concurrent assessors | 10+ simultaneous |
| PERF-05 | Support participants per course | 30+ |

### 4.2 Availability & Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| REL-01 | System uptime during course hours | 99.5% |
| REL-02 | Data durability | No data loss |
| REL-03 | Graceful degradation on network issues | Continue offline |

### 4.3 Usability

| ID | Requirement | Target |
|----|-------------|--------|
| UX-01 | Mobile-first responsive design | All screens work on phone |
| UX-02 | Touch-optimised tap targets | Minimum 44px |
| UX-03 | Assessment entry learnable in < 5 minutes | |
| UX-04 | Dark mode support | Should |

### 4.4 Security

| ID | Requirement | Target |
|----|-------------|--------|
| SEC-01 | HTTPS only | Must |
| SEC-02 | PIN hashed, not stored plain | Must |
| SEC-03 | Session tokens with expiry | Must |
| SEC-04 | Audit log of all score changes | Should |

---

## 5. Technical Architecture

### 5.1 Architecture Decision: Real-Time Sync Strategy

**Option A: Polling** - Simple, but latency 5-10s, higher server load  
**Option B: WebSockets** - Low latency, persistent connections, more complex  
**Option C: Server-Sent Events (SSE)** - Simpler than WS, one-way push, good for dashboard  
**Option D: Firebase/Supabase Realtime** - Managed service, built-in sync, fastest to implement  

**Recommendation:** Option D (Supabase Realtime) for v1
- Built-in Postgres with real-time subscriptions
- Row-level security for future auth expansion
- Generous free tier for development
- Can migrate to self-hosted later if needed

### 5.2 Proposed Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TECHNOLOGY STACK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND                                                                   │
│  ├── Framework: React 18 + TypeScript                                      │
│  ├── State: Zustand (lightweight, good for real-time)                      │
│  ├── UI: Tailwind CSS + shadcn/ui components                               │
│  ├── Real-time: Supabase JS client                                         │
│  ├── Offline: Service Worker + IndexedDB queue                             │
│  └── Build: Vite                                                           │
│                                                                             │
│  BACKEND                                                                    │
│  ├── Database: Supabase (Postgres)                                         │
│  ├── Real-time: Supabase Realtime                                          │
│  ├── Auth: Supabase Auth (simple email+PIN initially)                      │
│  ├── API: Supabase auto-generated REST + custom Edge Functions             │
│  └── SharePoint Integration: Edge Function calling MS Graph API            │
│                                                                             │
│  INFRASTRUCTURE                                                             │
│  ├── Hosting: Vercel (frontend) or self-hosted on your VPS                 │
│  ├── Database: Supabase Cloud (or self-hosted)                             │
│  └── CI/CD: GitHub Actions                                                 │
│                                                                             │
│  ALTERNATIVES FOR SELF-HOSTING                                              │
│  ├── Database: PostgreSQL + pg_notify for changes                          │
│  ├── Real-time: Socket.io or Centrifugo                                    │
│  ├── Backend: Node.js/Express or Fastify                                   │
│  └── Hosting: Docker on your VPS                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Database Schema (PostgreSQL)

```sql
-- Course templates (defines structure for different course types)
CREATE TABLE course_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Components within a template
CREATE TABLE template_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES course_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outcomes within a component
CREATE TABLE template_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID REFERENCES template_components(id) ON DELETE CASCADE,
    outcome_text TEXT NOT NULL,
    display_order INT NOT NULL,
    outcome_type TEXT NOT NULL CHECK (outcome_type IN ('BONDY', 'BINARY')),
    is_mandatory BOOLEAN DEFAULT TRUE,
    applies_to TEXT NOT NULL CHECK (applies_to IN ('TEAM_LEADER', 'TEAM_MEMBER', 'BOTH')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessors (simple auth for now)
CREATE TABLE assessors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    pin_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course instances (actual course days)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES course_templates(id),
    name TEXT NOT NULL,
    course_date DATE NOT NULL,
    course_type TEXT NOT NULL CHECK (course_type IN ('FULL_COURSE', 'REFRESHER', 'ASSESSMENT_ONLY')),
    coordinator TEXT,
    sharepoint_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants in a course
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    candidate_name TEXT NOT NULL,
    payroll_number TEXT,
    designation TEXT,
    work_area TEXT,
    assessment_role TEXT CHECK (assessment_role IN ('TEAM_LEADER', 'TEAM_MEMBER', 'BOTH')),
    engagement_score INT CHECK (engagement_score BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Component-level assessments (per participant)
CREATE TABLE component_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    component_id UUID REFERENCES template_components(id),
    feedback TEXT,
    is_quick_passed BOOLEAN DEFAULT FALSE,
    last_modified_by UUID REFERENCES assessors(id),
    last_modified_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_id, component_id)
);

-- Individual outcome scores
CREATE TABLE outcome_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES component_assessments(id) ON DELETE CASCADE,
    outcome_id UUID REFERENCES template_outcomes(id),
    bondy_score INT CHECK (bondy_score BETWEEN 1 AND 5),
    binary_score BOOLEAN,
    scored_by UUID REFERENCES assessors(id),
    scored_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, outcome_id)
);

-- Overall participant assessment
CREATE TABLE overall_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE UNIQUE,
    overall_feedback TEXT,
    team_leader_outcome TEXT CHECK (team_leader_outcome IN ('PASS', 'UNSUCCESSFUL')),
    team_member_outcome TEXT CHECK (team_member_outcome IN ('PASS', 'UNSUCCESSFUL')),
    recommended_action TEXT CHECK (recommended_action IN (
        'RESTART_LEARNING', 'REATTEMPT_COURSE', 'REASSESSMENT_ONLY', 'REFER_EDUCATOR'
    )),
    last_modified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for compliance
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    assessor_id UUID REFERENCES assessors(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_participants_course ON participants(course_id);
CREATE INDEX idx_component_assessments_participant ON component_assessments(participant_id);
CREATE INDEX idx_outcome_scores_assessment ON outcome_scores(assessment_id);
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);
```

### 5.4 Real-Time Subscription Strategy

```typescript
// Subscribe to changes for a specific course
const subscription = supabase
  .channel('course-assessments')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'component_assessments',
      filter: `participant_id=in.(${participantIds.join(',')})`
    },
    (payload) => handleAssessmentChange(payload)
  )
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'outcome_scores'
    },
    (payload) => handleScoreChange(payload)
  )
  .subscribe();
```

### 5.5 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  src/                                                                       │
│  ├── components/                                                            │
│  │   ├── auth/                                                              │
│  │   │   └── LoginForm.tsx                                                 │
│  │   ├── course/                                                            │
│  │   │   ├── CourseSelector.tsx                                            │
│  │   │   └── ParticipantList.tsx                                           │
│  │   ├── assessment/                                                        │
│  │   │   ├── AssessmentPanel.tsx         # Main assessment entry           │
│  │   │   ├── ComponentTabs.tsx           # Tab navigation                  │
│  │   │   ├── OutcomeRow.tsx              # Single outcome with Bondy       │
│  │   │   ├── BondySelector.tsx           # 5-point scale selector          │
│  │   │   ├── QuickPassButton.tsx         # Marks all mandatory as pass     │
│  │   │   ├── FeedbackInput.tsx           # Expandable text area            │
│  │   │   └── EngagementSelector.tsx      # Emoji scale                     │
│  │   ├── dashboard/                                                         │
│  │   │   ├── DashboardGrid.tsx           # Main grid view                  │
│  │   │   ├── ParticipantRow.tsx          # Row per participant             │
│  │   │   ├── ComponentCell.tsx           # Status indicator cell           │
│  │   │   ├── FeedbackPanel.tsx           # Aggregated feedback view        │
│  │   │   └── StatsBar.tsx                # Summary statistics              │
│  │   └── common/                                                            │
│  │       ├── LoadingSpinner.tsx                                            │
│  │       ├── SyncIndicator.tsx           # Shows connection status         │
│  │       └── OfflineQueue.tsx            # Pending changes indicator       │
│  ├── hooks/                                                                 │
│  │   ├── useRealtime.ts                  # Supabase subscription           │
│  │   ├── useAssessment.ts                # Assessment CRUD                 │
│  │   ├── useOfflineSync.ts               # Offline queue management        │
│  │   └── useCourse.ts                    # Course data fetching            │
│  ├── stores/                                                                │
│  │   ├── assessmentStore.ts              # Zustand store                   │
│  │   └── authStore.ts                                                      │
│  ├── lib/                                                                   │
│  │   ├── supabase.ts                     # Client initialisation           │
│  │   ├── sharepoint.ts                   # SharePoint API wrapper          │
│  │   └── db.ts                           # IndexedDB for offline           │
│  ├── types/                                                                 │
│  │   └── index.ts                        # TypeScript interfaces           │
│  └── utils/                                                                 │
│      ├── bondyScale.ts                   # Scale helpers                   │
│      └── validators.ts                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. User Interface Design

### 6.1 Screen Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────────────────┐    │
│   │             │      │             │      │                         │    │
│   │   Login     │─────▶│   Course    │─────▶│      Dashboard          │    │
│   │  (PIN)      │      │  Selection  │      │   (All Participants)    │    │
│   │             │      │             │      │                         │    │
│   └─────────────┘      └─────────────┘      └───────────┬─────────────┘    │
│                                                         │                   │
│                                                         │ Click participant │
│                                                         ▼                   │
│                                             ┌─────────────────────────┐    │
│                                             │                         │    │
│                                             │   Assessment Entry      │    │
│                                             │   (Single Participant)  │    │
│                                             │                         │    │
│                                             └─────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Dashboard Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REdI Assessment Dashboard                     🔄 Live │ 👤 Sarah │ ⚙️     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Course: REdI Full Course │ Date: 25 Jan 2026 │ Coord: Dr Smith            │
│  Progress: ████████████░░░░ 12/15 complete │ Pass Rate: 92%                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────┬─────────┬─────────┬─────────┬─────────┬─────┬─────┐ │
│  │ Participant       │ Airway  │ Elec Tx │ CPR/AED │ Int Sim │ 😊  │ ✓   │ │
│  ├───────────────────┼─────────┼─────────┼─────────┼─────────┼─────┼─────┤ │
│  │ Jane Smith (RN)   │ ██████  │ ██████  │ ██████  │ ██████  │ 😁  │ ✓   │ │
│  │ 12345 • Ward 4B   │ ✓       │ ✓       │ ✓       │ ✓       │     │     │ │
│  ├───────────────────┼─────────┼─────────┼─────────┼─────────┼─────┼─────┤ │
│  │ John Doe (MO)     │ ██████  │ ████░░  │ ░░░░░░  │ ░░░░░░  │ 🙂  │     │ │
│  │ 12346 • ED        │ ✓       │ 🔄      │         │         │     │     │ │
│  ├───────────────────┼─────────┼─────────┼─────────┼─────────┼─────┼─────┤ │
│  │ Mary Johnson (EN) │ ████░░  │ ░░░░░░  │ ░░░░░░  │ ░░░░░░  │     │     │ │
│  │ 12347 • ICU       │ ⚠️       │         │         │         │     │     │ │
│  └───────────────────┴─────────┴─────────┴─────────┴─────────┴─────┴─────┘ │
│                                                                             │
│  Legend: ██████ Complete │ ████░░ In Progress │ ░░░░░░ Not Started         │
│          ✓ Passed │ ⚠️ Issues │ 🔄 Being Edited                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  📝 Feedback Panel                                               [Expand ▼] │
│  ────────────────────────────────────────────────────────────────────────── │
│  Jane Smith:                                                                │
│    Airway: "Excellent technique with iGel insertion" - Sarah 14:32         │
│    Overall: "Confident performer, ready for independent practice"          │
│  John Doe:                                                                  │
│    Airway: "Good but needed prompting on head tilt" - Mike 14:45           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Assessment Entry (Mobile-First)

```
┌─────────────────────────────────────────┐
│  ← Back    Jane Smith (RN)    💾 Saved  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────┬─────┬─────┬─────┐             │
│  │Airwy│ElecT│ CPR │ Sim │   ← Tabs    │
│  └─────┴─────┴─────┴─────┘             │
│                                         │
│  Airway Management            [✓ PASS]  │
│  ─────────────────────────────────────  │
│                                         │
│  TM: Assesses patient (DRSABCDE) *      │
│  ┌───┬───┬───┬───┬───┐                 │
│  │ I │ S │ A │ M │ N │  ← Bondy scale  │
│  │ ● │   │   │   │   │                 │
│  └───┴───┴───┴───┴───┘                 │
│                                         │
│  TM: Manual airway manoeuvres *         │
│  ┌───┬───┬───┬───┬───┐                 │
│  │ I │ S │ A │ M │ N │                 │
│  │ ● │   │   │   │   │                 │
│  └───┴───┴───┴───┴───┘                 │
│                                         │
│  TM: Uses suction appropriately *       │
│  ┌───┬───┬───┬───┬───┐                 │
│  │ I │ S │ A │ M │ N │                 │
│  │   │ ● │   │   │   │                 │
│  └───┴───┴───┴───┴───┘                 │
│                                         │
│  ... more outcomes ...                  │
│                                         │
│  ─────────────────────────────────────  │
│  📝 Component Feedback                  │
│  ┌─────────────────────────────────────┐│
│  │ Good technique overall. Needed      ││
│  │ slight prompting on head tilt...    ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  Overall Engagement                     │
│  ┌─────┬─────┬─────┬─────┬─────┐       │
│  │ 😞  │ 🙁  │ 😐  │ 🙂  │ 😁  │       │
│  │     │     │     │  ●  │     │       │
│  └─────┴─────┴─────┴─────┴─────┘       │
│                                         │
│  📝 Overall Feedback                    │
│  ┌─────────────────────────────────────┐│
│  │ Strong candidate with good clinical ││
│  │ acumen. Ready for practice.         ││
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘

Legend:
  I = Independent (5)
  S = Supervised (4)  
  A = Assisted (3)
  M = Marginal/Dependent (2)
  N = Not Observed (1)
  * = Mandatory outcome
  TM = Team Member
  TL = Team Leader
```

### 6.4 Quick Pass Interaction

When assessor taps "✓ PASS" button on a component:
1. All **mandatory** outcomes set to "Independent" (5)
2. Optional outcomes remain unchanged (can be Not Observed)
3. Visual confirmation with brief animation
4. Can be undone by manually changing any score

---

## 7. Integration Specifications

### 7.1 SharePoint API Integration

**Purpose:** Retrieve course details and participant lists

**Endpoint Pattern:**
```
GET /sites/{siteId}/lists/{listId}/items
  ?$filter=CourseDate eq '{date}'
  &$expand=fields
```

**Expected Response Structure:**
```json
{
  "value": [
    {
      "fields": {
        "CourseId": "REDI-2026-001",
        "CourseName": "REdI Full Course",
        "CourseDate": "2026-01-25",
        "CourseType": "Full Course",
        "Coordinator": "Dr Sarah Smith",
        "Participants": [
          {
            "Name": "Jane Smith",
            "PayrollNumber": "12345",
            "Designation": "RN",
            "WorkArea": "Ward 4B"
          }
        ]
      }
    }
  ]
}
```

**Authentication:** OAuth 2.0 with Azure AD (client credentials flow for backend)

**Edge Function Implementation:**
```typescript
// supabase/functions/sharepoint-sync/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Client } from 'https://esm.sh/@microsoft/microsoft-graph-client'

serve(async (req) => {
  const { courseDate } = await req.json()
  
  // Get access token (cached)
  const token = await getSharePointToken()
  
  // Fetch from SharePoint
  const client = Client.init({ authProvider: (done) => done(null, token) })
  const result = await client
    .api(`/sites/${SITE_ID}/lists/${LIST_ID}/items`)
    .filter(`fields/CourseDate eq '${courseDate}'`)
    .expand('fields')
    .get()
  
  // Transform and return
  return new Response(JSON.stringify(transformResponse(result)))
})
```

---

## 8. Implementation Plan

### 8.1 Phase Overview

| Phase | Duration | Focus | Deliverables |
|-------|----------|-------|--------------|
| 1 | 2 weeks | Foundation | DB schema, auth, basic CRUD |
| 2 | 2 weeks | Assessment Entry | Bondy selector, outcomes, feedback |
| 3 | 1 week | Real-time Sync | Supabase realtime, conflict handling |
| 4 | 2 weeks | Dashboard | Grid view, live updates, feedback panel |
| 5 | 1 week | SharePoint Integration | API connection, data sync |
| 6 | 1 week | Polish & Deploy | Offline support, testing, deployment |

### 8.2 Phase 1: Foundation (Weeks 1-2)

**Objective:** Establish core infrastructure and data layer

**Tasks:**
- [x] Set up Supabase project (or self-hosted Postgres)
- [x] Implement database schema with migrations
- [x] Seed REdI course template with all components and outcomes
- [x] Create React project with Vite + TypeScript
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Implement simple PIN authentication
- [ ] Create assessor management (add/edit/deactivate)
- [x] Build course listing page
- [x] Implement participant listing for a course

**Exit Criteria:**
- Can log in with PIN
- Can view courses and participants
- Database fully seeded with REdI template

### 8.3 Phase 2: Assessment Entry (Weeks 3-4)

**Objective:** Build the core assessment data entry interface

**Tasks:**
- [ ] Create AssessmentPanel layout (mobile-first)
- [ ] Build ComponentTabs navigation
- [ ] Implement BondySelector component (5-point scale)
- [ ] Add binary pass/fail toggle for binary outcomes
- [ ] Display outcome applicability badges (TL/TM)
- [ ] Implement mandatory outcome highlighting
- [ ] Build QuickPassButton with "Independent" auto-fill
- [ ] Create FeedbackInput (expandable textarea)
- [ ] Implement EngagementSelector (emoji scale)
- [ ] Add overall feedback section
- [ ] Implement auto-save on change (debounced)
- [ ] Add visual save confirmation

**Exit Criteria:**
- Can fully assess one participant across all components
- Data persists to database
- Mobile interface fully functional

### 8.4 Phase 3: Real-Time Sync (Week 5)

**Objective:** Enable concurrent multi-assessor access

**Tasks:**
- [ ] Configure Supabase Realtime subscriptions
- [ ] Create useRealtime hook for assessment updates
- [ ] Implement optimistic UI updates
- [ ] Add "being edited" indicator (presence)
- [ ] Handle last-write-wins conflict resolution
- [ ] Add assessor attribution to changes
- [ ] Create sync status indicator (connected/reconnecting/offline)
- [ ] Test with multiple simultaneous devices

**Exit Criteria:**
- Two assessors can edit different participants simultaneously
- Changes propagate to other devices within 3 seconds
- Sync status clearly visible

### 8.5 Phase 4: Dashboard (Weeks 6-7)

**Objective:** Build real-time overview of all participants

**Tasks:**
- [ ] Create DashboardGrid component
- [ ] Implement ParticipantRow with status indicators
- [ ] Build ComponentCell with progress visualisation
- [ ] Add colour coding (not started/in progress/complete/issues)
- [ ] Display engagement emoji per participant
- [ ] Create FeedbackPanel with aggregated feedback
- [ ] Implement click-to-expand component details
- [ ] Add real-time subscription for dashboard updates
- [ ] Build StatsBar with summary statistics
- [ ] Add filter/sort controls
- [ ] Implement print-friendly view (CSS)

**Exit Criteria:**
- Dashboard shows all participants with live status
- Updates appear within 5 seconds of entry
- All feedback visible and attributed

### 8.6 Phase 5: SharePoint Integration (Week 8)

**Objective:** Connect to SharePoint for course/participant data

**Tasks:**
- [ ] Register Azure AD application for API access
- [ ] Create SharePoint sync Edge Function
- [ ] Implement OAuth token management (refresh)
- [ ] Build course import flow
- [ ] Add participant sync (create/update)
- [ ] Handle missing participants (manual add)
- [ ] Add sync status and error handling
- [ ] Create manual refresh trigger

**Exit Criteria:**
- Can fetch today's course from SharePoint
- Participants auto-populated
- Graceful handling of API failures

### 8.7 Phase 6: Polish & Deploy (Week 9)

**Objective:** Production readiness

**Tasks:**
- [ ] Implement service worker for offline support
- [ ] Create IndexedDB queue for offline changes
- [ ] Add offline indicator and queue display
- [ ] Implement automatic sync on reconnection
- [ ] Write end-to-end tests (Playwright)
- [ ] Performance testing with 30 participants
- [ ] Security review (HTTPS, PIN hashing, CORS)
- [ ] Create deployment configuration (Vercel/Docker)
- [ ] Set up production Supabase instance
- [ ] Deploy and smoke test
- [ ] Create user documentation

**Exit Criteria:**
- Works offline with queued sync
- Deployed to production URL
- Documentation complete

---

## 9. Task Backlog

### 9.1 GitHub Issues Format

Below are detailed issue specifications ready for GitHub:

---

#### ISSUE: [INFRA-001] Set up Supabase project and database schema

**Labels:** infrastructure, database, phase-1  
**Priority:** High  
**Estimate:** 4 hours

**Description:**
Create the Supabase project and implement the complete database schema for the assessment system.

**Acceptance Criteria:**
- [ ] Supabase project created with appropriate region
- [ ] All tables created per schema in Section 5.3
- [ ] Foreign key relationships established
- [ ] Indexes created for performance
- [ ] Row Level Security policies configured (basic)
- [ ] Database types exported for TypeScript

**Technical Notes:**
- Use Supabase migrations for version control
- Enable Realtime for: component_assessments, outcome_scores, overall_assessments
- Consider enabling pg_cron for cleanup jobs later

---

#### ISSUE: [INFRA-002] Seed REdI course template

**Labels:** database, data, phase-1  
**Priority:** High  
**Estimate:** 2 hours

**Description:**
Create seed data for the REdI course template including all components and outcomes as documented in Section 2.3.

**Acceptance Criteria:**
- [ ] course_templates record for "REdI Multidisciplinary Resuscitation"
- [ ] 4 template_components created in correct order
- [ ] All outcomes created with correct:
  - outcome_text (exact wording from form)
  - outcome_type (all BONDY for REdI)
  - is_mandatory (all true for REdI)
  - applies_to (TEAM_MEMBER or TEAM_LEADER as per form)
- [ ] Seed script idempotent (can re-run safely)

---

#### ISSUE: [FE-001] Create React project with Vite and configure tooling

**Labels:** frontend, infrastructure, phase-1  
**Priority:** High  
**Estimate:** 2 hours

**Description:**
Bootstrap the frontend application with all required tooling.

**Acceptance Criteria:**
- [ ] Vite + React 18 + TypeScript project created
- [ ] Tailwind CSS configured
- [ ] shadcn/ui initialised with required components
- [ ] ESLint + Prettier configured
- [ ] Supabase JS client installed and initialised
- [ ] Zustand installed
- [ ] Basic folder structure per Section 5.5
- [ ] Environment variables configured (.env.example)

---

#### ISSUE: [AUTH-001] Implement PIN-based authentication

**Labels:** frontend, backend, auth, phase-1  
**Priority:** High  
**Estimate:** 4 hours

**Description:**
Create simple PIN-based authentication for assessors.

**Acceptance Criteria:**
- [ ] Login form with name selection and 4-digit PIN
- [ ] PIN hashed before storage (bcrypt or similar)
- [ ] Session token stored in localStorage
- [ ] Session expiry (configurable, default 12 hours)
- [ ] Logout functionality
- [ ] Protected route wrapper component
- [ ] Current assessor available via authStore

---

#### ISSUE: [FE-002] Build course selection and participant list pages

**Labels:** frontend, phase-1  
**Priority:** High  
**Estimate:** 4 hours

**Description:**
Create the course selection page and participant listing.

**Acceptance Criteria:**
- [ ] Course selection page shows available courses
- [ ] Filter by date (default: today)
- [ ] Course card shows: name, date, type, coordinator, participant count
- [ ] Clicking course navigates to participant list
- [ ] Participant list shows all participants with details
- [ ] Search/filter participants by name
- [ ] Click participant to navigate to assessment

---

#### ISSUE: [FE-003] Create BondySelector component

**Labels:** frontend, component, phase-2  
**Priority:** High  
**Estimate:** 3 hours

**Description:**
Build the 5-point Bondy scale selector component.

**Acceptance Criteria:**
- [ ] 5 selectable options: I, S, A, M, N
- [ ] Full labels shown on hover/long-press
- [ ] Touch targets minimum 44px
- [ ] Selected state clearly visible
- [ ] Keyboard accessible
- [ ] Calls onChange with numeric value (5, 4, 3, 2, 1)
- [ ] Supports disabled state
- [ ] Colour coding per competence level

**Design Notes:**
- Independent (5): Green
- Supervised (4): Light green
- Assisted (3): Yellow
- Marginal (2): Orange
- Not Observed (1): Grey

---

#### ISSUE: [FE-004] Build AssessmentPanel main component

**Labels:** frontend, component, phase-2  
**Priority:** High  
**Estimate:** 6 hours

**Description:**
Create the main assessment entry panel for a single participant.

**Acceptance Criteria:**
- [ ] Header shows participant name, designation, payroll
- [ ] ComponentTabs for navigating between components
- [ ] Lists all outcomes for selected component
- [ ] OutcomeRow shows: role badge, outcome text, mandatory indicator, BondySelector
- [ ] Outcomes grouped by role (TM first, then TL)
- [ ] FeedbackInput at bottom of component section
- [ ] Auto-save indicator (saving/saved/error)
- [ ] Mobile responsive layout
- [ ] Swipe navigation between components (mobile)

---

#### ISSUE: [FE-005] Implement QuickPassButton

**Labels:** frontend, component, phase-2  
**Priority:** Medium  
**Estimate:** 2 hours

**Description:**
Create the Quick Pass button that sets all mandatory outcomes to Independent.

**Acceptance Criteria:**
- [ ] Button labeled "✓ PASS" or similar
- [ ] Located prominently in component header
- [ ] On click: sets all mandatory outcomes to Independent (5)
- [ ] Does not modify optional outcomes
- [ ] Visual feedback (animation/flash)
- [ ] Confirmation not required (easily undone)
- [ ] Disabled if component already passed

---

#### ISSUE: [FE-006] Create EngagementSelector component

**Labels:** frontend, component, phase-2  
**Priority:** Medium  
**Estimate:** 2 hours

**Description:**
Build the 5-point emoji engagement scale selector.

**Acceptance Criteria:**
- [ ] 5 emoji options: 😞 🙁 😐 🙂 😁
- [ ] Large touch targets
- [ ] Selected state highlighted
- [ ] Value mapped to 1-5
- [ ] Positioned in overall assessment section

---

#### ISSUE: [FE-007] Implement auto-save functionality

**Labels:** frontend, data, phase-2  
**Priority:** High  
**Estimate:** 3 hours

**Description:**
Implement automatic saving of assessment data on every change.

**Acceptance Criteria:**
- [ ] Debounce saves (300ms)
- [ ] Batch related changes in single transaction
- [ ] Visual indicator: "Saving..." → "Saved ✓" → fades
- [ ] Error state with retry option
- [ ] Optimistic UI updates (immediate feedback)
- [ ] Conflict handling (see SYNC tasks)

---

#### ISSUE: [SYNC-001] Configure Supabase Realtime subscriptions

**Labels:** backend, realtime, phase-3  
**Priority:** High  
**Estimate:** 4 hours

**Description:**
Set up real-time subscriptions for assessment data.

**Acceptance Criteria:**
- [ ] Enable Realtime on relevant tables
- [ ] Create useRealtime hook
- [ ] Subscribe to changes for current course's participants
- [ ] Update local state on remote changes
- [ ] Handle subscription errors gracefully
- [ ] Reconnection logic on disconnect
- [ ] Unsubscribe on component unmount

---

#### ISSUE: [SYNC-002] Implement presence indicators

**Labels:** frontend, realtime, phase-3  
**Priority:** Medium  
**Estimate:** 3 hours

**Description:**
Show when another assessor is viewing/editing a participant.

**Acceptance Criteria:**
- [ ] Use Supabase Presence
- [ ] Show indicator on participant row when being edited
- [ ] Show assessor name on hover
- [ ] Update in real-time
- [ ] Handle multiple assessors on same participant

---

#### ISSUE: [DASH-001] Build DashboardGrid component

**Labels:** frontend, dashboard, phase-4  
**Priority:** High  
**Estimate:** 6 hours

**Description:**
Create the main dashboard grid showing all participants and their progress.

**Acceptance Criteria:**
- [ ] Grid layout: participants as rows, components as columns
- [ ] Participant column shows: name, designation, payroll, work area
- [ ] Component cells show progress indicator
- [ ] Colour coding per status (not started/in progress/complete/issues)
- [ ] Engagement emoji column
- [ ] Overall status column (pass checkmark)
- [ ] Click row to open assessment panel
- [ ] Click cell to show component detail popover
- [ ] Sticky header row on scroll
- [ ] Responsive design (horizontal scroll on mobile)

---

#### ISSUE: [DASH-002] Create FeedbackPanel component

**Labels:** frontend, dashboard, phase-4  
**Priority:** Medium  
**Estimate:** 3 hours

**Description:**
Build the aggregated feedback display panel.

**Acceptance Criteria:**
- [ ] Expandable/collapsible panel
- [ ] Groups feedback by participant
- [ ] Shows component name for each feedback item
- [ ] Displays assessor name and timestamp
- [ ] Real-time updates when new feedback added
- [ ] Search/filter functionality
- [ ] Copy to clipboard option

---

#### ISSUE: [DASH-003] Implement dashboard auto-refresh

**Labels:** frontend, realtime, phase-4  
**Priority:** High  
**Estimate:** 2 hours

**Description:**
Ensure dashboard updates automatically when data changes.

**Acceptance Criteria:**
- [ ] Subscribe to all relevant tables
- [ ] Update UI within 5 seconds of change
- [ ] Show "Last updated" timestamp
- [ ] Manual refresh button
- [ ] Connection status indicator

---

#### ISSUE: [API-001] Create SharePoint sync Edge Function

**Labels:** backend, integration, phase-5  
**Priority:** Medium  
**Estimate:** 6 hours

**Description:**
Build the Edge Function to fetch course data from SharePoint.

**Acceptance Criteria:**
- [ ] OAuth 2.0 client credentials flow
- [ ] Token caching and refresh
- [ ] Fetch courses by date
- [ ] Parse participant data
- [ ] Upsert to database
- [ ] Error handling and logging
- [ ] Rate limiting respect
- [ ] Manual trigger endpoint

---

#### ISSUE: [OFFLINE-001] Implement offline support

**Labels:** frontend, offline, phase-6  
**Priority:** Medium  
**Estimate:** 6 hours

**Description:**
Enable offline data entry with sync on reconnection.

**Acceptance Criteria:**
- [ ] Service worker for caching
- [ ] IndexedDB for pending changes
- [ ] Queue indicator showing pending count
- [ ] Automatic sync on reconnection
- [ ] Conflict resolution (last-write-wins)
- [ ] Clear indication of offline state
- [ ] Works after initial load (cached assets)

---

## 10. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SharePoint API rate limits | Medium | High | Implement caching, batch requests, manual fallback |
| Concurrent edit conflicts | Medium | Medium | Last-write-wins with audit trail, presence indicators |
| Network connectivity during assessments | High | High | Offline queue with background sync |
| Mobile browser compatibility | Low | Medium | Test on common devices, progressive enhancement |
| Supabase Realtime limits | Low | Medium | Monitor usage, fallback to polling if needed |
| Assessor adoption resistance | Medium | Medium | Intuitive UI, quick-pass feature, training |

---

## 11. Glossary

| Term | Definition |
|------|------------|
| Bondy Scale | 5-point competency rating scale: Independent, Supervised, Assisted, Marginal/Dependent, Not Observed |
| Component | A major section of the assessment (e.g., Airway Management) |
| Outcome | A specific skill or behaviour to be assessed within a component |
| Quick Pass | Feature to mark all mandatory outcomes as Independent with one click |
| REdI | Resuscitation Education Initiative - the course type used as primary example |
| Team Leader | Assessment role focusing on leadership and coordination skills |
| Team Member | Assessment role focusing on clinical/technical skills |

---

## 12. Appendices

### Appendix A: Original Form Structure

The REdI Multidisciplinary Assessment Form v2 contains:
- 4 Skill Station components
- 6-10 outcomes per component
- Bondy scale (5-point) for all outcomes
- Separate Team Leader and Team Member outcome sets
- Free-text feedback section
- Outcome summary with recommended actions

### Appendix B: Future Enhancements

1. **SSO Integration** - Queensland Health identity provider
2. **PDF Export** - Generate completed forms matching paper format
3. **Analytics Dashboard** - Trends, common failure points, assessor calibration
4. **Multi-course Templates** - Support other course types beyond REdI
5. **Video Annotation** - Link assessment scores to recorded scenarios
6. **LMS Integration** - Push results to Moodle or similar

---

*Document generated: January 2026*  
*Next review: After Phase 2 completion*
