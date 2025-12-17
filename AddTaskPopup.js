// components/AddTaskPopup.js
import React, { useMemo, useState } from "react";
import styles from "./AddTaskPopup.module.css";

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
  return new Date(y, mo - 1, d, h, m, 0, 0);
}

export default function AddTaskPopup({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [priority, setPriority] = useState("Medium");

  const [deadlineDate, setDeadlineDate] = useState("");
  const [time12, setTime12] = useState("");
  const [ampm, setAmpm] = useState("PM");

  const deadlineObj = useMemo(
    () => buildDeadlineDate(deadlineDate, time12, ampm),
    [deadlineDate, time12, ampm]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name,
      duration,
      priority,
      deadline: deadlineObj ? deadlineObj.toISOString().slice(0, 16) : null,
    });

    setName("");
    setDuration(60);
    setPriority("Medium");
    setDeadlineDate("");
    setTime12("");
    setAmpm("PM");
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h3>Add Task</h3>

        <form onSubmit={handleSubmit}>
          <label>Task Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label>Duration</label>
          <input type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} />

          <label>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <label>Deadline Date</label>
          <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />

          <label>Deadline Time</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="--:--"
              value={time12}
              onChange={(e) =>
                setTime12(e.target.value.replace(/[^\d:]/g, ""))
              }
            />
            <button type="button" onClick={() => setAmpm((p) => (p === "AM" ? "PM" : "AM"))}>
              {ampm}
            </button>
          </div>

          <div className={styles.buttons}>
            <button type="submit">Add</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
