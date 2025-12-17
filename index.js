// pages/index.js
import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import Dashboard from "../components/Dashboard";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import Calendar from "../components/Calendar";
import Settings from "../components/Settings";
import EditTaskModal from "../components/EditTaskModal";
import ScheduleTasksPage from "./scheduleTasks";
import scheduleTasks from "../utils/scheduleTasks";

export default function Home() {
  const [tab, setTab] = useState("Dashboard");
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [settings, setSettings] = useState({
    startTime: "09:00",
    endTime: "17:00",
    includeWeekends: false,
  });

  // Load persisted data
  useEffect(() => {
    try {
      const t = JSON.parse(localStorage.getItem("tasks") || "[]");
      if (Array.isArray(t)) setTasks(t);
      const s = JSON.parse(localStorage.getItem("settings") || "null");
      if (s) setSettings((prev) => ({ ...prev, ...s }));
    } catch (e) {
      console.warn("load error", e);
    }
  }, []);

  // Persist tasks + settings
  useEffect(() => {
    try {
      localStorage.setItem("tasks", JSON.stringify(tasks));
      localStorage.setItem("settings", JSON.stringify(settings));
    } catch {}
  }, [tasks, settings]);

  // ✅ Sync scheduler automatically when a task is deleted
  const deleteTask = (id) => {
    setTasks((p) => {
      const updated = p.filter((t) => t.id !== id);

      // Remove the task from Smart Scheduler plan as well
      try {
        const plan = JSON.parse(localStorage.getItem("scheduledPlan") || "[]");
        const filteredPlan = plan.map((day) => ({
          ...day,
          tasks: day.tasks.filter((session) => session.taskId !== id),
        }));
        localStorage.setItem("scheduledPlan", JSON.stringify(filteredPlan));

        // Remove from customPlan if it exists
        const custom = JSON.parse(localStorage.getItem("customPlan") || "[]");
        const updatedCustom = custom.map((day) => ({
          ...day,
          tasks: day.tasks.filter((session) => session.taskId !== id),
        }));
        localStorage.setItem("customPlan", JSON.stringify(updatedCustom));
      } catch (err) {
        console.warn("Failed to sync scheduler after deletion", err);
      }

      return updated;
    });
  };

  const addTask = (task) => {
    const normalized = {
      id: Date.now().toString(),
      name: String(task.name || "Untitled"),
      duration: Number(task.duration || 0),
      sessions: Number(task.sessions || 1),
      deadline: task.deadline || null,
      priority: task.priority || "Medium",
      done: !!task.done,
    };
    setTasks((p) => [...p, normalized]);
  };

  const toggleDone = (id) =>
    setTasks((p) =>
      p.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const updateTask = (updated) =>
    setTasks((p) => p.map((t) => (t.id === updated.id ? updated : t)));

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 16 }}>Smart Calendar</h1>

      <NavBar current={tab} onChange={setTab} />

      <main style={{ marginTop: 18 }}>
        {tab === "Dashboard" && <Dashboard tasks={tasks} onNavigate={setTab} />}

        {tab === "Tasks" && (
          <>
            <TaskForm onAddTask={addTask} />
            <TaskList
              tasks={tasks}
              onDelete={deleteTask}
              onToggle={toggleDone}
              onEdit={(t) => setEditingTask(t)}
            />
          </>
        )}

        {tab === "Calendar" && (
          <Calendar
            tasks={tasks}
            onAddTask={addTask}
            onEditTask={(task) => setEditingTask(task)}
          />
        )}

        {tab === "Settings" && <Settings settings={settings} onSave={setSettings} />}

        {tab === "Scheduler" && <ScheduleTasksPage />}
      </main>

      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={(t) => {
          updateTask(t);
          setEditingTask(null);
        }}
      />
    </div>
  );
}
