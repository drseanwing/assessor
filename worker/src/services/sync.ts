import { query } from "../db.js";
import {
  fetchAvailableEvents,
  lookupParticipant,
  type RediEvent,
  type RediParticipant,
} from "./redi-api.js";

let lastSyncTime: Date | null = null;
let lastSyncStatus: "idle" | "running" | "success" | "error" = "idle";
let lastSyncError: string | null = null;

export function getSyncStatus() {
  return {
    lastSyncTime: lastSyncTime?.toISOString() ?? null,
    status: lastSyncStatus,
    error: lastSyncError,
  };
}

function parseRediDate(dateStr: string): string {
  const parts = dateStr.match(/^(\d{1,2})-(\w{3})-(\d{4})$/);
  if (!parts) {
    throw new Error(`Cannot parse REdI date: ${dateStr}`);
  }
  const [, day, monthStr, year] = parts;
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const month = months[monthStr];
  if (!month) {
    throw new Error(`Unknown month abbreviation: ${monthStr}`);
  }
  return `${year}-${month}-${day!.padStart(2, "0")}`;
}

function mapCourseType(rediType: string): string {
  const normalized = rediType.toLowerCase().trim();
  if (normalized.includes("refresher")) return "REFRESHER";
  if (normalized.includes("assessment")) return "ASSESSMENT_ONLY";
  return "FULL_COURSE";
}

function determineAssessmentRole(stream: string, level: string): string {
  const s = stream.toLowerCase();
  const l = level.toLowerCase();
  if (
    s.includes("medical") &&
    (l.includes("consultant") || l.includes("senior"))
  ) {
    return "TEAM_LEADER";
  }
  if (l.includes("registrar") || l.includes("resident")) {
    return "BOTH";
  }
  return "TEAM_MEMBER";
}

async function findOrCreateTemplate(
  courseTitle: string,
  courseType: string
): Promise<string> {
  const existing = await query<{ template_id: string }>(
    `SELECT template_id FROM course_templates
     WHERE template_name = $1 AND course_type = $2::course_type`,
    [courseTitle, mapCourseType(courseType)]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0]!.template_id;
  }

  const inserted = await query<{ template_id: string }>(
    `INSERT INTO course_templates (template_name, course_type, description)
     VALUES ($1, $2::course_type, $3)
     RETURNING template_id`,
    [courseTitle, mapCourseType(courseType), `Auto-created from REdI sync`]
  );

  console.log(`Created new course template: ${courseTitle}`);
  return inserted.rows[0]!.template_id;
}

