# Assessment Logic Changes - Implementation Summary

**Date:** 2026-01-31
**Status:** ✅ COMPLETE

## Overview

Implemented new business rules for assessment pass/fail logic and created a comprehensive feedback report system for end-of-day 1:1 sessions with participants.

---

## Business Rules Implemented

### 1. Team Leader Pass Criteria (CRITICAL CHANGE)

**Previous Logic:** Team Leader pass was evaluated independently

**New Logic:** To pass as Team Leader, a participant must:
- ✅ Pass ALL Team Leader components, **AND**
- ✅ Pass ALL Team Member components

**Rationale:** Team Leaders must demonstrate competency in both leadership and team member skills.

### 2. Pass/Fail Determination Timing

**Previous Logic:** Pass/fail shown as soon as any assessment made

**New Logic:** Overall pass/fail status **only shown when ALL applicable components are assessed**

**Implementation:** View returns `NULL` for pass/fail fields until `all_components_assessed = true`

### 3. Feedback Report System

**New Feature:** Comprehensive feedback report page designed for:
- End-of-day 1:1 feedback sessions
- Print-friendly format
- Consolidated view of all assessment data

---

## Database Changes

### New Database Objects Created

**File:** [db/migrations/03-assessment-logic-views.sql](db/migrations/03-assessment-logic-views.sql)

#### 1. View: `participant_assessment_summary`

Calculates real-time assessment status for each participant:

**Columns:**
- `participant_id` - Participant identifier
- `candidate_name` - Participant name
- `assessment_role` - TEAM_LEADER | TEAM_MEMBER | BOTH
- `course_id`, `course_name` - Course information
- `total_components` - Total components applicable to this participant
- `assessed_components` - Number of components assessed so far
- `all_components_assessed` - Boolean: true when 100% complete
- `completion_percentage` - Progress percentage
- `total_team_member_components` - Count of TM components
- `assessed_team_member_components` - Count of assessed TM components
- `passed_team_member_components` - Count of passed TM components
- `team_member_pass` - Boolean: true/false/NULL (NULL if incomplete)
- `total_team_leader_components` - Count of TL components
- `assessed_team_leader_components` - Count of assessed TL components
- `passed_team_leader_components` - Count of passed TL components
- `team_leader_pass` - Boolean: true/false/NULL (NULL if incomplete)
- `calculated_overall_outcome` - PASS | UNSUCCESSFUL_ATTEMPT | NULL

**Key Logic:**

```sql
-- Team Member pass: All TM components passed
team_member_pass =
  CASE
    WHEN assessed_team_member_components < total_team_member_components THEN NULL
    WHEN passed_team_member_components = total_team_member_components THEN true
    ELSE false
  END

-- Team Leader pass: ALL TL components AND ALL TM components passed
team_leader_pass =
  CASE
    WHEN assessed_team_leader_components < total_team_leader_components THEN NULL
    WHEN assessed_team_member_components < total_team_member_components THEN NULL
    WHEN passed_team_leader_components = total_team_leader_components
         AND passed_team_member_components = total_team_member_components THEN true
    ELSE false
  END
```

**Permissions:**
```sql
GRANT SELECT ON participant_assessment_summary TO web_anon;
GRANT SELECT ON participant_assessment_summary TO redi_worker;
```

#### 2. Function: `get_participant_feedback(p_participant_id UUID)`

Returns comprehensive feedback data for a single participant.

**Returns:**
- All fields from `participant_assessment_summary`
- `component_feedback` - JSONB array of all component assessments with:
  - component_name
  - component_order
  - is_passed
  - feedback text
  - applies_to (TEAM_LEADER | TEAM_MEMBER | BOTH)
- `overall_feedback` - Overall written feedback
- `engagement_score` - 1-5 rating
- `recommended_action` - Follow-up recommendation

**Usage:**
```sql
SELECT * FROM get_participant_feedback('participant-uuid-here');
```

**Permissions:**
```sql
GRANT EXECUTE ON FUNCTION get_participant_feedback(UUID) TO web_anon;
GRANT EXECUTE ON FUNCTION get_participant_feedback(UUID) TO redi_worker;
```

---

## Frontend Changes

### 1. New Page: Participant Feedback Report

**File:** [frontend/src/pages/ParticipantFeedbackPage.tsx](frontend/src/pages/ParticipantFeedbackPage.tsx)

**Features:**
- **Participant Information Section**
  - Candidate name
  - Assessment role
  - Engagement score
  - Completion status (percentage)

