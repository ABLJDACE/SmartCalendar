// components/Settings.js
import React, { useEffect, useState, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./Settings.module.css";

// ----- Helpers: 24h <-> Date <-> display -----
function hhmmToDate(hhmm) {
  const [h = "09", m = "00"] = (hhmm || "09:00").split(":");
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d;
}

function dateToHHMM(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function format12(d) {
  const pad = (n) => String(n).padStart(2, "0");
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  // two-digit hour for consistent width
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

function stepHHMM(hhmm, deltaMinutes) {
  const d = hhmmToDate(hhmm);
  d.setMinutes(d.getMinutes() + deltaMinutes);
  return dateToHHMM(d);
}

export default function Settings({ settings = null, onSave }) {
  const [workWindows, setWorkWindows] = useState([{ start: "09:00", end: "17:00" }]);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoCheckOff, setAutoCheckOff] = useState(false);

  // keep refs to hidden pickers so we can open them from the clock button
  const pickerRefs = useRef({}); // keys: `${i}-start`, `${i}-end`

  useEffect(() => {
    try {
      const stored = settings || JSON.parse(localStorage.getItem("settings") || "null");
      if (stored) {
        if (Array.isArray(stored.workWindows) && stored.workWindows.length > 0) {
          setWorkWindows(stored.workWindows);
        }
        setIncludeWeekends(!!stored.includeWeekends);
        if ("autoCheckOff" in stored) setAutoCheckOff(!!stored.autoCheckOff);

        const isDark = stored.theme ? stored.theme === "dark" : false;
        setDarkMode(isDark);
        document.documentElement.classList.toggle("dark", isDark);
        if (stored.theme) localStorage.setItem("theme", stored.theme);
      }

      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const savedTheme = localStorage.getItem("theme");
      const isDarkFinal = savedTheme ? savedTheme === "dark" : systemDark || darkMode;
      document.documentElement.classList.toggle("dark", isDarkFinal);
      setDarkMode(isDarkFinal);
    } catch {
      /* ignore */
    }
  }, [settings]);

  const applyTheme = (enableDark) => {
    document.documentElement.classList.toggle("dark", enableDark);
    localStorage.setItem("theme", enableDark ? "dark" : "light");
    setDarkMode(enableDark);
  };

  const save = () => {
    const s = {
      workWindows,
      includeWeekends,
      theme: darkMode ? "dark" : "light",
      autoCheckOff,
    };
    localStorage.setItem("settings", JSON.stringify(s));
    if (typeof onSave === "function") onSave(s);
  };

  const setDefaults = () => {
    const defaults = {
      workWindows: [{ start: "09:00", end: "17:00" }],
      includeWeekends: true,
      autoCheckOff: true,
      theme: "light",
    };
    setWorkWindows(defaults.workWindows);
    setIncludeWeekends(true);
    setAutoCheckOff(true);
    setDarkMode(false);
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
    localStorage.setItem("settings", JSON.stringify(defaults));
    if (typeof onSave === "function") onSave(defaults);
  };

  const updateWindowFromDate = (i, key, dateObj) => {
    if (!(dateObj instanceof Date)) return;
    const next = [...workWindows];
    next[i] = { ...next[i], [key]: dateToHHMM(dateObj) };
    setWorkWindows(next);
  };

  const updateWindowStep = (i, key, delta) => {
    const next = [...workWindows];
    next[i] = { ...next[i], [key]: stepHHMM(next[i][key], delta) };
    setWorkWindows(next);
  };

  const addWindow = () =>
    setWorkWindows([...workWindows, { start: "09:00", end: "17:00" }]);

  const removeWindow = (i) =>
    setWorkWindows(workWindows.filter((_, x) => x !== i));

  const openPicker = (i, key) => {
    const k = `${i}-${key}`;
    pickerRefs.current[k]?.setOpen(true);
  };

  return (
    <div className={styles.settings}>
      <h3>Settings</h3>

      {/* WORK PERIODS */}
      <div className={styles.multiSection}>
        <h4>Work periods</h4>

        {workWindows.map((win, i) => {
          const startKey = `${i}-start`;
          const endKey = `${i}-end`;

          return (
            <div key={i} className={styles.row}>
              {/* START */}
              <div className={styles.field}>
                <label>Start</label>

                <div className={styles.timeGroup}>
                  <input
                    type="text"
                    value={format12(hhmmToDate(win.start))}
                    readOnly
                    className={styles.timeInput}
                  />

                  {/* Clock + hidden anchor (prevents layout shift) */}
                  <div className={styles.clockWrap}>
                    <button
                      type="button"
                      className={styles.clockBtn}
                      onClick={() => openPicker(i, "start")}
                      title="Pick start time"
                    >
                      🕒
                    </button>

                    {/* Hidden DatePicker input anchored under the button */}
                    <DatePicker
                      ref={(r) => (pickerRefs.current[startKey] = r)}
                      selected={hhmmToDate(win.start)}
                      onChange={(d) => updateWindowFromDate(i, "start", d)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={5}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      popperPlacement="bottom-start"
                      showPopperArrow={false}
                      portalId="datepickers-portal"
                      className={styles.hiddenAnchorInput}
                    />
                  </div>

                  {/* Step group on the same side (right) */}
                  <div className={styles.stepGroup}>
                    <button
                      type="button"
                      className={`${styles.stepBtn} ${styles.minus}`}
                      onClick={() => updateWindowStep(i, "start", -5)}
                      title="Minus 5 minutes"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className={`${styles.stepBtn} ${styles.plus}`}
                      onClick={() => updateWindowStep(i, "start", +5)}
                      title="Plus 5 minutes"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* END */}
              <div className={styles.field}>
                <label>End</label>

                <div className={styles.timeGroup}>
                  <input
                    type="text"
                    value={format12(hhmmToDate(win.end))}
                    readOnly
                    className={styles.timeInput}
                  />

                  <div className={styles.clockWrap}>
                    <button
                      type="button"
                      className={styles.clockBtn}
                      onClick={() => openPicker(i, "end")}
                      title="Pick end time"
                    >
                      🕒
                    </button>

                    <DatePicker
                      ref={(r) => (pickerRefs.current[endKey] = r)}
                      selected={hhmmToDate(win.end)}
                      onChange={(d) => updateWindowFromDate(i, "end", d)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={5}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      popperPlacement="bottom-start"
                      showPopperArrow={false}
                      portalId="datepickers-portal"
                      className={styles.hiddenAnchorInput}
                    />
                  </div>

                  <div className={styles.stepGroup}>
                    <button
                      type="button"
                      className={`${styles.stepBtn} ${styles.minus}`}
                      onClick={() => updateWindowStep(i, "end", -5)}
                      title="Minus 5 minutes"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className={`${styles.stepBtn} ${styles.plus}`}
                      onClick={() => updateWindowStep(i, "end", +5)}
                      title="Plus 5 minutes"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {workWindows.length > 1 && (
                <button
                  className={styles.removeBtn}
                  onClick={() => removeWindow(i)}
                  title="Remove this period"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        <button className={styles.addBtn} onClick={addWindow}>
          + Add another period
        </button>
      </div>

      {/* OPTIONS */}
      <div className={styles.optionsBlock}>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={includeWeekends}
            onChange={(e) => setIncludeWeekends(e.target.checked)}
          />{" "}
          Include weekends
        </label>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={autoCheckOff}
            onChange={(e) => setAutoCheckOff(e.target.checked)}
          />{" "}
          Auto check-off completed sessions
        </label>

        <button
          className={`${styles.themeToggleBtn} ${darkMode ? styles.darkActive : ""}`}
          onClick={() => applyTheme(!darkMode)}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button className={styles.saveBtn} onClick={save}>
          Save Settings
        </button>

        <button
          onClick={setDefaults}
          style={{
            background: darkMode ? "var(--card-bg)" : "#e5e7eb",
            color: darkMode ? "#ffffff" : "#111827",
            border: darkMode ? "1.5px solid var(--border)" : "1.5px solid #d1d5db",
            borderRadius: "9999px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.2s ease",
          }}
        >
          Default Settings
        </button>
      </div>

      {/* Portal target for all date pickers (prevents layout shifts) */}
      <div id="datepickers-portal" />
    </div>
  );
}
