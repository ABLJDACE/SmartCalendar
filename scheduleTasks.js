// utils/scheduleTasks.js
// Time-aware multi-window scheduler with local (non-UTC) dates and 12h times.

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toTime12(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Build a YYYY-MM-DD from a local Date (no UTC conversion)
function localISOFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Create a Date at local midnight (or any local date) safely
function localDate(y, mIndex, d) {
  return new Date(y, mIndex, d, 0, 0, 0, 0);
}

// True if weekend (local)
function isWeekend(d) {
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

export default function scheduleTasks(
  tasks,
  workWindows = [{ start: "09:00", end: "17:00" }],
  includeWeekends = false
) {
  if (!Array.isArray(tasks) || tasks.length === 0) return [];
  if (!Array.isArray(workWindows) || workWindows.length === 0) {
    workWindows = [{ start: "09:00", end: "17:00" }];
  }

  // Normalize tasks
  const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };
  const normalized = tasks.map((t) => ({
    id: t.id || (`id_${Math.random().toString(36).slice(2, 10)}`),
    name: t.name || "Untitled Task",
    duration: Number(t.duration) || 60,
    sessions: Math.max(1, Number(t.sessions) || 1),
    deadline: t.deadline ? new Date(t.deadline) : null,
    priority: t.priority || "Medium",
  }));

  // Sort by earliest deadline, then priority weight
  normalized.sort((a, b) => {
    const ad = a.deadline ? a.deadline.getTime() : Infinity;
    const bd = b.deadline ? b.deadline.getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1);
  });

  // Build horizon (up to 60 days) from TODAY (local)
  const now = new Date();
  const todayLocal = localDate(now.getFullYear(), now.getMonth(), now.getDate());
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const days = [];
  for (let i = 0; i < 60; i++) {
    const d = localDate(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate() + i);
    if (!includeWeekends && isWeekend(d)) continue;

    // Build day windows (in minutes from midnight, with "used" minutes)
    const windows = workWindows.map((w) => {
      const startMin = toMinutes(w.start);
      const endMin = toMinutes(w.end);
      return {
        startMin,
        endMin,
        used: 0,
        slots: [],
      };
    });

    days.push({ date: localISOFromDate(d), dateObj: d, windows });
  }

  // Place tasks across the horizon
  for (const task of normalized) {
    let remaining = task.duration;
    const perSession = Math.ceil(task.duration / task.sessions);
    let sessionIndex = 0;

    for (const day of days) {
      // If a deadline exists and this day is AFTER deadline, skip it
      if (task.deadline) {
        const dd = localDate(day.dateObj.getFullYear(), day.dateObj.getMonth(), day.dateObj.getDate());
        if (dd > task.deadline) continue;
      }

      // For TODAY ONLY: adjust windows to respect "now" (skip past windows; clip the start)
      const isToday =
        day.dateObj.getFullYear() === todayLocal.getFullYear() &&
        day.dateObj.getMonth() === todayLocal.getMonth() &&
        day.dateObj.getDate() === todayLocal.getDate();

      for (const window of day.windows) {
        let windowStart = window.startMin;
        const windowEnd = window.endMin;

        // If today, start can't be before current time
        if (isToday) {
          // If the whole window ended before "now", skip it
          if (windowEnd <= nowMinutes) continue;
          // Otherwise, clip start to max(current time, configured start)
          windowStart = Math.max(windowStart, nowMinutes);
        }

        // The window capacity after what we've already used:
        let available = windowEnd - Math.max(windowStart, window.startMin + window.used);
        if (available <= 0) continue;

        // Fill sessions while there is room
        while (remaining > 0 && available >= perSession) {
          sessionIndex++;
          const startMin = Math.max(windowStart, window.startMin + window.used);
          const endMin = startMin + perSession;

          window.slots.push({
            taskId: task.id,
            name: task.name,
            start: toTime12(startMin),
            end: toTime12(endMin),
            minutes: perSession,
            priority: task.priority,
            sessionIndex,
            totalSessions: task.sessions,
            overdue: !!(task.deadline && day.dateObj > task.deadline),
          });

          window.used += perSession;
          remaining -= perSession;

          // Recompute available for the next potential session
          available = windowEnd - Math.max(windowStart, window.startMin + window.used);
        }

        if (remaining <= 0) break;
      }

      if (remaining <= 0) break;
    }
    // If remaining > 0 here, there wasn't enough time in the horizon; we simply leave them unscheduled
  }

  // Flatten per day
  const output = [];
  for (const day of days) {
    const tasksForDay = day.windows.flatMap((w) => w.slots);
    if (tasksForDay.length > 0) {
      // Sort by real start time (parse back from h:mm AM/PM for ordering)
      tasksForDay.sort((a, b) => parse12(a.start) - parse12(b.start));
      output.push({
        date: day.date, // YYYY-MM-DD local
        tasks: tasksForDay,
      });
    }
  }
  return output;
}

// Parse "h:mm AM/PM" to minutes (for sorting)
function parse12(str) {
  // e.g. "9:05 AM"
  const [time, ampm] = str.split(" ");
  const [h, m] = time.split(":").map(Number);
  let hour = h % 12;
  if (ampm === "PM") hour += 12;
  return hour * 60 + m;
}
