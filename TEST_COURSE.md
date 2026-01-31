# Test Course - January 31, 2026

## Course Details

**Course Name:** REdI Course - January 31, 2026
**Course ID:** `34f4acf3-b45d-48c3-b513-0c6a6cd3ff93`
**Date:** January 31, 2026 (Today)
**Coordinator:** Dr. Sarah Chen
**Template:** REdI Multidisciplinary Resuscitation
**REdI Event ID:** 1001
**Total Participants:** 5

---

## Participants

### 1. Dr. James Anderson
- **ID:** `3513a87e-47a7-49cb-a5a0-95bc925f5094`
- **Payroll:** PAY001234
- **Designation:** Emergency Physician
- **Work Area:** Royal Brisbane Hospital - Emergency
- **Assessment Role:** BOTH (Team Leader & Team Member)
- **Engagement Rating:** 5/5

### 2. Nurse Lisa Martinez
- **ID:** `7207812d-c100-4595-8e27-efdf1fc3d7b8`
- **Payroll:** PAY002345
- **Designation:** ICU Nurse
- **Work Area:** Princess Alexandra Hospital - ICU
- **Assessment Role:** TEAM_MEMBER
- **Engagement Rating:** 4/5

### 3. Paramedic Tom Wilson
- **ID:** `45cd9053-e2de-4a3f-bbdb-481c2051679d`
- **Payroll:** PAY003456
- **Designation:** Advanced Care Paramedic
- **Work Area:** QAS Metro North
- **Assessment Role:** BOTH (Team Leader & Team Member)
- **Engagement Rating:** 5/5

### 4. Dr. Priya Patel
- **ID:** `63a4c8ab-8bf6-43e4-ac9e-45a427125fe4`
- **Payroll:** PAY004567
- **Designation:** Anaesthetist
- **Work Area:** Gold Coast University Hospital - Anaesthesia
- **Assessment Role:** TEAM_LEADER
- **Engagement Rating:** 4/5

### 5. Nurse David Kim
- **ID:** `4419d048-a54a-446d-96f8-ace46dcd71f1`
- **Payroll:** PAY005678
- **Designation:** Emergency Nurse
- **Work Area:** Royal Brisbane Hospital - Emergency
- **Assessment Role:** TEAM_MEMBER
- **Engagement Rating:** 5/5

---

## How to Access the Course

1. **Login to the application:** [http://localhost:8080](http://localhost:8080)
   - Select any assessor (Dr. Sarah Chen, Dr. Michael O'Connor, or Nurse Emma Wilson)
   - Enter PIN: `1234`

2. **Navigate to the course:**
   - After login, you'll see the course list page
   - Click on "REdI Course - January 31, 2026"
   - You'll see all 5 participants listed

3. **Start an assessment:**
   - Click on any participant's name
   - You'll be taken to the assessment page
   - Multiple assessors can assess the same participant simultaneously
   - Real-time sync via WebSocket will show all assessors' scores

---

## Testing Scenarios

### Single Assessor Testing
1. Login as Dr. Sarah Chen
2. Open a participant (e.g., Dr. James Anderson)
3. Complete assessment in both Team Leader and Team Member roles
4. Verify auto-save functionality (watch SaveIndicator)
5. Navigate away and back to verify data persistence

### Multi-Assessor Testing (Real-time Sync)
1. **Browser 1:** Login as Dr. Sarah Chen
2. **Browser 2:** Login as Dr. Michael O'Connor (in incognito/different browser)
3. Both open the same participant (e.g., Nurse Lisa Martinez)
4. Make changes in Browser 1 → see updates in Browser 2 in real-time
5. Make changes in Browser 2 → see updates in Browser 1 in real-time
6. Verify WebSocket connection status

### Error Handling Testing
1. Stop the worker container: `docker stop redi-assessment-worker-1`
2. Try to save changes → should see error message
3. Restart worker: `docker start redi-assessment-worker-1`
4. Verify auto-reconnection and save retry

### Accessibility Testing
1. Test keyboard navigation (Tab, Shift+Tab, Enter, Space)
2. Test with screen reader (NVDA on Windows, VoiceOver on Mac)
3. Verify skip link (press Tab on page load)
4. Test form validation announcements
5. Test loading state announcements

---

## Course Template Structure

The course uses the **REdI Multidisciplinary Resuscitation** template which includes:

### Team Leader Components
1. **ANZCOR Guidelines**: Situational Awareness / Leadership
2. **Call for Help**: Recognition of cardiac arrest / Call for help
3. **Airway Management**: Opens airway / Suctions if required
4. **Oxygen Delivery**: Ensures oxygen delivery / Appropriate device
5. **Ventilation Initiation**: Ventilation initiated in timely manner
6. **Ventilation Coordination**: Coordination of ventilations with compressions
7. **Breathing Assessment**: Assesses breathing / Depth / Rate / SPO2
8. **Circulation Assessment**: Assesses circulation / Capillary refill / Pulses
9. **Vascular Access**: Obtains vascular access / IO / IV
10. **Adrenaline Administration**: Adrenaline administered appropriately
11. **Fluid Administration**: Fluid administered appropriately
12. **Reversible Causes**: Considers and treats reversible causes (4Hs 4Ts)
13. **Documentation**: Appropriate documentation
14. **Debriefing**: Post event debrief / Hot debrief

### Team Member Components
1. **ANZCOR Guidelines**: Situational Awareness / Teamwork
2. **Safety Check**: Safety check performed / Hazards identified
3. **Responsiveness Check**: Checks for responsiveness
4. **Help Call**: Calls for help
5. **CPR Initiation**: Initiates CPR / Depth / Rate / Recoil
6. **Defibrillator**: Defibrillator use / Minimal interruptions
7. **Airway Adjuncts**: Airway adjuncts used appropriately
8. **Suction**: Suction used appropriately
9. **Bag-Mask Ventilation**: Bag-mask / Seal / Volume / Minimal interruptions
10. **Closed Loop Communication**: Closed loop communication
11. **Role Assignment**: Understands and performs assigned role
12. **Team Support**: Supports team / Assists as needed

### Overall Assessment
- **Team Leader Overall Performance** (1-5 scale)
- **Team Member Overall Performance** (1-5 scale)
- Written feedback field for both roles

---

## Database Access (For Debugging)

```bash
# Connect to database
docker compose exec db psql -U redi_admin -d redi_assessment

# View all participants in this course
SELECT participant_id, candidate_name, designation, assessment_role
FROM participants
WHERE course_id = '34f4acf3-b45d-48c3-b513-0c6a6cd3ff93';

# Check assessments for a participant
SELECT * FROM component_assessments
WHERE participant_id = '3513a87e-47a7-49cb-a5a0-95bc925f5094';

# View real-time assessment activity
SELECT * FROM overall_assessments
WHERE participant_id = '3513a87e-47a7-49cb-a5a0-95bc925f5094';
```

---

## Next Steps

1. ✅ Test course created with 5 participants
2. 🔄 **Begin User Acceptance Testing**
   - Test login functionality
   - Navigate course list
   - Open participant assessments
   - Complete full assessment workflow
   - Test multi-assessor real-time sync
3. 📋 Document any issues or bugs found
4. 📋 Validate accessibility features
5. 📋 Test on different browsers/devices

**Ready to test!** Open [http://localhost:8080](http://localhost:8080) and login with PIN `1234`.
