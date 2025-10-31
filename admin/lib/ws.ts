type Filter = { patientId?: string; doctorId?: string };

type SocketRecord = {
  socket: WebSocket;
  filter?: Filter;
  heartbeat?: number | ReturnType<typeof setInterval>;
};

const sockets = new Set<SocketRecord>();

export function attachSocket(
  socket: WebSocket,
  filter?: Filter,
  opts?: { apiBase: string }
) {
  const rec: SocketRecord = { socket, filter };

  // Basic heartbeat to keep connections alive on some providers
  try {
    rec.heartbeat = setInterval(() => {
      try {
        socket.send(JSON.stringify({ type: "heartbeat" }));
      } catch {}
    }, 25000);
  } catch {}

  sockets.add(rec);

  try {
    socket.send(JSON.stringify({ type: "ready", ok: true }));
  } catch {}

  socket.addEventListener("close", () => cleanup(rec));
  socket.addEventListener("error", () => cleanup(rec));

  // Handle inbound actions (send message, etc.)
  socket.addEventListener("message", async (event: MessageEvent) => {
    try {
      const msg = JSON.parse((event as any).data || "{}");
      if (msg?.type === "message.send") {
        const { patientId, sender, content } = msg?.data || {};
        if (!patientId || !content || !sender) return;
        const base = (opts?.apiBase || "/api").replace(/\/$/, "");
        await fetch(`${base}/patients/${patientId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender, content }),
        });
        // The POST route will broadcast to WS + SSE; nothing else to do here
      }
    } catch {}
  });
}

function cleanup(rec: SocketRecord) {
  try {
    if (rec.heartbeat) clearInterval(rec.heartbeat as any);
  } catch {}
  sockets.delete(rec);
}

export function wsBroadcast(event: string, data: any, scope?: Filter) {
  const payload = JSON.stringify({ type: event, data });
  for (const rec of sockets) {
    const f = rec.filter || {};
    if (scope?.patientId && f.patientId && scope.patientId !== f.patientId)
      continue;
    if (scope?.doctorId && f.doctorId && scope.doctorId !== f.doctorId)
      continue;
    try {
      rec.socket.send(payload);
    } catch {
      cleanup(rec);
    }
  }
}
