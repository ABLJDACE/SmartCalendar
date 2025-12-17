// components/EditTaskModal.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./EditTaskModal.module.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}

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

function buildDeadlineDate(dateStr, time12, ampm) {
  if (!dateStr) return null;
  const [y, mo, d] = dateStr.split("-").map(Number);
  if (!y || !mo || !d) return null;
  const { h, m } = to24Hour(time12, ampm);
  const dt = new Date(y, mo - 1, d, h, m, 0, 0);
  return isNaN(dt.getTime()) ? null : dt;
}

function splitFromISO(iso) {
  if (!iso) return { date: "", time: "", ampm: "PM" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "", ampm: "PM" };

  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;

  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${h}:${m}`,
    ampm,
  };
}

export default function EditTaskModal({ isOpen, task, onClose, onSave }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [sessions, setSessions] = useState(1);
  const [priority, setPriority] = useState("Medium");
  const [done, setDone] = useState(false);

  const [deadlineDate, setDeadlineDate] = useState("");
  const [time12, setTime12] = useState("");
  const [ampm, setAmpm] = useState("PM");

  const [showConfirm, setShowConfirm] = useState(false);
  const pendingRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !task) return;

    setName(task.name || "");
    setDuration(task.duration || 60);
    setSessions(task.sessions || 1);
    setPriority(task.priority || "Medium");
    setDone(!!task.done);

    const split = splitFromISO(task.deadline);
    setDeadlineDate(split.date);
    setTime12(split.time);
    setAmpm(split.ampm);
  }, [isOpen, task]);

  const deadlineObj = useMemo(
    () => buildDeadlineDate(deadlineDate, time12, ampm),
    [deadlineDate, time12, ampm]
  );

  const isPast = (d) => d && d.getTime() < Date.now();

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = {
      ...task,
      name,
      duration: Number(duration),
      sessions: Number(sessions),
      priority,
      done,
      deadline: deadlineObj ? deadlineObj.toISOString().slice(0, 16) : null,
    };

    if (deadlineObj && isPast(deadlineObj)) {
      pendingRef.current = updated;
      setShowConfirm(true);
      return;
    }

    onSave(updated);
    onClose();
  };

  const confirmPast = (ok) => {
    if (ok && pendingRef.current) {
      onSave(pendingRef.current);
      onClose();
    }
    pendingRef.current = null;
    setShowConfirm(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Edit Task</h3>

        <label>Task Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Duration</label>
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

          <div className={styles.field}>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
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
        </div>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={done}
            onChange={(e) => setDone(e.target.checked)}
          />
          Mark complete
        </label>

        <div className={styles.actions}>
          <button onClick={handleSave} className={styles.saveBtn}>
            Save
          </button>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
        </div>
      </div>

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
    </div>
  );
}
