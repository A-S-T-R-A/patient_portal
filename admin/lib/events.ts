type Filter = { patientId?: string; doctorId?: string };

const subscribers = new Map<
  string,
  {
    controller: ReadableStreamDefaultController;
    filter?: Filter;
    heartbeat?: ReturnType<typeof setInterval>;
  }
>();

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function subscribe(filter?: Filter) {
  const stream = new ReadableStream({
    start(controller) {
      const id = makeId();
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`:heartbeat\n\n`));
        } catch {}
      }, 25000);
      subscribers.set(id, { controller, filter, heartbeat });
      controller.enqueue(
        new TextEncoder().encode(`event: ready\ndata: {"ok":true}\n\n`)
      );
    },
    cancel(reason) {
      // cleanup dangling subscribers
      for (const [key, sub] of subscribers.entries()) {
        if (
          sub.controller.desiredSize === null ||
          sub.controller === undefined
        ) {
          if (sub.heartbeat) clearInterval(sub.heartbeat);
          subscribers.delete(key);
        }
      }
    },
  });
  return stream;
}

export function broadcast(event: string, data: any, scope?: Filter) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const sub of subscribers.values()) {
    const f = sub.filter || {};
    if (scope?.patientId && f.patientId && scope.patientId !== f.patientId)
      continue;
    if (scope?.doctorId && f.doctorId && scope.doctorId !== f.doctorId)
      continue;
    try {
      sub.controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      // ignore
    }
  }
}
