function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  databaseUrl: required("DATABASE_URL"),
  port: parseInt(optional("PORT", "5000"), 10),
  jwtSecret: required("JWT_SECRET"),

  redi: {
    participantLookupUrl: optional("REDI_PARTICIPANT_LOOKUP_URL", ""),
    eventAvailabilityUrl: optional("REDI_EVENT_AVAILABILITY_URL", ""),
    facultyAvailabilityUrl: optional("REDI_FACULTY_AVAILABILITY_URL", ""),
    participantUpsertUrl: optional("REDI_PARTICIPANT_UPSERT_URL", ""),
    eventUpsertUrl: optional("REDI_EVENT_UPSERT_URL", ""),
    sendEmailUrl: optional("REDI_SEND_EMAIL_URL", ""),
    calendarEventUrl: optional("REDI_CALENDAR_EVENT_URL", ""),
    emailCertificateUrl: optional("REDI_EMAIL_CERTIFICATE_URL", ""),
  },

  reportEmailTo: optional("REPORT_EMAIL_TO", "redi@health.qld.gov.au"),
  syncCron: optional("SYNC_CRON", "0 6 * * *"),
  reportCron: optional("REPORT_CRON", "0 18 * * 1-5"),
  reportDir: optional("REPORT_DIR", "/app/data/reports"),
};