- **Overall Outcome Section** (only shown when all components assessed)
  - Team Member pass/fail with color coding (green/red)
  - Team Leader pass/fail with color coding (green/red)
  - Note: "Requires passing both Team Leader and Team Member components"
  - Recommended action (if set)

- **Incomplete Warning** (when not all components assessed)
  - Amber alert box explaining pass/fail determination will be available once all components are assessed

- **Component Results**
  - Separate sections for Team Leader and Team Member components
  - Each component shows:
    - Component name
    - Pass/Not Passed badge
    - Written feedback (if provided)
  - Color-coded borders (teal for TL, coral for TM)

- **Overall Feedback Section**
  - Displays overall written feedback if provided

- **Print-Optimized**
  - Print button in header (hidden on print)
  - Professional print header with QLD Health branding
  - Clean borders and spacing for printed output
  - Footer with official statement
  - Break-inside-avoid for sections

**Route:** `/participant/:participantId/feedback`

**Example URL:** `http://localhost:8080/participant/3513a87e-47a7-49cb-a5a0-95bc925f5094/feedback`

### 2. Updated: App.tsx

**Changes:**
- Added lazy import for `ParticipantFeedbackPage`
- Added protected route: `/participant/:participantId/feedback`

### 3. Updated: ParticipantListPage.tsx

**Changes:**
- Added "Feedback" button next to "Assess →" button in action column
- Button navigates to `/participant/:participantId/feedback`
- Color: redi-teal to distinguish from assessment button

---

## How It Works

### Scenario 1: Participant with Role "TEAM_MEMBER"

**Applicable Components:** Only Team Member components

**Pass Criteria:**
- Must pass all Team Member components
- Team Leader components are not assessed

**Example:**
- Total components: 12 (Team Member only)
- Assessed: 12
- Passed: 12
- **Result:** PASS ✅

### Scenario 2: Participant with Role "TEAM_LEADER"

**Applicable Components:** Both Team Leader AND Team Member components

**Pass Criteria:**
- Must pass ALL Team Leader components
- AND must pass ALL Team Member components

**Example:**
- Total components: 26 (14 TL + 12 TM)
- Team Leader assessed: 14, passed: 14
- Team Member assessed: 12, passed: 11
- **Result:** UNSUCCESSFUL ATTEMPT ❌ (failed 1 TM component)

### Scenario 3: Participant with Role "BOTH"

**Applicable Components:** Both Team Leader AND Team Member components

**Pass Criteria:**
- Can pass as Team Leader (requires passing both TL + TM)
- OR can pass as Team Member only (requires passing TM only)

**Example A - Pass as Team Leader:**
- Total components: 26 (14 TL + 12 TM)
- Team Leader assessed: 14, passed: 14
- Team Member assessed: 12, passed: 12
- **Result:** PASS ✅ (passed as Team Leader)

**Example B - Pass as Team Member:**
- Total components: 26 (14 TL + 12 TM)
- Team Leader assessed: 14, passed: 10
- Team Member assessed: 12, passed: 12
- **Result:** PASS ✅ (passed as Team Member, failed as Team Leader)

**Example C - Fail Both:**
- Total components: 26 (14 TL + 12 TM)
- Team Leader assessed: 14, passed: 10
- Team Member assessed: 12, passed: 10
- **Result:** UNSUCCESSFUL ATTEMPT ❌

---

## Usage Instructions

### For Assessors

1. **During Assessment:**
   - Assess participants normally through the assessment page
   - System automatically tracks completion percentage
   - Pass/fail determination is hidden until all components are assessed

2. **Viewing Feedback Report:**
   - Navigate to course participant list
   - Click "Feedback" button next to participant name
   - Review comprehensive assessment summary
   - Print report for 1:1 session

3. **End-of-Day 1:1 Sessions:**
   - Open participant feedback report
   - Click "Print Report" for hard copy
   - Review all component outcomes with participant
   - Discuss overall feedback
   - Provide recommended action if needed

### For Developers

**Query Assessment Status:**
```sql
-- Get summary for all participants in a course
SELECT * FROM participant_assessment_summary
WHERE course_id = 'course-uuid'
ORDER BY candidate_name;

-- Get detailed feedback for one participant
SELECT * FROM get_participant_feedback('participant-uuid');
```

**API Access:**
```javascript
// Get participant feedback via Supabase
const { data, error } = await supabase
  .rpc('get_participant_feedback', {
    p_participant_id: participantId
  })
```

---

## Testing Checklist

