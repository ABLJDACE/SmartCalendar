// components/Dashboard.js
import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";

export default function Dashboard({ onNavigate, tasks }) {
  const [progress, setProgress] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [hasTasks, setHasTasks] = useState(false);

  useEffect(() => {
    try {
      const storedTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
      const plan = JSON.parse(localStorage.getItem("scheduledPlan") || "[]");
      const completed = JSON.parse(localStorage.getItem("completedSessions") || "{}");

      const effectiveTasks = Array.isArray(tasks) && tasks.length > 0 ? tasks : storedTasks;

      if (!effectiveTasks || effectiveTasks.length === 0) {
        // No active tasks — clear stale progress and stats
        localStorage.removeItem("scheduledPlan");
        localStorage.removeItem("completedSessions");
        setHasTasks(false);
        setProgress(0);
        setTasksCount(0);
        setCompletedCount(0);
        return;
      }

      setHasTasks(true);
      const totalSessions = Array.isArray(plan)
        ? plan.reduce((acc, d) => acc + d.tasks.length, 0)
        : 0;
      const done = Object.values(completed).filter(Boolean).length;
      setTasksCount(totalSessions);
      setCompletedCount(done);
      setProgress(totalSessions > 0 ? Math.round((done / totalSessions) * 100) : 0);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setProgress(0);
      setTasksCount(0);
      setCompletedCount(0);
    }
  }, [tasks]);

  const goToScheduler = () => {
    if (onNavigate) onNavigate("Scheduler");
  };

  const goToCalendar = () => {
    if (onNavigate) onNavigate("Calendar");
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.stats}>
        <div className={styles.card}>
          <h4>Total Scheduled Sessions</h4>
          <p>{tasksCount}</p>
        </div>
        <div className={styles.card}>
          <h4>Completed Sessions</h4>
          <p>{completedCount}</p>
        </div>
        <div className={styles.card}>
          <h4>Overall Progress</h4>
          <p>{progress}%</p>
        </div>
      </div>

      {!hasTasks && (
        <p
          style={{
            textAlign: "center",
            color: "var(--subtext)",
            marginTop: "10px",
          }}
        >
          No tasks available — add tasks to start scheduling.
        </p>
      )}

      <div className={styles.links}>
        <button onClick={goToScheduler}>View Scheduler</button>
        <button onClick={goToCalendar}>View Calendar</button>
      </div>
    </div>
  );
}
