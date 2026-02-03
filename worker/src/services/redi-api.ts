import { config } from "../config.js";

function requireUrl(url: string, name: string): void {
  if (!url) {
    throw new Error(`REdI integration not configured: ${name} is not set`);
  }
}

export function isRediSyncConfigured(): boolean {
  return !!(config.redi.eventAvailabilityUrl && config.redi.participantLookupUrl);
}

export function isRediEmailConfigured(): boolean {
  return !!config.redi.sendEmailUrl;
}

export interface RediEvent {
  eventId: number;
  courseTitle: string;
  courseType: string;
  courseDate: string;
  courseDateSortable: string;
  courseStart: string;
  courseEnd: string;
  courseVenue: string;
  courseStatus: string;
  courseCap: number;
  bookedCount: number;
  availableSpots: number;
}

export interface RediParticipant {
  id: number;
  eventId: number;
  givenName: string;
  surname: string;
  mail: string;
  qhPayroll: string;
  phone: string;
  stream: string;
  workArea: string;
  facility: string;
  lineManagerMail: string;
  bookingContactMail: string;
  bookingStatus: string;
  level: string;
  courseTitle: string;
  courseType: string;
  courseDate: string;
}

export interface EventAvailabilityResponse {
  success: boolean;
  count: number;
  events: RediEvent[];
}

export interface ParticipantLookupResponse {
  success: boolean;
  count: number;
  participants: RediParticipant[];
}

export interface SendEmailOptions {
  importance?: "Low" | "Normal" | "High";
}

interface RediApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status >= 500 && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`REdI API returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`REdI API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`REdI API timeout, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error("REdI API request timed out after retries");
      }
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`REdI API error: ${err}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }

  throw new Error("REdI API: max retries exceeded");
}

export async function fetchAvailableEvents(): Promise<RediEvent[]> {
  requireUrl(config.redi.eventAvailabilityUrl, "REDI_EVENT_AVAILABILITY_URL");
  console.log("Fetching available events from REdI API");
  const result = await apiFetch<EventAvailabilityResponse>(
    config.redi.eventAvailabilityUrl
  );
  console.log(`Fetched ${result.count} events`);
  return result.events;
}

export async function fetchFacultyAvailability(): Promise<RediEvent[]> {
  requireUrl(config.redi.facultyAvailabilityUrl, "REDI_FACULTY_AVAILABILITY_URL");
  console.log("Fetching faculty availability from REdI API");
  const result = await apiFetch<EventAvailabilityResponse>(
    config.redi.facultyAvailabilityUrl
  );
  console.log(`Fetched ${result.count} faculty events`);
  return result.events;
}

export async function lookupParticipant(
  email: string
): Promise<RediParticipant[]> {
  requireUrl(config.redi.participantLookupUrl, "REDI_PARTICIPANT_LOOKUP_URL");
  console.log("Looking up participant by email");
  const url = `${config.redi.participantLookupUrl}?email=${encodeURIComponent(email)}`;
  const result = await apiFetch<ParticipantLookupResponse>(url);
  console.log(`Found ${result.count} participant records`);
  return result.participants;
}

export async function upsertParticipant(
  data: Record<string, unknown>
): Promise<RediApiResponse<unknown>> {
  requireUrl(config.redi.participantUpsertUrl, "REDI_PARTICIPANT_UPSERT_URL");
  console.log("Upserting participant in REdI");
  const result = await apiFetch<RediApiResponse<unknown>>(
    config.redi.participantUpsertUrl,
    { method: "POST", body: JSON.stringify(data) }
  );
  console.log("Participant upsert result:", result.success);
  return result;
}

export async function upsertEvent(
  data: Record<string, unknown>
): Promise<RediApiResponse<unknown>> {
  requireUrl(config.redi.eventUpsertUrl, "REDI_EVENT_UPSERT_URL");
  console.log("Upserting event in REdI");
  const result = await apiFetch<RediApiResponse<unknown>>(
    config.redi.eventUpsertUrl,
    { method: "POST", body: JSON.stringify(data) }
  );
  console.log("Event upsert result:", result.success);
  return result;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  options: SendEmailOptions = {}
): Promise<RediApiResponse<unknown>> {
  requireUrl(config.redi.sendEmailUrl, "REDI_SEND_EMAIL_URL");
  console.log("Sending email, subject:", subject);
  const result = await apiFetch<RediApiResponse<unknown>>(
    config.redi.sendEmailUrl,
    {
      method: "POST",
      body: JSON.stringify({
        to,
        subject,
        body,
        importance: options.importance ?? "Normal",
      }),
    }
  );
  console.log("Email send result:", result.success);
  return result;
}

export async function triggerEmailCertificate(
  data: Record<string, unknown>
): Promise<RediApiResponse<unknown>> {
  requireUrl(config.redi.emailCertificateUrl, "REDI_EMAIL_CERTIFICATE_URL");
  console.log("Triggering email/certificate via REdI API");
  const result = await apiFetch<RediApiResponse<unknown>>(
    config.redi.emailCertificateUrl,
    { method: "POST", body: JSON.stringify(data) }
  );
  console.log("Email/certificate trigger result:", result.success);
  return result;
}