export async function syncCoursesFromRedi(): Promise<{
  synced: number;
  errors: string[];
}> {
  console.log("Starting course sync from REdI API");
  const events = await fetchAvailableEvents();
  let synced = 0;
  const errors: string[] = [];

  for (const event of events) {
    try {
      await syncSingleCourse(event);
      synced++;
    } catch (err) {
      const msg = `Failed to sync event ${event.eventId}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  console.log(`Course sync complete: ${synced} synced, ${errors.length} errors`);
  return { synced, errors };
}

async function syncSingleCourse(event: RediEvent): Promise<void> {
  const templateId = await findOrCreateTemplate(
    event.courseTitle,
    event.courseType
  );
  const courseDate = parseRediDate(event.courseDate);

  await query(
    `INSERT INTO courses (template_id, course_name, course_date, course_coordinator, redi_event_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (redi_event_id) DO UPDATE SET
       course_name = EXCLUDED.course_name,
       course_date = EXCLUDED.course_date,
       course_coordinator = EXCLUDED.course_coordinator,
       updated_at = NOW()`,
    [templateId, event.courseTitle, courseDate, event.courseVenue, event.eventId]
  );
}

export async function syncParticipantsForCourse(
  courseId: string,
  rediEventId: number
): Promise<{ synced: number; errors: string[] }> {
  console.log(
    `Syncing participants for course ${courseId} (REdI event ${rediEventId})`
  );

  const courseRow = await query<{ course_id: string }>(
    `SELECT course_id FROM courses WHERE course_id = $1`,
    [courseId]
  );
  if (courseRow.rows.length === 0) {
    throw new Error(`Course not found: ${courseId}`);
  }

  const events = await fetchAvailableEvents();
  const event = events.find((e) => e.eventId === rediEventId);
  if (!event) {
    throw new Error(`REdI event not found: ${rediEventId}`);
  }

  let synced = 0;
  const errors: string[] = [];

  const participantEmails = await getParticipantEmailsForEvent(rediEventId);

  for (const email of participantEmails) {
    try {
      const participants = await lookupParticipant(email);
      const eventParticipants = participants.filter(
        (p) => p.eventId === rediEventId
      );

      for (const p of eventParticipants) {
        await upsertLocalParticipant(courseId, p);
        synced++;
      }
    } catch (err) {
      const msg = `Failed to sync participant ${email}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  console.log(
    `Participant sync complete: ${synced} synced, ${errors.length} errors`
  );
  return { synced, errors };
}

async function getParticipantEmailsForEvent(
  _rediEventId: number
): Promise<string[]> {
  const events = await fetchAvailableEvents();
  const emails: string[] = [];

  for (const event of events) {
    try {
      const participants = await lookupParticipant(event.courseVenue);
      for (const p of participants) {
        if (p.eventId === _rediEventId && !emails.includes(p.mail)) {
          emails.push(p.mail);
        }
      }
    } catch {
      // skip
    }
  }

  return emails;
}

async function upsertLocalParticipant(
  courseId: string,
  p: RediParticipant
): Promise<void> {
  const candidateName = `${p.givenName} ${p.surname}`;
  const role = determineAssessmentRole(p.stream, p.level);

  await query(
    `INSERT INTO participants (
       course_id, candidate_name, payroll_number, designation,
       work_area, assessment_role, redi_participant_id
     ) VALUES ($1, $2, $3, $4, $5, $6::assessment_role, $7)
     ON CONFLICT (redi_participant_id) DO UPDATE SET
       candidate_name = EXCLUDED.candidate_name,
       payroll_number = EXCLUDED.payroll_number,
       designation = EXCLUDED.designation,
       work_area = EXCLUDED.work_area,
       assessment_role = EXCLUDED.assessment_role,
       updated_at = NOW()`,
    [
      courseId,
      candidateName,
      p.qhPayroll,
      p.level,
      p.workArea,
      role,
      p.id,
    ]
  );
}

export async function syncAll(): Promise<{
  courses: { synced: number; errors: string[] };
  participants: { synced: number; errors: string[] };
}> {
  lastSyncStatus = "running";
  lastSyncError = null;

  try {
    const courseResult = await syncCoursesFromRedi();

    const activeCourses = await query<{
      course_id: string;
      redi_event_id: number;
    }>(
      `SELECT course_id, redi_event_id FROM courses
       WHERE redi_event_id IS NOT NULL
         AND course_date >= CURRENT_DATE - INTERVAL '7 days'
         AND course_date <= CURRENT_DATE + INTERVAL '120 days'`
    );

    let totalParticipantsSynced = 0;
    const participantErrors: string[] = [];

    for (const course of activeCourses.rows) {
      try {
        const result = await syncParticipantsForCourse(
          course.course_id,
          course.redi_event_id
        );
        totalParticipantsSynced += result.synced;
        participantErrors.push(...result.errors);
      } catch (err) {
        const msg = `Failed to sync participants for course ${course.course_id}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(msg);
        participantErrors.push(msg);
      }
    }

    lastSyncTime = new Date();
    lastSyncStatus = "success";

    return {
      courses: courseResult,
      participants: {
        synced: totalParticipantsSynced,
        errors: participantErrors,
      },
    };
  } catch (err) {
    lastSyncStatus = "error";
    lastSyncError =
      err instanceof Error ? err.message : String(err);
    throw err;
  }
}
