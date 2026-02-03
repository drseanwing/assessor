import { type Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import pg from "pg";
import { config } from "./config.js";

interface Subscription {
  courseId: string;
  participantIds: string[];
}

interface PresenceInfo {
  assessorId: string;
  assessorName: string;
  participantId: string;
  componentId: string | null;
  lastSeen: string;
}

interface ClientState {
  ws: WebSocket;
  subscription: Subscription | null;
  presence: PresenceInfo | null;
}

const clients = new Map<WebSocket, ClientState>();

export function setupWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    clients.set(ws, { ws, subscription: null, presence: null });

    ws.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        handleClientMessage(ws, message);
      } catch (err) {
        console.error("Invalid WebSocket message:", err);
      }
    });

    ws.on("close", () => {
      const state = clients.get(ws);
      const courseId = state?.subscription?.courseId;
      clients.delete(ws);
      if (courseId) {
        broadcastPresenceState(courseId);
      }
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
      clients.delete(ws);
    });
  });

  connectPgListener();

  console.log("WebSocket server initialized");
  return wss;
}

function isString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === "string");
}

function handleClientMessage(ws: WebSocket, message: Record<string, unknown>): void {
  const state = clients.get(ws);
  if (!state) return;

  if (!isString(message.type)) {
    ws.send(JSON.stringify({ type: "error", error: "Missing message type" }));
    return;
  }

  switch (message.type) {
    case "subscribe": {
      if (!isString(message.courseId)) {
        ws.send(JSON.stringify({ type: "error", error: "courseId is required" }));
        return;
      }
      state.subscription = {
        courseId: message.courseId,
        participantIds: isStringArray(message.participantIds) ? message.participantIds : [],
      };
      ws.send(
        JSON.stringify({
          type: "subscribed",
          courseId: state.subscription.courseId,
        })
      );
      sendCurrentPresence(ws, state.subscription.courseId);
      break;
    }

    case "presence": {
      if (!isString(message.assessorId) || !isString(message.assessorName) || !isString(message.participantId)) {
        ws.send(JSON.stringify({ type: "error", error: "assessorId, assessorName, and participantId are required" }));
        return;
      }
      state.presence = {
        assessorId: message.assessorId,
        assessorName: message.assessorName,
        participantId: message.participantId,
        componentId: isString(message.componentId) ? message.componentId : null,
        lastSeen: new Date().toISOString(),
      };
      broadcastPresenceState(state.subscription?.courseId || "");
      break;
    }

    case "ping": {
      ws.send(JSON.stringify({ type: "pong" }));
      break;
    }

    default: {
      ws.send(JSON.stringify({ type: "error", error: "Unknown message type" }));
    }
  }
}

function collectPresenceForCourse(courseId: string): PresenceInfo[] {
  const presenceList: PresenceInfo[] = [];
  for (const [, state] of clients.entries()) {
    if (state.subscription?.courseId === courseId && state.presence) {
      presenceList.push(state.presence);
    }
  }
  return presenceList;
}

function broadcastPresenceState(courseId: string): void {
  if (!courseId) return;
  const assessors = collectPresenceForCourse(courseId);
  const payload = JSON.stringify({ type: "presence_state", assessors });

  for (const [ws, state] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN && state.subscription?.courseId === courseId) {
      ws.send(payload);
    }
  }
}

function broadcastPresenceLeave(_sender: WebSocket, _presence: PresenceInfo): void {
  const senderState = clients.get(_sender);
  if (!senderState?.subscription) return;
  broadcastPresenceState(senderState.subscription.courseId);
}

function sendCurrentPresence(ws: WebSocket, courseId: string): void {
  const assessors = collectPresenceForCourse(courseId);
  if (assessors.length > 0) {
    ws.send(JSON.stringify({ type: "presence_state", assessors }));
  }
}

function broadcastAssessmentChange(payload: string): void {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(payload);
  } catch {
    console.error("Invalid PG NOTIFY payload:", payload);
    return;
  }

  const record = parsed.record as Record<string, unknown> | undefined;
  const participantId = record?.participant_id as string | undefined;

  // Send only metadata, not the full record (security: avoid leaking data over WebSocket)
  const message = JSON.stringify({
    type: "change",
    table: parsed.table,
    action: parsed.action,
    participantId: participantId || null,
  });

  for (const [ws, state] of clients.entries()) {
    if (ws.readyState !== WebSocket.OPEN) continue;
    if (!state.subscription) continue;

    if (
      !participantId ||
      state.subscription.participantIds.length === 0 ||
      state.subscription.participantIds.includes(participantId)
    ) {
      ws.send(message);
    }
  }
}

let pgReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pgReconnectDelay = 5000;
const PG_MAX_RECONNECT_DELAY = 300000; // 5 minutes

async function connectPgListener(): Promise<void> {
  if (pgReconnectTimer) {
    clearTimeout(pgReconnectTimer);
    pgReconnectTimer = null;
  }

  const client = new pg.Client({ connectionString: config.databaseUrl });
  let reconnecting = false;

  function scheduleReconnect(): void {
    if (reconnecting) return;
    reconnecting = true;
    try { client.end().catch(() => {}); } catch {}
    pgReconnectTimer = setTimeout(() => {
      pgReconnectTimer = null;
      connectPgListener();
    }, pgReconnectDelay);
    pgReconnectDelay = Math.min(pgReconnectDelay * 2, PG_MAX_RECONNECT_DELAY);
  }

  try {
    await client.connect();
    pgReconnectDelay = 5000; // Reset backoff on successful connect
    await client.query("LISTEN assessment_changes");
    console.log("Listening on PostgreSQL channel: assessment_changes");

    client.on("notification", (msg) => {
      if (msg.channel === "assessment_changes" && msg.payload) {
        broadcastAssessmentChange(msg.payload);
      }
    });

    client.on("error", (err) => {
      console.error("PG listener error:", err);
      scheduleReconnect();
    });

    client.on("end", () => {
      console.warn("PG listener disconnected, reconnecting...");
      scheduleReconnect();
    });
  } catch (err) {
    console.error("Failed to connect PG listener:", err);
    scheduleReconnect();
  }
}
