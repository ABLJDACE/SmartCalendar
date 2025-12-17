// components/TaskForm.js
import React, { useMemo, useRef, useState } from "react";
import styles from "./TaskForm.module.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Convert 12h time + AM/PM → 24h.
// If time missing, default to 11:59 PM (23:59)
function to24Hour(time12, ampm) {
  if (!time12) return { h: 23, m: 59 };

  const [hStr, mStr] = time12.split(":");
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr ?? "0", 10);

  if (Number.isNaN(h) || Number.isNaN(m)) return { h: 23, m: 59 };

  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;

  return { h, m };
}

// Build a local Date from date ("YYYY-MM-DD") and 12h time ("h:mm") + AM/PM.
// If date missing → null (no deadline)
function buildDeadlineDate(dateStr, time12, ampm) {
  if (!dateStr) return null;

  const [y, mo, d] = dateStr.split("-").map(Number);
  if (!y || !mo || !d) return null;

  const { h, m } = to24Hour(time12, ampm);
  const dt = new Date(y, mo - 1, d, h, m, 0, 0);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function TaskForm({ onAddTask }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [sessions, setSessions] = useState(1);
  const [priority, setPriority] = useState("Medium");

  const [deadlineDate, setDeadlineDate] = useState("");
  const [time12, setTime12] = useState("");
  const [ampm, setAmpm] = useState("PM");

  const [showConfirm, setShowConfirm] = useState(false);
  const pendingRef = useRef(null);

  const deadlineObj = useMemo(
    () => buildDeadlineDate(deadlineDate, time12, ampm),
    [deadlineDate, time12, ampm]
  );

  const isPast = (d) => d && d.getTime() < Date.now();

  const reset = () => {
    setName("");
    setDuration(60);
    setSessions(1);
    setPriority("Medium");
    setDeadlineDate("");
    setTime12("");
    setAmpm("PM");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      duration: Number(duration),
      sessions: Number(sessions),
      priority,
      deadline: deadlineObj ? deadlineObj.toISOString().slice(0, 16) : null,
    };

    if (deadlineObj && isPast(deadlineObj)) {
      pendingRef.current = payload;
      setShowConfirm(true);
      return;
    }

    onAddTask(payload);
    reset();
  };

  const confirmPast = (ok) => {
    if (ok && pendingRef.current) onAddTask(pendingRef.current);
    pendingRef.current = null;
    setShowConfirm(false);
    reset();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Task Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Duration (min)</label>
            <input
              type="number"
              min="5"
              step="5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Sessions</label>
            <input
              type="number"
              min="1"
              value={sessions}
              onChange={(e) => setSessions(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Deadline Date</label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Deadline Time</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="--:--"
                value={time12}
                onChange={(e) => setTime12(e.target.value.replace(/[^\d:]/g, ""))}
              />
              <button
                type="button"
                onClick={() => setAmpm((p) => (p === "AM" ? "PM" : "AM"))}
              >
                {ampm}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          <div className={styles.fieldButton}>
            <button type="submit" className={styles.addButton}>
              ➕ Add Task
            </button>
          </div>
        </div>
      </form>

      {showConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmPopup}>
            <p>This deadline is in the past. Continue?</p>
            <div className={styles.confirmButtons}>
              <button onClick={() => confirmPast(true)}>Yes</button>
              <button onClick={() => confirmPast(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
