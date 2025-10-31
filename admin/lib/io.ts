// Access Socket.IO server instance from API routes (set by custom server)
export function getIO(): any | null {
  return (global as any).__io || null;
}
