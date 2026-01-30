import { type Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
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
  const wss = new WebSocketServer({
    server,
    maxPayload: 64 * 1024, // 64KB max message size
    verifyClient: (info, callback) => {
      const url = new URL(info.req.url || "", `http://${info.req.headers.host}`);
      const token = url.searchParams.get("token");
      if (!token) {
        callback(false, 401, "Missing authentication token");
        return;
      }
      try {
        jwt.verify(token, config.jwtSecret);
        callback(true);
      } catch {
        callback(false, 401, "Invalid or expired token");
      }
    },
  });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected (authenticated)");

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
      if (state?.presence) {
        broadcastPresenceLeave(ws, state.presence);
      }
      clients.delete(ws);
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

function handleClientMessage(ws: WebSocket, message: Record<string, unknown>): void {
  const state = clients.get(ws);
  if (!state) return;

  switch (message.type) {
    case "subscribe": {
      state.subscription = {
        courseId: message.courseId as string,
        participantIds: (message.participantIds as string[]) || [],
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
      state.presence = {
        assessorId: message.assessorId as string,
        assessorName: message.assessorName as string,
        participantId: message.participantId as string,
        componentId: (message.componentId as string | null) || null,
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
      console.warn("Unknown WebSocket message type:", message.type);
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

  const message = JSON.stringify({
    type: "change",
    ...parsed,
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

async function connectPgListener(): Promise<void> {
  const client = new pg.Client({ connectionString: config.databaseUrl });

  try {
    await client.connect();
    await client.query("LISTEN assessment_changes");
    console.log("Listening on PostgreSQL channel: assessment_changes");

    client.on("notification", (msg) => {
      if (msg.channel === "assessment_changes" && msg.payload) {
        broadcastAssessmentChange(msg.payload);
      }
    });

    client.on("error", (err) => {
      console.error("PG listener error:", err);
      setTimeout(connectPgListener, 5000);
    });

    client.on("end", () => {
      console.warn("PG listener disconnected, reconnecting...");
      setTimeout(connectPgListener, 5000);
    });
  } catch (err) {
    console.error("Failed to connect PG listener:", err);
    setTimeout(connectPgListener, 5000);
  }
}
