// components/TaskItem.js
import React from "react";
import styles from "./TaskItem.module.css";

export default function TaskItem({ task, onDelete, onToggle, onEdit }) {
  const overdue =
    task.deadline && new Date(task.deadline) < new Date() && !task.done;

  // ✅ Format deadline now includes the year
  const formatDeadline = (isoString) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric", // ✅ added year display
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      className={`${styles.item} ${
        overdue ? styles.overdue : ""
      } ${task.done ? styles.done : ""}`}
    >
      <div className={styles.left}>
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
          title="Mark as complete"
          className={styles.checkbox}
        />
        <div className={styles.detailsBlock}>
          <div className={styles.name}>{task.name}</div>
          <div className={styles.subdetails}>
            <span>
              {task.duration} min • {task.sessions} session
              {task.sessions > 1 ? "s" : ""} • {task.priority}
            </span>
            <span className={styles.deadline}>
              Deadline: {formatDeadline(task.deadline)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={() => onEdit(task)} title="Edit">
          ✏️
        </button>
        <button onClick={() => onDelete(task.id)} title="Delete">
          🗑
        </button>
      </div>
    </div>
  );
}
