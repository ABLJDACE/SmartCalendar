// components/TaskList.js
import React from "react";
import TaskItem from "./TaskItem";
import styles from "./TaskList.module.css";

export default function TaskList({ tasks = [], onDelete, onToggle, onEdit }) {
  if (!tasks || tasks.length === 0) return <div className={styles.empty}>No tasks yet.</div>;

  const upcoming = tasks.filter((t) => !t.done).sort((a,b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));
  const completed = tasks.filter((t) => t.done);

  return (
    <div>
      {upcoming.length > 0 && (
        <>
          <h4>Upcoming</h4>
          <div>
            {upcoming.map((t) => <TaskItem key={t.id} task={t} onDelete={onDelete} onToggle={onToggle} onEdit={onEdit} />)}
          </div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <h4 style={{ marginTop: 12 }}>Completed</h4>
          <div>
            {completed.map((t) => <TaskItem key={t.id} task={t} onDelete={onDelete} onToggle={onToggle} onEdit={onEdit} />)}
          </div>
        </>
      )}
    </div>
  );
}