### Database Logic
- [x] View created and accessible
- [x] Function created and accessible
- [x] Permissions granted correctly
- [ ] Test with participant role TEAM_MEMBER
- [ ] Test with participant role TEAM_LEADER
- [ ] Test with participant role BOTH
- [ ] Test incomplete assessments (should return NULL for pass/fail)
- [ ] Test complete assessments with all pass
- [ ] Test complete assessments with some failures

### Frontend
- [x] Page builds successfully
- [x] Route added to React Router
- [x] Link added to participant list
- [ ] Test page loads without errors
- [ ] Test print functionality
- [ ] Test with incomplete assessment (should show warning)
- [ ] Test with complete assessment (should show outcomes)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test print layout (margins, page breaks)

### Integration
- [ ] End-to-end: Complete assessment → View feedback report
- [ ] Verify real-time updates (if assessment changes, report updates)
- [ ] Test with multiple assessors viewing same participant
- [ ] Test navigation flow (list → assess → feedback → list)

---

## Files Modified/Created

### Database
- ✅ `db/migrations/03-assessment-logic-views.sql` (NEW)

### Frontend
- ✅ `frontend/src/pages/ParticipantFeedbackPage.tsx` (NEW)
- ✅ `frontend/src/App.tsx` (MODIFIED - added route)
- ✅ `frontend/src/pages/ParticipantListPage.tsx` (MODIFIED - added feedback button)

### Build
- ✅ Frontend rebuilt with new page
- ✅ Container restarted with new image

---

## API Endpoints

### Get Participant Feedback
**Endpoint:** PostgREST RPC call
**URL:** `POST http://localhost:8080/rest/v1/rpc/get_participant_feedback`
**Body:**
```json
{
  "p_participant_id": "uuid-here"
}
```

**Response:**
```json
[{
  "participant_id": "uuid",
  "candidate_name": "Dr. James Anderson",
  "assessment_role": "BOTH",
  "course_name": "REdI Course - January 31, 2026",
  "completion_percentage": 100.0,
  "all_components_assessed": true,
  "team_member_pass": true,
  "team_leader_pass": true,
  "calculated_overall_outcome": "PASS",
  "component_feedback": [...],
  "overall_feedback": "Excellent performance...",
  "engagement_score": 5,
  "recommended_action": null
}]
```

---

## Security Considerations

1. **Row-Level Security (RLS):**
   - Current implementation allows `web_anon` to view all participant feedback
   - **TODO:** Add RLS policies to scope feedback access to:
     - Assessors assigned to the course
     - Administrators only

2. **Sensitive Data:**
   - PIN hashes and authentication data NOT exposed in feedback
   - Component feedback may contain sensitive observations
   - Print reports should be handled securely

3. **Audit Trail:**
   - Consider adding logging for feedback report access
   - Track who viewed/printed each participant's feedback

---

## Future Enhancements

### High Priority
- [ ] Add RLS policies to restrict feedback access
- [ ] Add audit logging for feedback views
- [ ] Add email/PDF export functionality
- [ ] Add filtering options (show only failed components, etc.)

### Medium Priority
- [ ] Add comparison view (compare participant to course average)
- [ ] Add progress tracking over multiple courses
- [ ] Add assessor-specific feedback sections
- [ ] Add bulk export (all participants in course)

### Low Priority
- [ ] Add charts/visualizations (pass rates, competency areas)
- [ ] Add participant self-view (with restricted access)
- [ ] Add templated feedback suggestions
- [ ] Add mobile app view optimization

---

## Known Limitations

1. **Real-time Updates:**
   - Feedback page requires manual refresh to see updated assessments
   - Consider adding WebSocket updates for live changes

2. **Print Layout:**
   - Multi-page prints may have minor formatting issues
   - Test with different browsers for print compatibility

3. **Performance:**
   - Complex JSONB aggregation in `get_participant_feedback()`
   - May be slow with large numbers of components (>100)
   - Consider caching for frequently accessed reports

4. **Mobile:**
   - Print button not functional on mobile devices
   - Consider alternative export method (PDF generation)

---

## Support & Documentation

**For Questions:**
- Review this document first
- Check database schema: `\d participant_assessment_summary`
- Check function definition: `\df get_participant_feedback`
- Review code comments in ParticipantFeedbackPage.tsx

**For Issues:**
- Check browser console for JavaScript errors
- Check database logs for SQL errors
- Verify permissions: `SELECT * FROM information_schema.role_table_grants WHERE table_name = 'participant_assessment_summary';`

---

**Implementation Complete:** 2026-01-31
**Frontend Deployed:** ✅ Container running on port 8080
**Database Migration:** ✅ Applied successfully
**Status:** Ready for testing and user acceptance
