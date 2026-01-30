import { writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { query } from "../db.js";
import { config } from "../config.js";

interface CourseInfo {
  course_id: string;
  course_name: string;
  course_date: string;
  course_coordinator: string | null;
}

interface ParticipantInfo {
  participant_id: string;
  candidate_name: string; // Database column name (not changed)
  payroll_number: string | null;
  designation: string | null;
  work_area: string | null;
  assessment_role: string;
}

interface ComponentInfo {
  component_id: string;
  component_name: string;
  component_order: number;
}

interface AssessmentRow {
  participant_id: string;
  component_id: string;
  component_name: string;
  component_feedback: string | null;
  is_passed_quick: boolean;
  assessor_name: string | null;
}

interface OutcomeScoreRow {
  participant_id: string;
  component_id: string;
  component_name: string;
  outcome_id: string;
  outcome_text: string;
  outcome_type: string;
  bondy_score: string | null;
  binary_score: string | null;
  assessor_name: string | null;
}

interface OverallRow {
  participant_id: string;
  overall_feedback: string | null;
  engagement_score: number | null;
  team_leader_outcome: string | null;
  team_member_outcome: string | null;
  recommended_action: string | null;
}

interface ReportData {
  course: CourseInfo;
  participants: ParticipantInfo[];
  components: ComponentInfo[];
  assessments: AssessmentRow[];
  outcomeScores: OutcomeScoreRow[];
  overalls: Map<string, OverallRow>;
}

const ENGAGEMENT_LABELS: Record<number, { emoji: string; label: string }> = {
  5: { emoji: "Excellent", label: "Excellent engagement" },
  4: { emoji: "Good", label: "Good engagement" },
  3: { emoji: "Adequate", label: "Adequate engagement" },
  2: { emoji: "Poor", label: "Poor engagement" },
  1: { emoji: "Very Poor", label: "Very poor engagement" },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function fetchReportData(courseId: string): Promise<ReportData> {
  const courseResult = await query<CourseInfo>(
    `SELECT course_id, course_name, course_date::text, course_coordinator
     FROM courses WHERE course_id = $1`,
    [courseId]
  );
  if (courseResult.rows.length === 0) {
    throw new Error(`Course not found: ${courseId}`);
  }
  const course = courseResult.rows[0]!;

  const participantsResult = await query<ParticipantInfo>(
    `SELECT participant_id, candidate_name, payroll_number, designation,
            work_area, assessment_role
     FROM participants WHERE course_id = $1
     ORDER BY candidate_name`,
    [courseId]
  );

  const componentsResult = await query<ComponentInfo>(
    `SELECT tc.component_id, tc.component_name, tc.component_order
     FROM template_components tc
     JOIN courses c ON c.template_id = tc.template_id
     WHERE c.course_id = $1
     ORDER BY tc.component_order`,
    [courseId]
  );

  const assessmentsResult = await query<AssessmentRow>(
    `SELECT ca.participant_id, ca.component_id, tc.component_name,
            ca.component_feedback, ca.is_passed_quick,
            a.name AS assessor_name
     FROM component_assessments ca
     JOIN template_components tc ON tc.component_id = ca.component_id
     LEFT JOIN assessors a ON a.assessor_id = ca.last_modified_by
     WHERE ca.participant_id IN (
       SELECT participant_id FROM participants WHERE course_id = $1
     )`,
    [courseId]
  );

  const scoresResult = await query<OutcomeScoreRow>(
    `SELECT p.participant_id, tc.component_id, tc.component_name,
            os.outcome_id, tou.outcome_text, tou.outcome_type,
            os.bondy_score::text, os.binary_score::text,
            a.name AS assessor_name
     FROM outcome_scores os
     JOIN component_assessments ca ON ca.assessment_id = os.assessment_id
     JOIN participants p ON p.participant_id = ca.participant_id
     JOIN template_components tc ON tc.component_id = ca.component_id
     JOIN template_outcomes tou ON tou.outcome_id = os.outcome_id
     LEFT JOIN assessors a ON a.assessor_id = os.scored_by
     WHERE p.course_id = $1
     ORDER BY tc.component_order, tou.outcome_order`,
    [courseId]
  );

  const overallsResult = await query<OverallRow>(
    `SELECT oa.participant_id, oa.overall_feedback, oa.engagement_score,
            oa.team_leader_outcome::text, oa.team_member_outcome::text,
            oa.recommended_action::text
     FROM overall_assessments oa
     JOIN participants p ON p.participant_id = oa.participant_id
     WHERE p.course_id = $1`,
    [courseId]
  );

  const overalls = new Map<string, OverallRow>();
  for (const row of overallsResult.rows) {
    overalls.set(row.participant_id, row);
  }

  return {
    course,
    participants: participantsResult.rows,
    components: componentsResult.rows,
    assessments: assessmentsResult.rows,
    outcomeScores: scoresResult.rows,
    overalls,
  };
}

function generateMarkdown(data: ReportData): string {
  const { course, participants, components, assessments, outcomeScores, overalls } =
    data;
  const timestamp = new Date().toISOString();

  const completedAll = participants.filter((p) => {
    const overall = overalls.get(p.participant_id);
    return (
      overall?.team_leader_outcome === "PASS" ||
      overall?.team_member_outcome === "PASS"
    );
  }).length;

  const withIssues = participants.filter((p) => {
    const overall = overalls.get(p.participant_id);
    return (
      overall?.team_leader_outcome === "UNSUCCESSFUL_ATTEMPT" ||
      overall?.team_member_outcome === "UNSUCCESSFUL_ATTEMPT"
    );
  }).length;

  const lines: string[] = [];
  lines.push(`# Course Outcome Report`);
  lines.push(`**Course:** ${course.course_name}`);
  lines.push(`**Date:** ${course.course_date}`);
  lines.push(`**Coordinator:** ${course.course_coordinator ?? "N/A"}`);
  lines.push(`**Generated:** ${timestamp}`);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(`- Total Participants: ${participants.length}`);
  lines.push(`- Completed All Components: ${completedAll}`);
  lines.push(`- With Issues: ${withIssues}`);
  lines.push(``);
  lines.push(`## Participant Results`);

  for (const participant of participants) {
    const overall = overalls.get(participant.participant_id);
    const engagement = overall?.engagement_score
      ? ENGAGEMENT_LABELS[overall.engagement_score]
      : null;

    lines.push(``);
    lines.push(
      `### ${participant.candidate_name} (${participant.assessment_role})`
    );
    lines.push(
      `**Payroll:** ${participant.payroll_number ?? "N/A"} | **Work Area:** ${participant.work_area ?? "N/A"} | **Designation:** ${participant.designation ?? "N/A"}`
    );
    if (engagement) {
      lines.push(`**Engagement:** ${engagement.emoji} ${engagement.label}`);
    }
    lines.push(``);

    lines.push(`| Component | Status | Score Summary |`);
    lines.push(`|-----------|--------|---------------|`);

    for (const component of components) {
      const compScores = outcomeScores.filter(
        (s) =>
          s.participant_id === participant.participant_id &&
          s.component_id === component.component_id
      );

      const assessment = assessments.find(
        (a) =>
          a.participant_id === participant.participant_id &&
          a.component_id === component.component_id
      );

      let status = "NOT STARTED";
      if (assessment?.is_passed_quick) {
        status = "QUICK PASS";
      } else if (compScores.length > 0) {
        status = "COMPLETE";
      }

      const independentCount = compScores.filter(
        (s) => s.bondy_score === "INDEPENDENT"
      ).length;
      const totalCount = compScores.length;
      const scoreSummary =
        totalCount > 0
          ? `${independentCount}/${totalCount} Independent`
          : "No scores";

      lines.push(
        `| ${component.component_name} | ${status} | ${scoreSummary} |`
      );
    }

    const feedbacks = assessments.filter(
      (a) =>
        a.participant_id === participant.participant_id && a.component_feedback
    );
    if (feedbacks.length > 0) {
      lines.push(``);
      lines.push(`**Feedback:**`);
      for (const fb of feedbacks) {
        lines.push(
          `- ${fb.component_name}: "${fb.component_feedback}" -- ${fb.assessor_name ?? "Unknown"}`
        );
      }
    }

    const outcomeLabel =
      overall?.team_leader_outcome === "PASS" &&
      (overall?.team_member_outcome === "PASS" ||
        participant.assessment_role === "TEAM_LEADER")
        ? "PASS"
        : overall?.team_leader_outcome === "UNSUCCESSFUL_ATTEMPT" ||
            overall?.team_member_outcome === "UNSUCCESSFUL_ATTEMPT"
          ? "UNSUCCESSFUL"
          : "PENDING";

    lines.push(``);
    lines.push(`**Overall:** ${outcomeLabel}`);
    if (overall?.overall_feedback) {
      lines.push(`**Overall Feedback:** "${overall.overall_feedback}"`);
    }
    if (overall?.recommended_action) {
      lines.push(
        `**Recommended Action:** ${overall.recommended_action.replace(/_/g, " ")}`
      );
    }
    lines.push(``);
    lines.push(`---`);
  }

  return lines.join("\n");
}

function generateCsv(data: ReportData): string {
  const { participants, outcomeScores, overalls, assessments } = data;

  const header = [
    "Participant Name",
    "Payroll",
    "Designation",
    "WorkArea",
    "Role",
    "Component",
    "Outcome",
    "Score",
    "Assessor",
    "Feedback",
    "Engagement",
    "OverallOutcome",
  ].join(",");

  const rows: string[] = [header];

  for (const participant of participants) {
    const overall = overalls.get(participant.participant_id);
    const engagement = overall?.engagement_score?.toString() ?? "";

    const outcomeLabel =
      overall?.team_leader_outcome === "PASS" &&
      (overall?.team_member_outcome === "PASS" ||
        participant.assessment_role === "TEAM_LEADER")
        ? "PASS"
        : overall?.team_leader_outcome === "UNSUCCESSFUL_ATTEMPT" ||
            overall?.team_member_outcome === "UNSUCCESSFUL_ATTEMPT"
          ? "UNSUCCESSFUL"
          : "PENDING";

    const participantScores = outcomeScores.filter(
      (s) => s.participant_id === participant.participant_id
    );

    if (participantScores.length === 0) {
      rows.push(
        csvRow([
          participant.candidate_name,
          participant.payroll_number ?? "",
          participant.designation ?? "",
          participant.work_area ?? "",
          participant.assessment_role,
          "",
          "",
          "",
          "",
          "",
          engagement,
          outcomeLabel,
        ])
      );
      continue;
    }

    for (const score of participantScores) {
      const scoreValue = score.bondy_score ?? score.binary_score ?? "";
      const assessment = assessments.find(
        (a) =>
          a.participant_id === participant.participant_id &&
          a.component_id === score.component_id
      );
      const feedback = assessment?.component_feedback ?? "";

      rows.push(
        csvRow([
          participant.candidate_name,
          participant.payroll_number ?? "",
          participant.designation ?? "",
          participant.work_area ?? "",
          participant.assessment_role,
          score.component_name,
          score.outcome_text,
          scoreValue,
          score.assessor_name ?? "",
          feedback,
          engagement,
          outcomeLabel,
        ])
      );
    }
  }

  return rows.join("\n");
}

function csvRow(values: string[]): string {
  return values
    .map((v) => {
      if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    })
    .join(",");
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

export async function generateCourseReport(
  courseId: string
): Promise<{ markdownPath: string; csvPath: string }> {
  console.log(`Generating report for course: ${courseId}`);
  const data = await fetchReportData(courseId);

  const markdown = generateMarkdown(data);
  const csv = generateCsv(data);

  const baseName = `${sanitizeFilename(data.course.course_name)}_${data.course.course_date}_outcome-report`;
  const markdownPath = join(config.reportDir, `${baseName}.md`);
  const csvPath = join(config.reportDir, `${baseName}.csv`);

  await writeFile(markdownPath, markdown, "utf-8");
  await writeFile(csvPath, csv, "utf-8");

  console.log(`Report saved: ${markdownPath}`);
  console.log(`CSV saved: ${csvPath}`);

  return { markdownPath, csvPath };
}

export async function generateAllDailyReports(): Promise<
  { courseId: string; markdownPath: string; csvPath: string }[]
> {
  const today = new Date().toISOString().split("T")[0];
  console.log(`Generating daily reports for: ${today}`);

  const coursesResult = await query<{ course_id: string }>(
    `SELECT course_id FROM courses WHERE course_date = $1`,
    [today]
  );

  const results: { courseId: string; markdownPath: string; csvPath: string }[] =
    [];

  for (const course of coursesResult.rows) {
    try {
      const report = await generateCourseReport(course.course_id);
      results.push({ courseId: course.course_id, ...report });
    } catch (err) {
      console.error(
        `Failed to generate report for course ${course.course_id}:`,
        err
      );
    }
  }

  console.log(`Generated ${results.length} daily reports`);
  return results;
}

export async function listReports(): Promise<string[]> {
  try {
    const files = await readdir(config.reportDir);
    return files.filter((f) => f.endsWith(".md") || f.endsWith(".csv"));
  } catch {
    return [];
  }
}

export function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^# (.+)$/gm, (_match, content) => `<h1>${escapeHtml(content)}</h1>`)
    .replace(/^## (.+)$/gm, (_match, content) => `<h2>${escapeHtml(content)}</h2>`)
    .replace(/^### (.+)$/gm, (_match, content) => `<h3>${escapeHtml(content)}</h3>`)
    .replace(/\*\*(.+?)\*\*/g, (_match, content) => `<strong>${escapeHtml(content)}</strong>`)
    .replace(/^- (.+)$/gm, (_match, content) => `<li>${escapeHtml(content)}</li>`)
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(
      /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g,
      (_match, headerRow: string, bodyRows: string) => {
        const headers = headerRow
          .split("|")
          .map((h: string) => h.trim())
          .filter(Boolean);
        const headerHtml = headers
          .map((h: string) => `<th>${escapeHtml(h)}</th>`)
          .join("");

        const rows = bodyRows
          .trim()
          .split("\n")
          .map((row: string) => {
            const cells = row
              .split("|")
              .map((c: string) => c.trim())
              .filter(Boolean);
            return `<tr>${cells.map((c: string) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`;
          })
          .join("");

        return `<table border="1" cellpadding="4" cellspacing="0"><thead><tr>${headerHtml}</tr></thead><tbody>${rows}</tbody></table>`;
      }
    )
    .replace(/^---$/gm, "<hr>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/^(?!<[hultdbo])/gm, (line) =>
      line.trim() ? `<p>${escapeHtml(line)}</p>` : ""
    );
}
