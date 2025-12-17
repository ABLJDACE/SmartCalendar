// components/Calendar.js
import React, { useEffect, useMemo, useState } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "./Calendar.module.css";
import EventModal from "./EventModal";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// Helper: 12-hour label for tooltips, etc.
function fmt12(d) {
  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = (hours % 12) || 12;
  return `${hour12}:${mins} ${ampm}`;
}

// LocalStorage key just for calendar events (separate from tasks & scheduler)
const LS_KEY = "calendarEvents";

export default function Calendar() {
  // Personal events (not tasks)
  const [events, setEvents] = useState([]);
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Load events on mount
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const revived = (raw || []).map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
      setEvents(revived);
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      const toStore = events.map((e) => ({
        ...e,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
      }));
      localStorage.setItem(LS_KEY, JSON.stringify(toStore));
    } catch {}
  }, [events]);

  // Add new event
  const createEvent = (e) => {
    setEvents((prev) => [...prev, { ...e, id: e.id || makeId() }]);
  };

  // Update existing event
  const updateEvent = (e) => {
    setEvents((prev) => prev.map((x) => (x.id === e.id ? e : x)));
  };

  // Delete event
  const deleteEvent = (id) => {
    setEvents((prev) => prev.filter((x) => x.id !== id));
  };

  // Styling per event (subtle color options via e.color)
  const eventStyleGetter = (event) => {
    const bg = event.color || "#2563eb";
    return {
      style: {
        backgroundColor: bg,
        borderRadius: "8px",
        color: "white",
        border: "none",
        padding: "2px 6px",
        fontSize: "0.9rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      },
      title: `${event.title} • ${fmt12(event.start)}–${fmt12(event.end)}`,
    };
  };

  // When the user drags to select a slot, open modal to create an event
  const handleSelectSlot = ({ start, end }) => {
    setEditingEvent({
      id: null,
      title: "",
      start,
      end,
      allDay: false,
      description: "",
      color: "#2563eb",
    });
    setModalOpen(true);
  };

  // When the user clicks an event, open modal to edit/delete
  const handleSelectEvent = (ev) => {
    setEditingEvent({ ...ev });
    setModalOpen(true);
  };

  const allEvents = useMemo(() => events, [events]);

  return (
    <div className={styles.calendarContainer}>
      <BigCalendar
        localizer={localizer}
        events={allEvents}
        startAccessor="start"
        endAccessor="end"
        views={["month", "week", "day", "agenda"]}
        defaultView="week"
        style={{ height: "100%" }}
        popup
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
      />

      {modalOpen && editingEvent && (
        <EventModal
          initialEvent={editingEvent}
          onCancel={() => {
            setModalOpen(false);
            setEditingEvent(null);
          }}
          onCreate={(e) => {
            createEvent(e);
            setModalOpen(false);
            setEditingEvent(null);
          }}
          onUpdate={(e) => {
            updateEvent(e);
            setModalOpen(false);
            setEditingEvent(null);
          }}
          onDelete={(id) => {
            deleteEvent(id);
            setModalOpen(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}

function makeId() {
  return "ev_" + Math.random().toString(36).slice(2, 10);
}
