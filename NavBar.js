// components/NavBar.js
import React, { useEffect, useState } from "react";
import styles from "./NavBar.module.css";

export default function NavBar({ current, onChange }) {
  const tabs = ["Dashboard", "Tasks", "Calendar", "Settings", "Scheduler"];
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : systemPrefersDark;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`${styles.tab} ${current === tab ? styles.active : ""}`}
        >
          {tab}
        </button>
      ))}

      {/* Theme toggle */}
      <button onClick={toggleTheme} className={styles.themeToggle}>
        {darkMode ? "☀️" : "🌙"}
      </button>
    </nav>
  );
}
