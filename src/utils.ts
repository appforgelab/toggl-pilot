export function formatDuration(seconds: number): string {
  if (seconds < 0) {
    seconds = Math.floor(Date.now() / 1000) + seconds;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${String(m).padStart(2, '0')}m`;
}

export function parseDuration(dur: string): number {
  const match = dur.match(/^(\d+)h(\d+)m$/);
  if (match) return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60;
  const hours = dur.match(/^(\d+)h$/);
  if (hours) return parseInt(hours[1]) * 3600;
  const mins = dur.match(/^(\d+)m$/);
  if (mins) return parseInt(mins[1]) * 60;
  throw new Error(`Invalid duration: ${dur}. Use format like 1h30m, 2h, 45m`);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildStartTime(at: string): string {
  const today = new Date().toISOString().split('T')[0];
  const d = new Date(`${today}T${at}:00`);
  if (isNaN(d.getTime())) throw new Error(`Invalid time: ${at}. Use HH:MM format.`);
  return d.toISOString();
}

export function parseDateArg(args: string[]): Date {
  const idx = args.indexOf('-d') !== -1 ? args.indexOf('-d') : args.indexOf('--date');
  if (idx !== -1 && args[idx + 1]) {
    const d = new Date(args[idx + 1] + 'T12:00:00');
    if (!isNaN(d.getTime())) return d;
    throw new Error(`Invalid date: ${args[idx + 1]}`);
  }
  return new Date();
}
