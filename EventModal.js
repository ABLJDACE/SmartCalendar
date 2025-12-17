// components/EventModal.js
import React, { useEffect, useState } from "react";
import styles from "./EventModal.module.css";

// Helpers
function toLocalInputValue(d) {
  // Return value suitable for <input type="datetime-local">
  // yyyy-MM-ddThh:mm (local)
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}
function fromLocalInputValue(v) {
  // v is "yyyy-MM-ddThh:mm" -> local Date
  return v ? new Date(v) : new Date();
}

const COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#e11d48", // rose
  "#f59e0b", // amber
  "#9333ea", // purple
  "#06b6d4", // cyan
];

export default function EventModal({
  initialEvent,
  onCancel,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const isEditing = !!initialEvent?.id;
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [start, setStart] = useState(initialEvent?.start || new Date());
  const [end, setEnd] = useState(initialEvent?.end || new Date(start.getTime() + 60 * 60000));
  const [allDay, setAllDay] = useState(!!initialEvent?.allDay);
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [color, setColor] = useState(initialEvent?.color || "#2563eb");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
  }, [title, start, end]);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!allDay && end <= start) {
      setError("End time must be after start time");
      return;
    }

    const payload = {
      id: initialEvent?.id || null,
      title: title.trim(),
      start: allDay ? startOfDay(start) : start,
      end: allDay ? endOfDay(end) : end,
      allDay,
      description: description.trim(),
      color,
    };

    if (isEditing) onUpdate(payload);
    else onCreate(payload);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h3>{isEditing ? "Edit Event" : "Add Event"}</h3>

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Start</label>
              <input
                type="datetime-local"
                value={toLocalInputValue(start)}
                onChange={(e) => setStart(fromLocalInputValue(e.target.value))}
                disabled={allDay}
              />
            </div>

            <div className={styles.field}>
              <label>End</label>
              <input
                type="datetime-local"
                value={toLocalInputValue(end)}
                onChange={(e) => setEnd(fromLocalInputValue(e.target.value))}
                disabled={allDay}
              />
            </div>
          </div>

          <div className={styles.row}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />
              All day
            </label>

            <div className={styles.colors}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={styles.colorSwatch}
                  style={{
                    background: c,
                    outline: c === color ? "3px solid rgba(0,0,0,0.2)" : "none",
                  }}
                  onClick={() => setColor(c)}
                  title="Event color"
                />
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            {isEditing && (
              <button
                type="button"
                className={styles.delete}
                onClick={() => onDelete(initialEvent.id)}
                title="Delete event"
              >
                Delete
              </button>
            )}

            <div style={{ flex: 1 }} />

            <button type="button" className={styles.cancel} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className={styles.save}>
              {isEditing ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function startOfDay(d) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}
function endOfDay(d) {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}
