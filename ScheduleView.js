// components/ScheduleView.js
import React from "react";
import styles from "./ScheduleView.module.css";

export default function ScheduleView({ plan, completed, toggleSession, formatDate }) {
  return (
    <div className={styles.schedule}>
      {plan.map((day) => {
        const total = day.tasks.length;
        const done = day.tasks.filter((t, i) => completed[`${day.date}-${t.taskId}-${i}`]).length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <div key={day.date} className={styles.day}>
            <h3 className={styles.dayHeader}>
              {formatDate(day.date)} — {percent}% complete
            </h3>

            <div className={styles.dayTasks}>
              {day.tasks.map((t, i) => {
                const key = `${day.date}-${t.taskId}-${i}`;
                const isDone = !!completed[key];
                return (
                  <div key={key} className={`${styles.task} ${isDone ? styles.completed : ""}`}>
                    <div className={styles.taskInfo}>
                      <span className={styles.time}>{t.start} - {t.end}</span>
                      <span className={styles.name}>{t.name}</span>
                      <span className={`${styles.priority} ${styles[t.priority.toLowerCase()]}`}>
                        {t.priority}
                      </span>
                      <span className={styles.session}>
                        ({t.sessionIndex}/{t.totalSessions})
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleSession(t.taskId, day.date, i)}
                      title="Mark complete"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
